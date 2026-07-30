import { Router } from 'express';
import { queryAll, queryOne, insert, update, getNextId } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

router.post('/', authMiddleware, (req, res) => {
  const { items, address } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: 'No items in order' });
  }

  let totalAmount = 0;
  const orderItems = items.map(item => {
    const product = queryOne('products', { id: item.productId });
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
  const orderId = getNextId('orders');

  try {
    const order = insert('orders', {
      id: orderId,
      orderNo,
      userId: req.user.id,
      totalAmount,
      discountAmount: 0,
      payAmount: totalAmount,
      status: 0,
      address: address || {},
      createTime: now,
    });

    for (const item of orderItems) {
      insert('order_items', {
        orderId: order.id,
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        selectedSpec: item.selectedSpec,
        selectedColor: item.selectedColor,
      });
    }

    const itemsResult = queryAll('order_items', { orderId: order.id });
    res.json({ ...order, items: itemsResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  let orders = queryAll('orders', { userId: req.user.id });

  if (status !== undefined) {
    orders = orders.filter(o => o.status === Number(status));
  }

  orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  const result = orders.map(o => ({
    ...o,
    items: queryAll('order_items', { orderId: o.id }),
  }));

  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  order.items = queryAll('order_items', { orderId: order.id });
  res.json(order);
});

router.post('/:id/pay', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be paid' });

  const user = queryOne('users', { id: req.user.id });
  if (user.balance < order.payAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  const now = new Date().toISOString();
  update('users', req.user.id, { balance: user.balance - order.payAmount });
  const updated = update('orders', order.id, { status: 1, payTime: now });
  updated.items = queryAll('order_items', { orderId: updated.id });
  res.json(updated);
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 0) return res.status(400).json({ error: 'Order cannot be cancelled' });

  update('orders', order.id, { status: -1 });
  res.json({ message: 'Order cancelled' });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  if (order.status !== 1) return res.status(400).json({ error: 'Order cannot be completed' });

  const now = new Date().toISOString();
  update('orders', order.id, { status: 2, completeTime: now });
  res.json({ message: 'Order completed' });
});

export default router;
