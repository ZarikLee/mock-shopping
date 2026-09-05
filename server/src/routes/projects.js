import express from 'express';
import { queryAll, queryOne, insert, update, remove } from '../db.js';
import { authMiddleware } from './auth.js';

const router = express.Router();

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

router.use(authMiddleware);

function now() {
  return new Date().toISOString();
}

function normalizeItems(items) {
  if (!Array.isArray(items)) return [];
  return items.map((it, idx) => ({
    id: it && it.id ? String(it.id) : `${Date.now().toString(36)}-${idx}-${Math.random().toString(36).slice(2, 8)}`,
    text: it && it.text !== undefined && it.text !== null ? String(it.text) : '',
    done: !!(it && it.done),
  }));
}

function isValidDate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return false;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

function findOwnedProject(req, res) {
  const project = queryOne('projects', { id: Number(req.params.id) });
  if (!project || project.userId !== req.user.id) {
    res.status(404).json({ error: '项目不存在' });
    return null;
  }
  return project;
}

function getLog(projectId, date) {
  return queryOne('day_logs', { projectId, date });
}

function getVersions(logId) {
  return queryAll('log_versions', { logId })
    .slice()
    .sort((a, b) => b.version - a.version);
}

router.get('/', (req, res) => {
  const projects = queryAll('projects', { userId: req.user.id })
    .map(p => {
      const logs = queryAll('day_logs', { projectId: p.id });
      const lastLogDate = logs.reduce((max, l) => (l.date > max ? l.date : max), '');
      return {
        ...p,
        logCount: logs.length,
        lastLogDate: lastLogDate || null,
      };
    })
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)) || b.id - a.id);
  return res.json(projects);
});

router.post('/', (req, res) => {
  const { name, startDate } = req.body || {};
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: '请填写项目名称' });
  }
  if (!req.user.role) {
    return res.status(400).json({ error: '请先选择身份' });
  }
  if (startDate !== undefined && startDate !== null && startDate !== '' && !isValidDate(startDate)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const type = req.user.role === 'student' ? 'school' : 'company';
  const project = insert('projects', {
    userId: req.user.id,
    name: String(name).trim(),
    type,
    startDate: startDate || null,
    createdAt: now(),
  });
  return res.json(project);
});

router.put('/:id', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { name, startDate } = req.body || {};
  const updates = {};
  if (name !== undefined) {
    if (!String(name).trim()) {
      return res.status(400).json({ error: '项目名称不能为空' });
    }
    updates.name = String(name).trim();
  }
  if (startDate !== undefined) {
    if (startDate !== null && startDate !== '' && !isValidDate(startDate)) {
      return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
    }
    updates.startDate = startDate || null;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: '没有需要更新的内容' });
  }
  const updated = update('projects', project.id, updates);
  return res.json(updated);
});

router.delete('/:id', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const logs = queryAll('day_logs', { projectId: project.id });
  logs.forEach(l => {
    queryAll('log_versions', { logId: l.id }).forEach(v => remove('log_versions', v.id));
    remove('day_logs', l.id);
  });
  remove('projects', project.id);
  return res.json({ success: true });
});

router.get('/:id/logs', (req, res) => {  const project = findOwnedProject(req, res);
  if (!project) return;
  const full = req.query.full === '1';
  const logs = queryAll('day_logs', { projectId: project.id })
    .map(l => full
      ? { date: l.date, weekday: l.weekday || '', items: l.items || [], updatedAt: l.updatedAt || l.createdAt || null }
      : {
          date: l.date,
          weekday: l.weekday || '',
          itemCount: Array.isArray(l.items) ? l.items.length : 0,
          doneCount: Array.isArray(l.items) ? l.items.filter(i => i.done).length : 0,
          updatedAt: l.updatedAt || l.createdAt || null,
        })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return res.json(logs);
});

router.get('/:id/logs/:date', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const dayLog = getLog(project.id, date);
  if (!dayLog) {
    return res.json({ dayLog: null, lastVersion: null, hasDraft: false });
  }
  const versions = getVersions(dayLog.id);
  const lastVersion = versions.length > 0 ? { version: versions[0].version, items: versions[0].items } : null;
  const hasDraft = lastVersion ? JSON.stringify(dayLog.items) !== JSON.stringify(lastVersion.items) : true;
  return res.json({ dayLog, lastVersion, hasDraft });
});

router.post('/:id/logs/:date/draft', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const { weekday, items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须为数组' });
  }
  const cleanItems = normalizeItems(items);
  const existing = getLog(project.id, date);
  if (existing) {
    const updates = { items: cleanItems, updatedAt: now() };
    if (weekday !== undefined && weekday !== null) {
      updates.weekday = String(weekday);
    }
    const updated = update('day_logs', existing.id, updates);
    return res.json(updated);
  }
  const dayLog = insert('day_logs', {
    projectId: project.id,
    date,
    weekday: weekday !== undefined && weekday !== null ? String(weekday) : '',
    items: cleanItems,
    createdAt: now(),
    updatedAt: now(),
  });
  return res.json(dayLog);
});

router.post('/:id/logs/:date/commit', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const { items, weekday } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items 必须为数组' });
  }
  const cleanItems = normalizeItems(items);
  let dayLog = getLog(project.id, date);
  if (!dayLog) {
    dayLog = insert('day_logs', {
      projectId: project.id,
      date,
      weekday: weekday !== undefined && weekday !== null ? String(weekday) : '',
      items: cleanItems,
      createdAt: now(),
      updatedAt: now(),
    });
  }
  const versions = getVersions(dayLog.id);
  const version = versions.length > 0 ? versions[0].version + 1 : 1;
  insert('log_versions', {
    logId: dayLog.id,
    version,
    items: cleanItems,
    createdAt: now(),
  });
  const updates = { items: cleanItems, updatedAt: now() };
  if (weekday !== undefined && weekday !== null && dayLog.weekday !== String(weekday)) {
    updates.weekday = String(weekday);
  }
  update('day_logs', dayLog.id, updates);
  return res.json({ version, items: cleanItems });
});

router.get('/:id/logs/:date/versions', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const dayLog = getLog(project.id, date);
  if (!dayLog) {
    return res.json([]);
  }
  const versions = getVersions(dayLog.id).map(v => ({
    id: v.id,
    version: v.version,
    items: v.items,
    createdAt: v.createdAt,
  }));
  return res.json(versions);
});

router.post('/:id/logs/:date/rollback', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) {
    return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  }
  const { versionId } = req.body || {};
  if (!versionId) {
    return res.status(400).json({ error: '请提供 versionId' });
  }
  const dayLog = getLog(project.id, date);
  if (!dayLog) {
    return res.status(404).json({ error: '日志不存在' });
  }
  const ver = queryOne('log_versions', { id: Number(versionId) });
  if (!ver || ver.logId !== dayLog.id) {
    return res.status(404).json({ error: '版本不存在' });
  }
  const items = Array.isArray(ver.items) ? ver.items.map(i => ({ ...i })) : [];
  update('day_logs', dayLog.id, { items, updatedAt: now() });
  return res.json({ items, message: '已回滚到所选版本' });
});

// 删除某一天（含版本）
router.delete('/:id/logs/:date', (req, res) => {
  const project = findOwnedProject(req, res);
  if (!project) return;
  const { date } = req.params;
  if (!isValidDate(date)) return res.status(400).json({ error: '日期格式应为 YYYY-MM-DD' });
  const dayLog = getLog(project.id, date);
  if (!dayLog) return res.status(404).json({ error: '该日暂无记录' });
  queryAll('log_versions', { logId: dayLog.id }).forEach(v => remove('log_versions', v.id));
  remove('day_logs', dayLog.id);
  return res.json({ success: true });
});

export default router;
