import { queryOne, queryAll, update, insert } from './db.js';

const RULES = { login: 10, activity: 5 };
const REWARD_NOTES = { login: '每日登录', activity: '完成今日任务' };

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export async function getPoints(userId) {
  const u = await queryOne('users', { id: userId });
  return u ? Number(u.points || 0) : 0;
}

async function changePoints(userId, amount) {
  const u = await queryOne('users', { id: userId });
  if (!u) return;
  const cur = Number(u.points || 0);
  await update('users', userId, { points: Math.max(0, cur + amount) });
}

export async function awardOnce(userId, type, { amount = RULES[type] || 0, note } = {}) {
  if (!amount) return false;
  const logs = await queryAll('points_logs', { userId });
  const t0 = startOfToday();
  if (logs.some(l => l.type === type && Number(l.createdAt) >= t0)) return false;
  await changePoints(userId, amount);
  await insert('points_logs', { userId, type, amount, note: note || REWARD_NOTES[type] || type, createdAt: Date.now() });
  return true;
}

/* 撤销某类型今天的积分（例如删除当天记录时回收完成奖励，防止刷分） */
export async function revokeType(userId, type) {
  const logs = await queryAll('points_logs', { userId });
  const t0 = startOfToday();
  const hit = logs.filter(l => l.type === type && Number(l.createdAt) >= t0);
  const total = hit.reduce((n, l) => n + Number(l.amount || 0), 0);
  if (total) await changePoints(userId, -total);
  return total;
}

export async function todayCount(userId, type) {
  const logs = await queryAll('points_logs', { userId });
  const t0 = startOfToday();
  return logs.filter(l => l.type === type && Number(l.createdAt) >= t0).length;
}

export const FREE_AI = 30;
export const MB = 1024 * 1024;
export const STORAGE_PER_POINT = 1 * 1024 * 1024; // 1 积分 = 1MB 永久

export async function convertToStorage(userId, points) {
  points = Math.floor(points);
  const u = await queryOne('users', { id: userId });
  if (!u) return { error: '用户不存在' };
  const cur = Number(u.points || 0);
  if (points < 1 || points > cur) return { error: '积分不足' };
  const bonus = Number(u.storage_bonus || 0) + points * STORAGE_PER_POINT;
  await update('users', userId, { points: cur - points, storage_bonus: bonus });
  await insert('points_logs', { userId, type: 'convert_storage', amount: -points, note: `积分转云盘 +${Math.round(points * STORAGE_PER_POINT / MB)}MB（永久）`, createdAt: Date.now() });
  return { points: cur - points, bonus };
}

export async function spendAiExtra(userId) {
  const u = await queryOne('users', { id: userId });
  const cur = Number((u && u.points) || 0);
  if (cur < 1) return { ok: false, error: 'AI 免费额度已用完且积分不足，先记录任务赚积分，明天再来吧' };
  await update('users', userId, { points: cur - 1 });
  await insert('points_logs', { userId, type: 'ai_extra', amount: -1, note: 'AI 超额使用 -1 积分', createdAt: Date.now() });
  return { ok: true, points: cur - 1 };
}

export async function pointLogs(userId, limit = 50) {
  const rows = await queryAll('points_logs', { userId });
  return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
