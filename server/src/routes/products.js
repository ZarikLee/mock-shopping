import { Router } from 'express';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';

const router = Router();

router.get('/', async (req, res) => {
  await getDb();
  const { categoryId, brand, keyword, minPrice, maxPrice, sortBy, order, page = 1, pageSize = 20 } = req.query;

  let sql = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (categoryId) {
    sql += ' AND categoryId = ?';
    params.push(Number(categoryId));
  }
  if (brand) {
    sql += ' AND brand = ?';
    params.push(brand);
  }
  if (keyword) {
    sql += ' AND name LIKE ?';
    params.push(`%${keyword}%`);
  }
  if (minPrice) {
    sql += ' AND price >= ?';
    params.push(Number(minPrice));
  }
  if (maxPrice) {
    sql += ' AND price <= ?';
    params.push(Number(maxPrice));
  }

  const allowedSort = { price: 'price', sales: 'sales', rating: 'rating', created_at: 'id' };
  const sortColumn = allowedSort[sortBy] || 'id';
  const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

  const offset = (Number(page) - 1) * Number(pageSize);
  sql += ' LIMIT ? OFFSET ?';
  params.push(Number(pageSize), offset);

  let countSql = 'SELECT COUNT(*) as count FROM products WHERE 1=1';
  const countParams = [];
  if (categoryId) { countSql += ' AND categoryId = ?'; countParams.push(Number(categoryId)); }
  if (brand) { countSql += ' AND brand = ?'; countParams.push(brand); }
  if (keyword) { countSql += ' AND name LIKE ?'; countParams.push(`%${keyword}%`); }
  if (minPrice) { countSql += ' AND price >= ?'; countParams.push(Number(minPrice)); }
  if (maxPrice) { countSql += ' AND price <= ?'; countParams.push(Number(maxPrice)); }
  const totalCount = queryOne(countSql, countParams).count;

  const products = queryAll(sql, params).map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    specs: JSON.parse(p.specs || '[]'),
    colors: JSON.parse(p.colors || '[]'),
  }));

  res.json({ products, total: totalCount, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/hot', async (req, res) => {
  await getDb();
  const products = queryAll('SELECT * FROM products ORDER BY sales DESC LIMIT 8').map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    specs: JSON.parse(p.specs || '[]'),
    colors: JSON.parse(p.colors || '[]'),
  }));
  res.json(products);
});

router.get('/new', async (req, res) => {
  await getDb();
  const products = queryAll('SELECT * FROM products ORDER BY id DESC LIMIT 8').map(p => ({
    ...p,
    images: JSON.parse(p.images || '[]'),
    specs: JSON.parse(p.specs || '[]'),
    colors: JSON.parse(p.colors || '[]'),
  }));
  res.json(products);
});

router.get('/:id', async (req, res) => {
  await getDb();
  const product = queryOne('SELECT * FROM products WHERE id = ?', [Number(req.params.id)]);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  product.images = JSON.parse(product.images || '[]');
  product.specs = JSON.parse(product.specs || '[]');
  product.colors = JSON.parse(product.colors || '[]');
  res.json(product);
});

export default router;
