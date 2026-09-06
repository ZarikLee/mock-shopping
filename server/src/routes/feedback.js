import { Router } from 'express';
import { insert, queryAll, queryOne, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();
const isAdmin = req => req.user && String(req.user.account) === 'admin';

router.get('/', authMiddleware, (req, res, next) => {
  try {
    let rows = queryAll('feedback').sort((a, b) => b.createdAt - a.createdAt);
    if (!isAdmin(req)) rows = rows.filter(f => f.userId === req.user.id);
    res.json({ list: rows });
  } catch (e) { next(e); }
});

router.post('/', authMiddleware, (req, res, next) => {
  try {
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: '反馈内容不能为空' });
    const rec = insert('feedback', {
      userId: req.user.id,
      account: req.user.account,
      nickname: req.user.nickname || req.user.account,
      text,
      createdAt: Date.now(),
      replies: [],
      status: 'open',
    });
    res.json({ feedback: rec });
  } catch (e) { next(e); }
});

router.post('/:id/reply', authMiddleware, (req, res, next) => {
  try {
    if (!isAdmin(req)) return res.status(403).json({ error: '只有管理员可以回复反馈' });
    const id = Number(req.params.id);
    const f = queryOne('feedback', { id });
    if (!f) return res.status(404).json({ error: '反馈不存在' });
    const text = String(req.body?.text || '').trim();
    if (!text) return res.status(400).json({ error: '回复内容不能为空' });
    const replies = (f.replies || []).concat({
      by: 'admin',
      name: req.user.nickname || '管理员',
      text,
      at: Date.now(),
    });
    const updated = update('feedback', id, { replies });
    res.json({ feedback: updated });
  } catch (e) { next(e); }
});

export default router;
