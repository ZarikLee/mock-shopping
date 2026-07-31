import { Router } from 'express';
import { queryAll, queryOne, insert, update } from '../db.js';
import { authMiddleware, addExperience } from './auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = queryOne('checkins', { userId: req.user.id, date: today });
  if (existing) {
    return res.status(400).json({ error: 'Already checked in today' });
  }
  const amount = Math.floor(Math.random() * 41) + 10;
  const now = new Date().toISOString();
  insert('checkins', { userId: req.user.id, date: today, points: amount, created_at: now });
  const user = queryOne('users', { id: req.user.id });
  update('users', req.user.id, { balance: (user.balance || 0) + amount });
  // 签到也加少量经验
  const xpResult = addExperience(req.user.id, 5);
  res.json({ balance: amount, experienceGained: xpResult.gained, message: `签到成功！获得 ${amount} 金币` });
});

router.get('/status', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const checkin = queryOne('checkins', { userId: req.user.id, date: today });
  res.json({ checkedIn: !!checkin, today });
});

export default router;
