import { Router } from 'express';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/:productId', (req, res) => {
  const { rating } = req.query;
  let sql = 'SELECT * FROM reviews WHERE productId = ?';
  const params = [Number(req.params.productId)];
  if (rating) {
    sql += ' AND rating = ?';
    params.push(Number(rating));
  }
  sql += ' ORDER BY created_at DESC';
  const reviews = db.prepare(sql).all(...params).map(r => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : [],
  }));
  res.json(reviews);
});

router.get('/:productId/stats', (req, res) => {
  const productId = Number(req.params.productId);
  const stats = db.prepare('SELECT COUNT(*) as count, AVG(rating) as average FROM reviews WHERE productId = ?').get(productId);
  const byRating = db.prepare('SELECT rating, COUNT(*) as count FROM reviews WHERE productId = ? GROUP BY rating ORDER BY rating').all(productId);
  res.json({ total: stats.count, average: stats.average || 0, byRating });
});

router.post('/', authMiddleware, (req, res) => {
  const { productId, rating, content, images, specs } = req.body;
  if (!productId || !rating) {
    return res.status(400).json({ error: 'Product ID and rating required' });
  }
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  const now = new Date().toISOString();
  const result = db.prepare(`
    INSERT INTO reviews (productId, userId, username, avatar, rating, content, images, specs, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(productId, req.user.id, user.nickname || user.username, user.avatar || '', rating, content || '', JSON.stringify(images || []), specs || '', now);
  const review = db.prepare('SELECT * FROM reviews WHERE id = ?').get(result.lastInsertRowid);
  review.images = review.images ? JSON.parse(review.images) : [];
  res.json(review);
});

export default router;
