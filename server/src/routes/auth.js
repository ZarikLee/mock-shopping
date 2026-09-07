import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, insert, update, remove } from '../db.js';

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'daily-log-secret';
const SMS_URL = process.env.SPUG_SMS_URL || 'https://push.spug.cc/send/zxJZVrvB46r9lMea';

function randCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSmsCode(to, code) {
  const res = await fetch(SMS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, code }),
  });
  const data = await res.json().catch(() => ({}));
  if (data && data.code !== undefined && Number(data.code) !== 200) {
    throw new Error(data.msg || '短信发送失败');
  }
  return data;
}

function cleanCodes() {
  const now = Date.now();
  queryAll('sms_codes').forEach(c => {
    if (c.expiresAt <= now) remove('sms_codes', c.id);
  });
}

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

router.post('/sms', async (req, res, next) => {
  try {
    const { phone } = req.body || {};
    const p = String(phone || '').trim();
    if (!/^1\d{10}$/.test(p)) {
      return res.status(400).json({ error: '请输入正确的 11 位手机号' });
    }
    cleanCodes();
    const recent = queryAll('sms_codes').find(c => c.phone === p);
    if (recent && recent.expiresAt - Date.now() > 50 * 1000) {
      return res.status(429).json({ error: '发送太频繁，请稍后再试' });
    }
    const code = randCode();
    try {
      await sendSmsCode(p, code);
    } catch (e) {
      return res.status(502).json({ error: '短信发送失败：' + e.message });
    }
    insert('sms_codes', { phone: p, code, createdAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 });
    return res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { phone, code, password, nickname } = req.body || {};
    const phoneStr = String(phone || '').trim();
    const codeStr = String(code || '').trim();
    if (!/^1\d{10}$/.test(phoneStr)) {
      return res.status(400).json({ error: '请输入正确的 11 位手机号' });
    }
    if (!/^\d{6}$/.test(codeStr)) {
      return res.status(400).json({ error: '请填写 6 位短信验证码' });
    }
    if (!password) {
      return res.status(400).json({ error: '请填写密码' });
    }
    cleanCodes();
    const rec = queryAll('sms_codes').find(c => c.phone === phoneStr && c.code === codeStr);
    if (!rec || rec.expiresAt <= Date.now()) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    remove('sms_codes', rec.id);
    const exists = queryOne('users', { account: phoneStr });
    if (exists) {
      return res.status(400).json({ error: '该手机号已注册' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const user = insert('users', {
      account: phoneStr,
      password: hash,
      nickname: nickname && String(nickname).trim() ? String(nickname).trim() : '用户' + phoneStr.slice(-4),
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
