import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, insert } from '../db.js';

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

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const existing = queryOne('users', { username });
  if (existing) {
    return res.status(409).json({ error: 'Username already exists' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  const user = insert('users', { username, password: hashed, nickname: nickname || username, created_at: now, points: 0, balance: 0 });
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, username: user.username, nickname: nickname || username } });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  const user = queryOne('users', { username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

export { authMiddleware };
export default router;
