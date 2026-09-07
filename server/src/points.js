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

export async function pointLogs(userId, limit = 50) {
  const rows = await queryAll('points_logs', { userId });
  return rows.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
}
