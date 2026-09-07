import express from 'express';
import { queryAll, queryOne, insert, update, remove } from '../db.js';
import { authMiddleware } from './auth.js';
import { awardOnce, revokeType, getPoints } from '../points.js';

const router = express.Router();
router.use(authMiddleware);

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
function now() { return new Date().toISOString(); }

const BASE_LIMIT = 500 * 1024 * 1024;
async function userLimit(userId) { const pts = await getPoints(userId); return BASE_LIMIT + Math.min(pts, 20000) * 1024 * 1024; }
const bytesOf = s => (s ? Math.floor(String(s).length * 0.75) : 0);
function bytesOfLog(l) {
  if (!l) return 0;
  return (l.files || []).reduce((n, f) => n + bytesOf(f && f.url), 0)
    + (l.images || []).reduce((n, u) => n + bytesOf(u), 0)
    + (l.items || []).reduce((n, it) => n + (it.img || []).reduce((m, u) => m + bytesOf(u), 0), 0);
}
async function allUserLogs(userId) {
  const projects = await queryAll('projects', { userId });
  const out = [];
  for (const p of projects) {
    const logs = await queryAll('day_logs', { projectId: p.id });
    out.push(...logs);
  }
  return out;
}
async function usedBytes(userId) {
  const logs = await allUserLogs(userId);
  return logs.reduce((n, l) => n + bytesOfLog(l), 0);
}
async function ensureCapacity(userId, excludeLog, addBytes) {
  const base = (await usedBytes(userId)) - bytesOfLog(excludeLog);
  const limit = await userLimit(userId);
  return base + addBytes <= limit;
}
function addedBytes(items, files, images) {
  let n = (items || []).reduce((a, it) => a + (it.img || []).reduce((b, u) => b + bytesOf(u), 0), 0);
  n += (files || []).reduce((a, f) => a + bytesOf(f && f.url), 0);
  n += (images || []).reduce((a, u) => a + bytesOf(u), 0);
  return n;
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => ({
    id: it && it.id ? String(it.id) : `${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    text: it && it.text !== undefined && it.text !== null ? String(it.text) : '',
    done: !!(it && it.done),
    img: Array.isArray(it && it.img) ? it.img.filter(u => u && typeof u === 'string').slice(0, 12) : [],
  }));
}
function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map(String).filter(u => u && u.length < 900000).slice(0, 30);
}
function normalizeFiles(files) {
  if (!Array.isArray(files)) return [];
  return files.map(f => ({
    name: String((f && f.name) || '文件').slice(0, 120),
    type: String((f && f.type) || ''),
    url: String((f && f.url) || ''),
  })).filter(f => f.url).slice(0, 20);
}
function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}
async function findOwnedProject(req, res) {
  const project = await queryOne('projects', { id: Number(req.params.id) });
  if (!project || project.userId !== req.user.id) {
    res.status(404).json({ error: '项目不存在' });
    return null;
  }
  return project;
}
async function getLog(projectId, date) {
  return queryOne('day_logs', { projectId, date });
}
async function getVersions(logId) {
  const all = await queryAll('log_versions', { logId });
  return all.slice().sort((a, b) => b.version - a.version);
}

router.get('/', async (req, res, next) => {
  try {
    const projects = await queryAll('projects', { userId: req.user.id });
    const out = [];
    for (const p of projects) {
      const logs = await queryAll('day_logs', { projectId: p.id });
      out.push({ ...p, logCount: logs.length, lastLogDate: logs.reduce((m, l) => (l.date > m ? l.date : m), '') || null });
    }
    out.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id);
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/storage', async (req, res, next) => {
  try { res.json({ used: await usedBytes(req.user.id), limit: await userLimit(req.user.id) }); }
  catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { name, startDate } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: '请填写项目名称' });
    if (!req.user.role) return res.status(400).json({ error: '请先选择身份' });
    if (startDate !== undefined && startDate !== null && startDate !== '' && !isValidDate(startDate)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const type = req.user.role === 'student' ? 'school' : 'company';
    const project = await insert('projects', { userId: req.user.id, name: String(name).trim(), type, startDate: startDate || null, createdAt: now() });
    res.json(project);
  } catch (e) { next(e); }
});

router.put('/:id', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { name, startDate } = req.body || {};
    const updates = {};
    if (name !== undefined) { if (!String(name).trim()) return res.status(400).json({ error: '项目名称不能为空' }); updates.name = String(name).trim(); }
    if (startDate !== undefined) { if (startDate !== null && startDate !== '' && !isValidDate(startDate)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' }); updates.startDate = startDate || null; }
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: '没有需要更新的内容' });
    const updated = await update('projects', project.id, updates);
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const logs = await queryAll('day_logs', { projectId: project.id });
    for (const l of logs) {
      const vs = await queryAll('log_versions', { logId: l.id });
      for (const v of vs) await remove('log_versions', v.id);
      await remove('day_logs', l.id);
    }
    await remove('projects', project.id);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/:id/logs', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const full = req.query.full === '1';
    const logs = await queryAll('day_logs', { projectId: project.id });
    const out = logs.map(l => full
      ? { date: l.date, weekday: l.weekday || '', items: l.items || [], files: l.files || [], images: l.images || [], updatedAt: l.updatedAt || l.createdAt || null }
      : { date: l.date, weekday: l.weekday || '', itemCount: Array.isArray(l.items) ? l.items.length : 0, doneCount: Array.isArray(l.items) ? l.items.filter(i => i.done).length : 0, updatedAt: l.updatedAt || l.createdAt || null });
    out.sort((a, b) => String(a.date).localeCompare(String(b.date)));
    res.json(out);
  } catch (e) { next(e); }
});

router.get('/:id/logs/:date', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const dayLog = await getLog(project.id, date);
    if (!dayLog) return res.json({ dayLog: null, lastVersion: null, hasDraft: false });
    const versions = await getVersions(dayLog.id);
    const lastVersion = versions.length > 0 ? { version: versions[0].version, items: versions[0].items } : null;
    const hasDraft = lastVersion ? JSON.stringify(dayLog.items) !== JSON.stringify(lastVersion.items) : true;
    res.json({ dayLog, lastVersion, hasDraft });
  } catch (e) { next(e); }
});

router.post('/:id/logs/:date/draft', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const { weekday, items, files, images } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items 必须为数组' });
    const cleanItems = normalizeItems(items);
    const existing = await getLog(project.id, date);
    if (!(await ensureCapacity(project.userId, existing, addedBytes(cleanItems, files, images)))) {
      return res.status(413).json({ error: '云盘空间不足（每用户 500MB）' });
    }
    if (existing) {
      const updates = { items: cleanItems, updatedAt: now() };
      if (weekday !== undefined && weekday !== null) updates.weekday = String(weekday);
      if (files !== undefined) updates.files = normalizeFiles(files);
      if (images !== undefined) updates.images = normalizeImages(images);
      const updated = await update('day_logs', existing.id, updates);
      return res.json(updated);
    }
    const dayLog = await insert('day_logs', { projectId: project.id, date, weekday: weekday !== undefined && weekday !== null ? String(weekday) : '', items: cleanItems, files: normalizeFiles(files), images: normalizeImages(images), createdAt: now(), updatedAt: now() });
    res.json(dayLog);
  } catch (e) { next(e); }
});

router.post('/:id/logs/:date/commit', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const { items, weekday, files, images } = req.body || {};
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items 必须为数组' });
    const cleanItems = normalizeItems(items);
    const cur = await getLog(project.id, date);
    if (!(await ensureCapacity(project.userId, cur, addedBytes(cleanItems, files, images)))) {
      return res.status(413).json({ error: '云盘空间不足（每用户 500MB）' });
    }
    let dayLog = cur;
    if (!dayLog) {
      dayLog = await insert('day_logs', { projectId: project.id, date, weekday: weekday !== undefined && weekday !== null ? String(weekday) : '', items: cleanItems, files: normalizeFiles(files), images: normalizeImages(images), createdAt: now(), updatedAt: now() });
    }
    const versions = await getVersions(dayLog.id);
    const version = versions.length > 0 ? versions[0].version + 1 : 1;
    await insert('log_versions', { logId: dayLog.id, version, items: cleanItems, createdAt: now() });
    const updates = { items: cleanItems, updatedAt: now() };
    if (weekday !== undefined && weekday !== null && dayLog.weekday !== String(weekday)) updates.weekday = String(weekday);
    if (files !== undefined) updates.files = normalizeFiles(files);
    if (images !== undefined) updates.images = normalizeImages(images);
    await update('day_logs', dayLog.id, updates);
    const t = new Date(); const pad2 = n => String(n).padStart(2, '0');
    const today = `${t.getFullYear()}-${pad2(t.getMonth() + 1)}-${pad2(t.getDate())}`;
    if (date === today && cleanItems.some(i => i.done)) await awardOnce(project.userId, 'activity');
    res.json({ version, items: cleanItems });
  } catch (e) { next(e); }
});

router.get('/:id/logs/:date/versions', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const dayLog = await getLog(project.id, date);
    if (!dayLog) return res.json([]);
    const versions = (await getVersions(dayLog.id)).map(v => ({ id: v.id, version: v.version, items: v.items, createdAt: v.createdAt }));
    res.json(versions);
  } catch (e) { next(e); }
});

router.post('/:id/logs/:date/rollback', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const { versionId } = req.body || {};
    if (!versionId) return res.status(400).json({ error: '请提供 versionId' });
    const dayLog = await getLog(project.id, date);
    if (!dayLog) return res.status(404).json({ error: '日志不存在' });
    const ver = await queryOne('log_versions', { id: Number(versionId) });
    if (!ver || ver.logId !== dayLog.id) return res.status(404).json({ error: '版本不存在' });
    const items = Array.isArray(ver.items) ? ver.items.map(i => ({ ...i })) : [];
    await update('day_logs', dayLog.id, { items, updatedAt: now() });
    res.json({ items, message: '已回滚到所选版本' });
  } catch (e) { next(e); }
});

router.delete('/:id/logs/:date', async (req, res, next) => {
  try {
    const project = await findOwnedProject(req, res);
    if (!project) return;
    const { date } = req.params;
    if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    const dayLog = await getLog(project.id, date);
    if (!dayLog) return res.status(404).json({ error: '该日暂无记录' });
    const vs = await queryAll('log_versions', { logId: dayLog.id });
    for (const v of vs) await remove('log_versions', v.id);
    await remove('day_logs', dayLog.id);
    const t = new Date(); const p2 = n => String(n).padStart(2, '0');
    const today = `${t.getFullYear()}-${p2(t.getMonth() + 1)}-${p2(t.getDate())}`;
    if (date === today) await revokeType(project.userId, 'activity');
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
