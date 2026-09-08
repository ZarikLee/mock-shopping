import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryAll, queryOne, insert, update, remove } from '../db.js';
import { getPoints, pointLogs, awardOnce, convertToStorage, FREE_AI, todayCount } from '../points.js';

const router = express.Router();

const SECRET = process.env.JWT_SECRET || 'daily-log-secret';
const SMS_URL = process.env.SPUG_SMS_URL || 'https://push.spug.cc/sms/imIsOEUIQ9Cg9gZaJwwp9w';

function randCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendSmsCode(to, code) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, code, number: 5 }),
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    const txt = await res.text();
    let data = {};
    try { data = JSON.parse(txt); } catch {}
    console.error('[sms] status=' + res.status + ' body=' + txt.slice(0, 300));
    if (res.status >= 400) {
      throw new Error('短信网关 HTTP ' + res.status + (data.msg ? '：' + data.msg : ''));
    }
    if (data && data.code !== undefined && Number(data.code) !== 200) {
      throw new Error((data.msg || '短信发送失败') + (data.request_id ? '（' + data.request_id + '）' : ''));
    }
    return data;
  } catch (e) {
    clearTimeout(timer);
    if (e && e.name === 'AbortError') throw new Error('短信服务响应超时');
    if (e && String(e.message).includes('fetch failed') && e.cause) {
      throw new Error('无法连接短信网关：' + (e.cause.message || String(e.cause)) + (e.cause.code ? '（' + e.cause.code + '）' : ''));
    }
    throw e;
  }
}

async function cleanCodes() {
  const now = Date.now();
  const all = await queryAll('sms_codes');
  for (const c of all) {
    if (c.expiresAt <= now) await remove('sms_codes', c.id);
  }
}

function publicUser(user) {
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

function signToken(user) {
  return jwt.sign({ id: user.id, account: user.account }, SECRET, { expiresIn: '7d' });
}

export async function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: '未登录' });
  }
  try {
    const payload = jwt.verify(token, SECRET);
    const user = await queryOne('users', { id: payload.id });
    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }
    req.user = publicUser(user);
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

router.get('/sms-debug/self', (req, res) => {
  res.json({ ok: true, ts: Date.now(), pid: process.pid });
});

router.get('/sms-debug/spug', async (req, res) => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 6000);
  try {
    const r = await fetch('https://push.spug.cc/', { signal: ctrl.signal, redirect: 'manual' });
    clearTimeout(t);
    res.json({ ok: true, status: r.status, reached: true });
  } catch (e) {
    clearTimeout(t);
    res.json({ ok: false, reached: false, name: (e && e.name) || '', message: (e && e.message) || String(e), cause: e && e.cause ? String(e.cause) : null });
  }
});

router.get('/sms-debug/send', async (req, res) => {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SMS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: '13800138000', code: '123456' }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    const txt = await r.text();
    res.json({ ok: true, http: r.status, ms: Date.now() - t0, body: txt.slice(0, 300) });
  } catch (e) {
    clearTimeout(t);
    res.json({ ok: false, ms: Date.now() - t0, name: (e && e.name) || '', message: (e && e.message) || String(e), cause: e && e.cause ? String(e.cause) : null });
  }
});

router.post('/reset', async (req, res, next) => {
  try {
    const { phone, code, password } = req.body || {};
    const phoneStr = String(phone || '').trim();
    const codeStr = String(code || '').trim();
    if (!/^1\d{10}$/.test(phoneStr)) return res.status(400).json({ error: '请输入正确的 11 位手机号' });
    if (!/^\d{6}$/.test(codeStr)) return res.status(400).json({ error: '请填写 6 位短信验证码' });
    if (!password || String(password).length < 6) return res.status(400).json({ error: '新密码至少 6 位' });
    const user = await queryOne('users', { account: phoneStr });
    if (!user) return res.status(404).json({ error: '该手机号尚未注册' });
    await cleanCodes();
    const smsAll = await queryAll('sms_codes');
    const rec = smsAll.find(c => c.phone === phoneStr && c.code === codeStr);
    if (!rec || rec.expiresAt <= Date.now()) return res.status(400).json({ error: '验证码错误或已过期' });
    await remove('sms_codes', rec.id);
    const hash = await bcrypt.hash(String(password), 10);
    await update('users', user.id, { password: hash });
    return res.json({ ok: true });
  } catch (err) { next(err); }
});

router.post('/sms', async (req, res, next) => {
  try {
    const { phone } = req.body || {};
    const p = String(phone || '').trim();
    if (!/^1\d{10}$/.test(p)) {
      return res.status(400).json({ error: '请输入正确的 11 位手机号' });
    }
    await cleanCodes();
    const smsAll = await queryAll('sms_codes');
    const recent = smsAll.find(c => c.phone === p);
    if (recent && recent.expiresAt - Date.now() > 50 * 1000) {
      return res.status(429).json({ error: '发送太频繁，请稍后再试' });
    }
    const code = randCode();
    try {
      await sendSmsCode(p, code);
    } catch (e) {
      return res.status(502).json({ error: '短信发送失败：' + e.message });
    }
    await insert('sms_codes', { phone: p, code, createdAt: Date.now(), expiresAt: Date.now() + 5 * 60 * 1000 });
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
    await cleanCodes();
    const smsAll = await queryAll('sms_codes');
    const rec = smsAll.find(c => c.phone === phoneStr && c.code === codeStr);
    if (!rec || rec.expiresAt <= Date.now()) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }
    await remove('sms_codes', rec.id);
    const exists = await queryOne('users', { account: phoneStr });
    if (exists) {
      return res.status(400).json({ error: '该手机号已注册' });
    }
    const hash = await bcrypt.hash(String(password), 10);
    const user = await insert('users', {
      account: phoneStr,
      password: hash,
      nickname: nickname && String(nickname).trim() ? String(nickname).trim() : '用户' + phoneStr.slice(-4),
      role: null,
      createdAt: new Date().toISOString(),
      points: 0,
    });
    await awardOnce(user.id, 'login');
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
    const user = await queryOne('users', { account: String(account).trim() });
    if (!user) {
      return res.status(401).json({ error: '手机号或密码错误' });
    }
    const ok = await bcrypt.compare(String(password), user.password);
    if (!ok) {
      return res.status(401).json({ error: '账号或密码错误' });
    }
    await awardOnce(user.id, 'login');
    const u = await queryOne('users', { id: user.id });
    return res.json({ token: signToken(user), user: publicUser(u || user) });
  } catch (err) {
    next(err);
  }
});

router.get('/points', authMiddleware, async (req, res, next) => {
  try { await awardOnce(req.user.id, 'login'); const u = await queryOne('users', { id: req.user.id }); res.json({ points: await getPoints(req.user.id), bonus: Number((u && u.storage_bonus) || 0), aiUsed: await todayCount(req.user.id, 'ai_use'), aiFree: FREE_AI, logs: await pointLogs(req.user.id) }); }
  catch (e) { next(e); }
});

router.post('/points/convert', authMiddleware, async (req, res, next) => {
  try { const points = Number(req.body?.points); const r = await convertToStorage(req.user.id, points); if (r.error) return res.status(400).json({ error: r.error }); res.json(r); }
  catch (e) { next(e); }
});

router.get('/me', authMiddleware, (req, res) => {
  return res.json({ user: req.user });
});

router.put('/profile', authMiddleware, async (req, res, next) => {
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
    const user = await queryOne('users', { id: req.user.id });
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    const updated = await update('users', req.user.id, updates);
    return res.json({ user: publicUser(updated) });
  } catch (err) {
    next(err);
  }
});

export default router;
