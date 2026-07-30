import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { items, address } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  let totalAmount = 0;
  const orderItems = items.map(item => {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
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

  const createOrder = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO orders (orderNo, userId, totalAmount, discountAmount, payAmount, status, address, createTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(orderNo, req.user.id, totalAmount, 0, totalAmount, 0, JSON.stringify(address || {}), now);

    const orderId = result.lastInsertRowid;
    const insertItem = db.prepare(`
      INSERT INTO order_items (orderId, productId, name, price, quantity, image, selectedSpec, selectedColor)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const item of orderItems) {
      insertItem.run(orderId, item.productId, item.name, item.price, item.quantity, item.image, item.selectedSpec, item.selectedColor);
    }

    return orderId;
  });

  try {
    const orderId = createOrder();
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    order.address = JSON.parse(order.address || '{}');
    const items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(orderId);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  let sql = 'SELECT * FROM orders WHERE userId = ?';
  const params = [req.user.id];
  if (status !== undefined) {
    sql += ' AND status = ?';
    params.push(Number(status));
  }
  sql += ' ORDER BY createTime DESC';
  const orders = db.prepare(sql).all(...params).map(o => ({
    ...o,
    address: JSON.parse(o.address || '{}'),
    logistics: o.logistics ? JSON.parse(o.logistics) : null,
    items: db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(o.id),
  }));
  res.json(orders);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.address = JSON.parse(order.address || '{}');
  order.logistics = order.logistics ? JSON.parse(order.logistics) : null;
  order.items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(order.id);
  res.json(order);
});

router.post('/:id/pay', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be paid' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (user.balance < order.payAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(order.payAmount, req.user.id);
  db.prepare('UPDATE orders SET status = 1, payTime = ? WHERE id = ?').run(now, order.id);

  const updated = db.prepare('SELECT * FROM orders WHERE id = ?').get(order.id);
  updated.address = JSON.parse(updated.address || '{}');
  updated.items = db.prepare('SELECT * FROM order_items WHERE orderId = ?').all(updated.id);
  res.json(updated);
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be cancelled' });

  db.prepare('UPDATE orders SET status = -1 WHERE id = ?').run(order.id);
  res.json({ message: 'Order cancelled' });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ? AND userId = ?').get(Number(req.params.id), req.user.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 1) return res.status(400).json({ error: 'Order cannot be completed' });

  const now = new Date().toISOString();
  db.prepare('UPDATE orders SET status = 2, completeTime = ? WHERE id = ?').run(now, order.id);
  res.json({ message: 'Order completed' });
});

export default router;
