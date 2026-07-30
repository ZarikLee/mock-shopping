import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

const couponTemplates = [
  { name: '满100减10', amount: 10, minConsume: 100 },
  { name: '满200减30', amount: 30, minConsume: 200 },
  { name: '满500减80', amount: 80, minConsume: 500 },
  { name: '满1000减150', amount: 150, minConsume: 1000 },
  { name: '满50减5', amount: 5, minConsume: 50 },
];

router.get('/', authMiddleware, async (req, res) => {
  await getDb();
  const coupons = queryAll('SELECT * FROM coupons WHERE userId = ? ORDER BY id DESC', [req.user.id]);
  res.json(coupons);
});

router.post('/claim', authMiddleware, async (req, res) => {
  await getDb();
  const template = couponTemplates[Math.floor(Math.random() * couponTemplates.length)];
  const expireTime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  execute(`
    INSERT INTO coupons (userId, name, amount, minConsume, expireTime, used)
    VALUES (?, ?, ?, ?, ?, 0)
  `, [req.user.id, template.name, template.amount, template.minConsume, expireTime]);
  const coupon = queryOne('SELECT * FROM coupons WHERE id = ?', [lastInsertRowId()]);
  res.json(coupon);
});

export default router;
