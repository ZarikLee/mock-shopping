import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'taodaibao-secret-key';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

router.post('/register', async (req, res) => {
  await getDb();
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username]);
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  execute('INSERT INTO users (username, password, nickname, created_at) VALUES (?, ?, ?, ?)', [username, hashed, nickname || username, now]);
  const id = lastInsertRowId();
  const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id, username, nickname: nickname || username } });
});

router.post('/login', async (req, res) => {
  await getDb();
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = queryOne('SELECT * FROM users WHERE username = ?', [username]);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo });
});

router.get('/me', authMiddleware, async (req, res) => {
  await getDb();
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

router.post('/checkin', authMiddleware, async (req, res) => {
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
  res.json({ points, message: `Checked in! Earned ${points} points` });
});

router.get('/leaderboard', async (req, res) => {
  await getDb();
  const users = queryAll('SELECT id, username, nickname, avatar, balance FROM users ORDER BY balance DESC LIMIT 50');
  const result = users.map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

export { authMiddleware };
export default router;
