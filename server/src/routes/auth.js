import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queryOne, insert, update } from '../db.js';
import { getLevel } from '../achievements.js';

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

// Give XP to user and return level up info
function addExperience(userId, amount) {
  const user = queryOne('users', { id: userId })
  const before = getLevel(user.experience || 0)
  user.experience = (user.experience || 0) + amount
  update('users', userId, { experience: user.experience })
  const after = getLevel(user.experience)
  return { gained: amount, before, after, leveledUp: after > before, newLevel: after }
}

router.post('/register', (req, res) => {
  const { username, password, nickname } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  const account = 'TD' + Date.now() + Math.floor(Math.random() * 1000);
  if (queryOne('users', { account })) {
    return res.status(409).json({ error: '账号生成冲突，请重试' });
  }
  const hashed = bcrypt.hashSync(password, 10);
  const now = new Date().toISOString();
  insert('users', {
    account,
    username,
    password: hashed,
    payPassword: null,
    nickname: nickname || username,
    created_at: now,
    points: 0,
    balance: 5000,
    experience: 0,
    achievements: [],
    avatar: 'https://picsum.photos/seed/default/100/100',
    bio: '',
    homeCity: '',
  });
  res.json({ account, message: `注册成功，您的账号是 ${account}` });
});

router.post('/login', (req, res) => {
  const { account, password } = req.body;
  if (!account || !password) {
    return res.status(400).json({ error: '账号和密码不能为空' });
  }
  const user = queryOne('users', { account });
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '账号或密码错误' });
  }
  const token = jwt.sign({ id: user.id, account: user.account, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, payPassword: __, ...userInfo } = user;
  res.json({
    token,
    user: {
      ...userInfo,
      experience: user.experience || 0,
      level: getLevel(user.experience || 0),
      achievements: user.achievements || [],
    },
  });
});

router.get('/paypassword/status', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ hasPayPassword: !!user.payPassword });
});

router.post('/paypassword/set', authMiddleware, (req, res) => {
  const { payPassword } = req.body;
  if (!payPassword || !/^\d{6,}$/.test(payPassword)) {
    return res.status(400).json({ error: '支付密码不能为空，且至少为6位数字' });
  }
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (user.payPassword) return res.status(400).json({ error: '支付密码已设置' });
  const hashedPayPassword = bcrypt.hashSync(payPassword, 10);
  update('users', user.id, { payPassword: hashedPayPassword });
  res.json({ message: '支付密码设置成功' });
});

router.post('/paypassword', authMiddleware, (req, res) => {
  const { payPassword } = req.body;
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  if (!user.payPassword) return res.status(400).json({ error: '未设置支付密码' });
  const valid = bcrypt.compareSync(payPassword || '', user.payPassword);
  if (!valid) return res.status(400).json({ valid: false, error: '支付密码错误' });
  res.json({ valid });
});

router.put('/profile', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const { nickname, phone, email, gender, birthday, bio, homeCity } = req.body;
  const updates = {};
  if (nickname !== undefined) updates.nickname = nickname;
  if (phone !== undefined) updates.phone = phone;
  if (email !== undefined) updates.email = email;
  if (gender !== undefined) updates.gender = gender;
  if (birthday !== undefined) updates.birthday = birthday;
  if (bio !== undefined) updates.bio = bio;
  if (homeCity !== undefined) updates.homeCity = homeCity;
  const updated = update('users', user.id, updates);
  const { password: _, payPassword: __, ...userInfo } = updated;
  res.json({
    ...userInfo,
    experience: updated.experience || 0,
    level: getLevel(updated.experience || 0),
    achievements: updated.achievements || [],
  });
});

router.get('/me', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  const { password: _, payPassword: __, ...userInfo } = user;
  res.json({
    ...userInfo,
    experience: user.experience || 0,
    level: getLevel(user.experience || 0),
    achievements: user.achievements || [],
  });
});

export { authMiddleware, addExperience };
export default router;
