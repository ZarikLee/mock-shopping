import { Router } from 'express';
import { queryAll, queryOne, insert } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.get('/:productId', (req, res) => {
  const { rating } = req.query;
  let reviews = queryAll('reviews', { productId: Number(req.params.productId) });
  if (rating) {
    reviews = reviews.filter(r => r.rating === Number(rating));
  }
  reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  res.json(reviews);
});

router.get('/:productId/stats', (req, res) => {
  const productId = Number(req.params.productId);
  const reviews = queryAll('reviews', { productId });
  const total = reviews.length;
  const average = total > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / total : 0;
  const byRating = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: reviews.filter(r => r.rating === rating).length,
  })).filter(g => g.count > 0);
  res.json({ total, average, byRating });
});

router.post('/', authMiddleware, (req, res) => {
  const { productId, rating, content, images, specs } = req.body;
  if (!productId || !rating) {
    return res.status(400).json({ error: 'Product ID and rating required' });
  }
  const user = queryOne('users', { id: req.user.id });
  const now = new Date().toISOString();
  const review = insert('reviews', {
    productId,
    userId: req.user.id,
    username: user.nickname || user.username,
    avatar: user.avatar || '',
    rating,
    content: content || '',
    images: images || [],
    specs: specs || '',
    created_at: now,
  });
  res.json(review);
});

export default router;
