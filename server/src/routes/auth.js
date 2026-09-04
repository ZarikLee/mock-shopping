import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, insert, update } from '../db.js';

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'daily-log-secret';

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ id: user.id, account: user.account }, SECRET, { expiresIn: '7d' });
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    const user = queryOne('users', { id: payload.id });
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = publicUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

router.post('/register', async (req, res, next) => {
  try {
    const { account, password, nickname } = req.body || {};
    if (!account || !String(account).trim()) {
      return res.status(400).json({ error: '请填写账号' });
    }
    if (!password) {
      return res.status(400).json({ error: '请填写密码' });
    }
    const accountStr = String(account).trim();
    const exists = queryOne('users', { account: accountStr });
    if (exists) {
      return res.status(400).json({ error: '账号已存在' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const user = insert('users', {
      account: accountStr,
      password: hash,
      nickname: nickname && String(nickname).trim() ? String(nickname).trim() : accountStr,
      role: null,
      createdAt: new Date().toISOString(),
    });
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { account, password } = req.body || {};
    if (!account || !password) {
      return res.status(400).json({ error: '请填写账号和密码' });
    }
    const user = queryOne('users', { account: String(account).trim() });
    if (!user) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    return res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

router.put('/profile', authMiddleware, (req, res, next) => {
  try {
    const { role, nickname } = req.body || {};
    const updates = {};
    if (nickname !== undefined) {
      if (!String(nickname).trim()) {
        return res.status(400).json({ error: '昵称不能为空' });
      }
      updates.nickname = String(nickname).trim();
    }
    if (role !== undefined && role !== null) {
      if (role !== 'student' && role !== 'worker') {
        return res.status(400).json({ error: '身份只能是 student 或 worker' });
      }
      updates.role = role;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: '没有需要更新的内容' });
    }
    const user = queryOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const updated = update('users', req.user.id, updates);
    return res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
