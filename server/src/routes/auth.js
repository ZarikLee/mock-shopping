import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, insert } from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'taodaibao-secret-key';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供登录凭证' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '登录凭证已过期，请重新登录' });
  }
}

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const existing = queryOne('users', { username });
  if (existing) {
    return res.status(409).json({ error: '用户名已存在' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  insert('users', {
    username,
    password: hashed,
    nickname: nickname || username,
    avatar: 'https://picsum.photos/seed/default/100/100',
    created_at: now,
    points: 5000,
    balance: 10000,
  });
  res.json({ message: '注册成功' });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const user = queryOne('users', { username });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...userInfo } = user;
  res.json({ token, user: userInfo });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const { password: _, ...userInfo } = user;
  res.json(userInfo);
});

export { authMiddleware };
export default router;
