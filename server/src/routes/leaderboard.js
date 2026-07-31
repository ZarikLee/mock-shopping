import { Router } from 'express';
import { queryAll } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const users = queryAll('users')
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 50)
    .map((u, i) => ({ id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar, balance: u.balance, rank: i + 1 }));
  res.json(users);
});

router.get('/spending', (req, res) => {
  const users = queryAll('users');
  const orders = queryAll('orders').filter(o => o.status >= 1);
  const spending = {};
  orders.forEach(o => {
    spending[o.userId] = (spending[o.userId] || 0) + (o.payAmount || 0);
  });
  const result = users.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar,
    totalSpent: spending[u.id] || 0,
  }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 50)
    .map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

export default router;
