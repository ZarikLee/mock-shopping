import { Router } from 'express';
import { queryAll, queryOne, insert } from '../db.js';
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
  const coupons = queryAll('coupons', { userId: req.user.id });
  coupons.sort((a, b) => b.id - a.id);
  res.json(coupons);
});

router.post('/claim', authMiddleware, (req, res) => {
  const template = couponTemplates[Math.floor(Math.random() * couponTemplates.length)];
  const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const coupon = insert('coupons', {
    userId: req.user.id,
    name: template.name,
    amount: template.amount,
    minConsume: template.minConsume,
    expireTime,
    used: 0,
  });
  res.json(coupon);
});

export default router;
