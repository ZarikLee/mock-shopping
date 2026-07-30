import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const existing = db.prepare('SELECT id FROM checkins WHERE userId = ? AND date = ?').get(req.user.id, today);
  if (existing) {
    return res.status(400).json({ error: 'Already checked in today' });
  }
  const points = Math.floor(Math.random() * 41) + 10;
  const now = new Date().toISOString();
  db.prepare('INSERT INTO checkins (userId, date, points, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, today, points, now);
  db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(points, req.user.id);
  res.json({ points, message: `Checked in! Earned ${points} points today.` });
});

router.get('/status', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const checkin = db.prepare('SELECT * FROM checkins WHERE userId = ? AND date = ?').get(req.user.id, today);
  res.json({ checkedIn: !!checkin, today });
});

export default router;
