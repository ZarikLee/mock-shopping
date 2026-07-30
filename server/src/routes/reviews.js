import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/:productId', async (req, res) => {
  await getDb();
  const { rating } = req.query;
  let sql = 'SELECT * FROM reviews WHERE productId = ?';
  const params = [Number(req.params.productId)];
  if (rating) {
    sql += ' AND rating = ?';
    params.push(Number(rating));
  }
  sql += ' ORDER BY created_at DESC';
  const reviews = queryAll(sql, params).map(r => ({
    ...r,
    images: r.images ? JSON.parse(r.images) : [],
  }));
  res.json(reviews);
});

router.get('/:productId/stats', async (req, res) => {
  await getDb();
  const productId = Number(req.params.productId);
  const stats = queryOne('SELECT COUNT(*) as count, AVG(rating) as average FROM reviews WHERE productId = ?', [productId]);
  const byRating = queryAll('SELECT rating, COUNT(*) as count FROM reviews WHERE productId = ? GROUP BY rating ORDER BY rating', [productId]);
  res.json({ total: stats.count, average: stats.average || 0, byRating });
});

router.post('/', authMiddleware, async (req, res) => {
  await getDb();
  const { productId, rating, content, images, specs } = req.body;
  if (!productId || !rating) {
    return res.status(400).json({ error: 'Product ID and rating required' });
  }
  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const now = new Date().toISOString();
  execute(`
    INSERT INTO reviews (productId, userId, username, avatar, rating, content, images, specs, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [productId, req.user.id, user.nickname || user.username, user.avatar || '', rating, content || '', JSON.stringify(images || []), specs || '', now]);
  const review = queryOne('SELECT * FROM reviews WHERE id = ?', [lastInsertRowId()]);
  review.images = review.images ? JSON.parse(review.images) : [];
  res.json(review);
});

export default router;
