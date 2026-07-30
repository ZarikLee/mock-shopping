import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await getDb();
  const users = queryAll('SELECT id, username, nickname, avatar, balance FROM users ORDER BY balance DESC LIMIT 50');
  const result = users.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

router.get('/points', async (req, res) => {
  await getDb();
  const users = queryAll('SELECT id, username, nickname, avatar, points FROM users ORDER BY points DESC LIMIT 50');
  const result = users.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

router.get('/spending', async (req, res) => {
  await getDb();
  const users = queryAll(`
    SELECT u.id, u.username, u.nickname, u.avatar, COALESCE(SUM(o.payAmount), 0) as totalSpent
    FROM users u
    LEFT JOIN orders o ON u.id = o.userId AND o.status >= 1
    GROUP BY u.id
    ORDER BY totalSpent DESC
    LIMIT 50
  `);
  const result = users.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

export default router;
