import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, async (req, res) => {
  await getDb();
  const { items, address } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  let totalAmount = 0;
  const orderItems = items.map(item => {
    const product = queryOne('SELECT * FROM products WHERE id = ?', [item.productId]);
    if (!product) throw new Error(`Product ${item.productId} not found`);
    const price = item.price || product.price;
    totalAmount += price * item.quantity;
    return {
      productId: item.productId,
      name: product.name,
      price,
      quantity: item.quantity,
      image: product.image,
      selectedSpec: item.selectedSpec || '',
      selectedColor: item.selectedColor || '',
    };
  });

  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  const now = new Date().toISOString();

  try {
    execute(`
      INSERT INTO orders (orderNo, userId, totalAmount, discountAmount, payAmount, status, address, createTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [orderNo, req.user.id, totalAmount, 0, totalAmount, 0, JSON.stringify(address || {}), now]);

    const orderId = lastInsertRowId();

    for (const item of orderItems) {
      execute(`
        INSERT INTO order_items (orderId, productId, name, price, quantity, image, selectedSpec, selectedColor)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [orderId, item.productId, item.name, item.price, item.quantity, item.image, item.selectedSpec, item.selectedColor]);
    }

    const order = queryOne('SELECT * FROM orders WHERE id = ?', [orderId]);
    order.address = JSON.parse(order.address || '{}');
    const itemsResult = queryAll('SELECT * FROM order_items WHERE orderId = ?', [orderId]);
    res.json({ ...order, items: itemsResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  await getDb();
  const { status } = req.query;
  let sql = 'SELECT * FROM orders WHERE userId = ?';
  const params = [req.user.id];
  if (status !== undefined) {
    sql += ' AND status = ?';
    params.push(Number(status));
  }
  sql += ' ORDER BY createTime DESC';
  const orders = queryAll(sql, params).map(o => ({
    ...o,
    address: JSON.parse(o.address || '{}'),
    logistics: o.logistics ? JSON.parse(o.logistics) : null,
    items: queryAll('SELECT * FROM order_items WHERE orderId = ?', [o.id]),
  }));
  res.json(orders);
});

router.get('/:id', authMiddleware, async (req, res) => {
  await getDb();
  const order = queryOne('SELECT * FROM orders WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.address = JSON.parse(order.address || '{}');
  order.logistics = order.logistics ? JSON.parse(order.logistics) : null;
  order.items = queryAll('SELECT * FROM order_items WHERE orderId = ?', [order.id]);
  res.json(order);
});

router.post('/:id/pay', authMiddleware, async (req, res) => {
  await getDb();
  const order = queryOne('SELECT * FROM orders WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be paid' });

  const user = queryOne('SELECT * FROM users WHERE id = ?', [req.user.id]);
  if (user.balance < order.payAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const now = new Date().toISOString();
  execute('UPDATE users SET balance = balance - ? WHERE id = ?', [order.payAmount, req.user.id]);
  execute('UPDATE orders SET status = 1, payTime = ? WHERE id = ?', [now, order.id]);

  const updated = queryOne('SELECT * FROM orders WHERE id = ?', [order.id]);
  updated.address = JSON.parse(updated.address || '{}');
  updated.items = queryAll('SELECT * FROM order_items WHERE orderId = ?', [updated.id]);
  res.json(updated);
});

router.post('/:id/cancel', authMiddleware, async (req, res) => {
  await getDb();
  const order = queryOne('SELECT * FROM orders WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be cancelled' });

  execute('UPDATE orders SET status = -1 WHERE id = ?', [order.id]);
  res.json({ message: 'Order cancelled' });
});

router.post('/:id/complete', authMiddleware, async (req, res) => {
  await getDb();
  const order = queryOne('SELECT * FROM orders WHERE id = ? AND userId = ?', [Number(req.params.id), req.user.id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 1) return res.status(400).json({ error: 'Order cannot be completed' });

  const now = new Date().toISOString();
  execute('UPDATE orders SET status = 2, completeTime = ? WHERE id = ?', [now, order.id]);
  res.json({ message: 'Order completed' });
});

export default router;
