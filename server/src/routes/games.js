import { Router } from 'express';
import { queryAll, queryOne, insert, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/play', authMiddleware, (req, res) => {
  const { gameType, bet, guess } = req.body;
  if (!gameType || !['wheel', 'guess'].includes(gameType)) {
    return res.status(400).json({ error: 'Invalid game type' });
  }

  const user = queryOne('users', { id: req.user.id });

  if (gameType === 'wheel') {
    if (user.points < 10) {
      return res.status(400).json({ error: 'Not enough points. Need at least 10 points to spin.' });
    }
    const prizes = [10, 20, 50, 100, 0, 200, 5, 500];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    const netPoints = prize - 10;
    const newPoints = (user.points || 0) + netPoints;
    const now = new Date().toISOString();
    update('users', req.user.id, { points: newPoints });
    insert('game_scores', { userId: req.user.id, gameType: 'wheel', score: netPoints, created_at: now });
    res.json({ score: prize, result: netPoints >= 0 ? 'win' : 'lose', totalPoints: newPoints });
  }

  if (gameType === 'guess') {
    const betAmount = bet || 10;
    if (user.points < betAmount) {
      return res.status(400).json({ error: 'Not enough points' });
    }

    if (guess) {
      const number = Math.floor(Math.random() * 100) + 1;
      const isHigh = number > 50;
      const playerGuessedHigh = guess === 'high';
      const won = isHigh === playerGuessedHigh;
      const score = won ? betAmount * 2 : -betAmount;
      const newPoints = (user.points || 0) + score;
      const now = new Date().toISOString();
      update('users', req.user.id, { points: newPoints });
      insert('game_scores', { userId: req.user.id, gameType: 'guess', score, created_at: now });
      res.json({ score, result: won ? 'win' : 'lose', totalPoints: newPoints, number });
    } else {
      const target = Math.floor(Math.random() * 10) + 1;
      const guess = Math.floor(Math.random() * 10) + 1;
      const won = guess === target;
      const score = won ? betAmount : -betAmount;
      const newPoints = (user.points || 0) + score;
      const now = new Date().toISOString();
      update('users', req.user.id, { points: newPoints });
      insert('game_scores', { userId: req.user.id, gameType: 'guess', score, created_at: now });
      res.json({ target, guess, won, score, totalPoints: newPoints, message: won ? `You won ${betAmount} points!` : `You lost ${betAmount} points. Target was ${target}` });
    }
  }
});

router.get('/records', authMiddleware, (req, res) => {
  const records = queryAll('game_scores', { userId: req.user.id });
  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(records.slice(0, 50));
});

export default router;
