import { Router } from 'express';
import { queryAll, queryOne, insert, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = queryOne('checkins', { userId: req.user.id, date: today });
  if (existing) {
    return res.status(400).json({ error: 'Already checked in today' });
  }
  const points = Math.floor(Math.random() * 41) + 10;
  const now = new Date().toISOString();
  insert('checkins', { userId: req.user.id, date: today, points, created_at: now });
  const user = queryOne('users', { id: req.user.id });
  update('users', req.user.id, { points: (user.points || 0) + points });
  res.json({ points, message: `Checked in! Earned ${points} points today.` });
});

router.get('/status', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const checkin = queryOne('checkins', { userId: req.user.id, date: today });
  res.json({ checkedIn: !!checkin, today });
});

export default router;
