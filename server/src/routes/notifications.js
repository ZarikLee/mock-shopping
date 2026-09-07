import { Router } from 'express';
import { queryAll, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', async (req, res, next) => {
  try {
    const all = await queryAll('notifications', { userId: req.user.id });
    const rows = all.sort((a, b) => b.at - a.at).slice(0, 60);
    const unread = rows.filter(r => !r.read).length;
    res.json({ list: rows, unread });
  } catch (e) { next(e); }
});

router.post('/read', async (req, res, next) => {
  try {
    const rows = await queryAll('notifications', { userId: req.user.id });
    for (const r of rows) { if (!r.read) await update('notifications', r.id, { read: true }); }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
