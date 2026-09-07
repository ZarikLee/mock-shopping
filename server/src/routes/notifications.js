import { Router } from 'express';
import { queryAll, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res, next) => {
  try {
    const rows = queryAll('notifications', { userId: req.user.id })
      .sort((a, b) => b.at - a.at)
      .slice(0, 60);
    const unread = rows.filter(r => !r.read).length;
    res.json({ list: rows, unread });
  } catch (e) { next(e); }
});

router.post('/read', (req, res, next) => {
  try {
    const rows = queryAll('notifications', { userId: req.user.id });
    rows.forEach(r => { if (!r.read) update('notifications', r.id, { read: true }); });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;
