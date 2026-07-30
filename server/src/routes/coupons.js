import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

const couponTemplates = [
  { name: '满100减10', amount: 10, minConsume: 100 },
  { name: '满200减30', amount: 30, minConsume: 200 },
  { name: '满500减80', amount: 80, minConsume: 500 },
  { name: '满1000减150', amount: 150, minConsume: 1000 },
  { name: '满50减5', amount: 5, minConsume: 50 },
];

router.get('/', authMiddleware, (req, res) => {
  const coupons = db.prepare('SELECT * FROM coupons WHERE userId = ? ORDER BY id DESC').all(req.user.id);
  res.json(coupons);
});

router.post('/claim', authMiddleware, (req, res) => {
  const template = couponTemplates[Math.floor(Math.random() * couponTemplates.length)];
  const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const result = db.prepare(`
    INSERT INTO coupons (userId, name, amount, minConsume, expireTime, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `).run(req.user.id, template.name, template.amount, template.minConsume, expireTime);
  const coupon = db.prepare('SELECT * FROM coupons WHERE id = ?').get(result.lastInsertRowid);
  res.json(coupon);
});

export default router;
