import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/play', authMiddleware, (req, res) => {
  const { gameType, bet } = req.body;
  if (!gameType || !['wheel', 'guess'].includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

  if (gameType === 'wheel') {
    if (user.points < 10) {
      return res.status(400).json({ error: 'Not enough points. Need at least 10 points to spin.' });
    }
    const prizes = [10, 20, 30, 50, 80, 100, 150, 200];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET points = points - 10 + ? WHERE id = ?').run(prize, req.user.id);
    db.prepare('INSERT INTO game_scores (userId, gameType, score, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'wheel', prize - 10, now);
    res.json({ prize, netPoints: prize - 10, message: `You won ${prize} points!` });
  }

  if (gameType === 'guess') {
    const betAmount = bet || 10;
    if (user.points < betAmount) {
      return res.status(400).json({ error: 'Not enough points' });
    }
    const target = Math.floor(Math.random() * 10) + 1;
    const guess = Math.floor(Math.random() * 10) + 1;
    const won = guess === target;
    const score = won ? betAmount : -betAmount;
    const now = new Date().toISOString();
    db.prepare('UPDATE users SET points = points + ? WHERE id = ?').run(score, req.user.id);
    db.prepare('INSERT INTO game_scores (userId, gameType, score, created_at) VALUES (?, ?, ?, ?)').run(req.user.id, 'guess', score, now);
    res.json({ target, guess, won, score, message: won ? `You won ${betAmount} points!` : `You lost ${betAmount} points. Target was ${target}` });
  }
});

router.get('/records', authMiddleware, (req, res) => {
  const records = db.prepare('SELECT * FROM game_scores WHERE userId = ? ORDER BY created_at DESC LIMIT 50').all(req.user.id);
  res.json(records);
});

export default router;
