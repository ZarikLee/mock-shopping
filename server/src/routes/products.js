import { Router } from 'express';
import { queryAll, queryOne } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  let products = queryAll('products');

  const { categoryId, brand, keyword, minPrice, maxPrice, sortBy, order, page = 1, pageSize = 20 } = req.query;

  if (categoryId) {
    products = products.filter(p => p.categoryId === Number(categoryId));
  }
  if (brand) {
    products = products.filter(p => p.brand === brand);
  }
  if (keyword) {
    const kw = keyword.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(kw));
  }
  if (minPrice) {
    products = products.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= Number(maxPrice));
  }

  const allowedSort = { price: 'price', sales: 'sales', rating: 'rating' };
  const sortField = allowedSort[sortBy] || 'id';
  const sortOrder = order === 'asc' ? 1 : -1;
  products.sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1 * sortOrder;
    if (a[sortField] > b[sortField]) return 1 * sortOrder;
    return 0;
  });

  const total = products.length;
  const offset = (Number(page) - 1) * Number(pageSize);
  const paged = products.slice(offset, offset + Number(pageSize));

  res.json({ products: paged, total, page: Number(page), pageSize: Number(pageSize) });
});

router.get('/hot', (req, res) => {
  const products = queryAll('products').sort((a, b) => b.sales - a.sales).slice(0, 8);
  res.json(products);
});

router.get('/new', (req, res) => {
  const products = queryAll('products').sort((a, b) => b.id - a.id).slice(0, 8);
  res.json(products);
});

router.get('/:id', (req, res) => {
  const product = queryOne('products', { id: Number(req.params.id) });
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json(product);
});

export default router;
