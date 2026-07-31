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
    const cost = 100;
    if (user.balance < cost) return res.status(400).json({ error: 'Not enough balance. Need at least 100 coins to spin.' });
    const prizes = [100, 200, 500, 1000, 2000, 5000, 0, 10000];
    const prize = prizes[Math.floor(Math.random() * prizes.length)];
    const net = prize - cost;
    const netPoints = net;
    const newBalance = (user.balance || 0) + netPoints;
    const now = new Date().toISOString();
    update('users', req.user.id, { balance: newBalance });
    insert('game_scores', { userId: req.user.id, gameType: 'wheel', score: netPoints, created_at: now });
    res.json({ score: prize, result: netPoints >= 0 ? 'win' : 'lose', totalBalance: newBalance });
  }

  if (gameType === 'guess') {
    const betAmount = bet || 10;
    if (user.balance < betAmount) {
      return res.status(400).json({ error: 'Not enough balance' });
    }

    if (guess) {
      const number = Math.floor(Math.random() * 100) + 1;
      const isHigh = number > 50;
      const playerGuessedHigh = guess === 'high';
      const won = isHigh === playerGuessedHigh;
      const score = won ? betAmount * 2 : -betAmount;
      const newBalance = (user.balance || 0) + score;
      const now = new Date().toISOString();
      update('users', req.user.id, { balance: newBalance });
      insert('game_scores', { userId: req.user.id, gameType: 'guess', score, created_at: now });
      res.json({ score, result: won ? 'win' : 'lose', totalBalance: newBalance, number });
    } else {
      const target = Math.floor(Math.random() * 10) + 1;
      const guess = Math.floor(Math.random() * 10) + 1;
      const won = guess === target;
      const score = won ? betAmount : -betAmount;
      const newBalance = (user.balance || 0) + score;
      const now = new Date().toISOString();
      update('users', req.user.id, { balance: newBalance });
      insert('game_scores', { userId: req.user.id, gameType: 'guess', score, created_at: now });
      res.json({ target, guess, won, score, totalBalance: newBalance, message: won ? `You won ${betAmount} coins!` : `You lost ${betAmount} coins. Target was ${target}` });
    }
  }
});

router.get('/records', authMiddleware, (req, res) => {
  const records = queryAll('game_scores', { userId: req.user.id });
  records.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(records.slice(0, 50));
});

export default router;
