import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  await getDb();
  const today = new Date().toISOString().split('T')[0];
  const existing = queryOne('SELECT id FROM checkins WHERE userId = ? AND date = ?', [req.user.id, today]);
  if (existing) {
    return res.status(400).json({ error: 'Already checked in today' });
  }
  const points = Math.floor(Math.random() * 41) + 10;
  const now = new Date().toISOString();
  execute('INSERT INTO checkins (userId, date, points, created_at) VALUES (?, ?, ?, ?)', [req.user.id, today, points, now]);
  execute('UPDATE users SET points = points + ? WHERE id = ?', [points, req.user.id]);
  res.json({ points, message: `Checked in! Earned ${points} points today.` });
});

router.get('/status', authMiddleware, async (req, res) => {
  await getDb();
  const today = new Date().toISOString().split('T')[0];
  const checkin = queryOne('SELECT * FROM checkins WHERE userId = ? AND date = ?', [req.user.id, today]);
  res.json({ checkedIn: !!checkin, today });
});

export default router;
