import { Router } from 'express';
import { queryAll, queryOne, insert, update, getNextId } from '../db.js';
import { authMiddleware, addExperience } from './auth.js';
import { checkAchievements } from '../achievements.js';

const router = Router();

const ORDER_STATUS_MAP = {
  0: { code: 0, text: '待付款', color: '#ff4400' },
  1: { code: 1, text: '已付款', color: '#52c41a' },
  2: { code: 2, text: '待发货', color: '#1890ff' },
  3: { code: 3, text: '已发货', color: '#722ed1' },
  4: { code: 4, text: '运输中', color: '#13c2c2' },
  5: { code: 5, text: '派送中', color: '#faad14' },
  6: { code: 6, text: '已签收', color: '#52c41a' },
  7: { code: 7, text: '已完成', color: '#999' },
  8: { code: 8, text: '已取消', color: '#999' },
};

function formatOrder(order) {
  if (!order) return null;
  return {
    ...order,
    status: ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP[0],
    logistics: order.logistics || { company: '', no: '', status: [] },
    deliveryType: order.deliveryType || 'express',
    deliveryTimeline: order.deliveryTimeline || [],
    deliveryMethod: order.deliveryMethod || '顺丰速运',
  };
}

function getDeliveryInfo(items) {
  let hasHouse = false;
  let hasCar = false;
  for (const item of items) {
    const product = queryOne('products', { id: item.productId });
    if (!product) continue;
    if (product.categoryId === 9) hasHouse = true;
    if (product.categoryId === 10) hasCar = true;
  }
  if (hasHouse) {
    return { deliveryType: 'on_site', deliveryTimeline: ['手续办理中', '等待现场交付'] };
  }
  if (hasCar) {
    return { deliveryType: 'on_site', deliveryTimeline: ['手续办理中', '等待提车交付'] };
  }
  return { deliveryType: 'express', deliveryTimeline: [] };
}

function getUserStats(userId) {
  const user = queryOne('users', { id: userId });
  const orders = queryAll('orders', { userId });
  let purchase = 0;
  let house = 0;
  let car = 0;
  orders.filter(o => o.status >= 6).forEach(o => {
    const items = o.items || queryAll('order_items', { orderId: o.id });
    purchase += o.count != null ? o.count : items.length;
    for (const item of items) {
      const product = queryOne('products', { id: item.productId });
      if (!product) continue;
      if (product.categoryId === 9) house += 1;
      if (product.categoryId === 10) car += 1;
    }
  });
  return {
    purchase,
    house,
    car,
    stock: 0,
    game: queryAll('game_scores', { userId }).length,
    checkin: queryAll('checkins', { userId }).length,
    balance: user ? user.balance || 0 : 0,
  };
}

function unlockAchievements(userId) {
  const user = queryOne('users', { id: userId });
  if (!user) return [];
  const stats = getUserStats(userId);
  const newAchievements = checkAchievements(user, stats);
  if (newAchievements.length > 0) {
    update('users', userId, { achievements: user.achievements });
  }
  return newAchievements;
}

router.post('/', authMiddleware, (req, res) => {
  const { items, address, discountAmount, payAmount, deliveryMethod } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: '订单商品不能为空' });
  }

  const user = queryOne('users', { id: req.user.id });
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }

  let totalAmount = 0;
  const orderItems = [];
  for (const item of items) {
    const product = queryOne('products', { id: item.productId });
    if (!product) {
      return res.status(400).json({ error: `商品 ${item.productId} 不存在` });
    }
    const price = item.price || product.price;
    totalAmount += price * item.quantity;
    orderItems.push({
      productId: item.productId,
      name: item.name || product.name,
      price,
      quantity: item.quantity,
      image: item.image || product.image,
      selectedSpec: item.selectedSpec || '',
      selectedColor: item.selectedColor || '',
    });
  }

  const orderNo = 'ORD' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase();
  const now = new Date().toISOString();
  const orderId = getNextId('orders');
  const delivery = getDeliveryInfo(orderItems);
  const count = orderItems.reduce((sum, i) => sum + i.quantity, 0);

  const order = insert('orders', {
    id: orderId,
    orderNo,
    userId: req.user.id,
    totalAmount,
    discountAmount: discountAmount || 0,
    payAmount: payAmount || totalAmount,
    status: 0,
    address: address || {},
    createTime: now,
    count,
    deliveryType: delivery.deliveryType,
    deliveryTimeline: delivery.deliveryTimeline,
    deliveryMethod: deliveryMethod || '顺丰速运',
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
  res.json(formatOrder({ ...order, items: itemsResult }));
});

router.get('/', authMiddleware, (req, res) => {
  const { status } = req.query;
  let orders = queryAll('orders', { userId: req.user.id });

  if (status !== undefined) {
    orders = orders.filter(o => o.status === Number(status));
  }

  orders.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));

  const result = orders.map(o => {
    const items = queryAll('order_items', { orderId: o.id });
    return formatOrder({ ...o, items });
  });

  res.json(result);
});

router.get('/:id', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: '订单不存在' });
  const items = queryAll('order_items', { orderId: order.id });
  res.json(formatOrder({ ...order, items }));
});

router.post('/:id/pay', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 0) return res.status(400).json({ error: '订单状态不允许支付' });

  const user = queryOne('users', { id: req.user.id });
  if (user.balance < order.payAmount) {
    return res.status(400).json({ error: '余额不足' });
  }

  const now = new Date().toISOString();
  update('users', req.user.id, { balance: (user.balance || 0) - order.payAmount });

  const expGained = Math.floor(order.payAmount / 100);
  const xpResult = addExperience(req.user.id, expGained);

  const items = queryAll('order_items', { orderId: order.id });
  const delivery = getDeliveryInfo(items);

  let expectedDeliveryDate = null;
  if (delivery.deliveryType === 'express') {
    // 12-36 小时送达
    const expected = new Date(Date.now() + (12 + Math.floor(Math.random() * 25)) * 3600 * 1000);
    expectedDeliveryDate = expected.toISOString();
  }

  const onSite = delivery.deliveryType === 'on_site';
  const logistics = {
    company: onSite ? '现场交付' : (order.deliveryMethod || '顺丰速运'),
    no: (order.deliveryMethod === '京东物流' ? 'JD' : 'SF') + order.orderNo,
    status: [
      { status: '订单已支付', time: now, location: '系统' },
      { status: onSite ? '手续办理中' : '商品已出库，运输中', time: now, location: onSite ? '系统' : '仓库' },
    ],
  };

  const updated = update('orders', order.id, {
    status: onSite ? 1 : 5,
    payTime: now,
    logistics,
    deliveryType: delivery.deliveryType,
    deliveryTimeline: delivery.deliveryTimeline,
    expectedDeliveryDate,
  });

  const newAchievements = unlockAchievements(req.user.id);

  res.json({
    ...formatOrder({ ...updated, items }),
    experienceGained: expGained,
    leveledUp: xpResult.leveledUp,
    newLevel: xpResult.newLevel,
    newAchievements,
  });
});

router.post('/:id/cancel', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: '订单不存在' });
  if (order.status !== 0) return res.status(400).json({ error: '当前订单状态不允许取消' });

  update('orders', order.id, { status: 8 });
  res.json({ message: '订单已取消' });
});

router.post('/:id/complete', authMiddleware, (req, res) => {
  const order = queryOne('orders', { id: Number(req.params.id), userId: req.user.id });
  if (!order) return res.status(404).json({ error: '订单不存在' });
  // 快递已送达（5 派送中/6 已签收待确认）；现场交付（1 手续办理中）
  if (order.status !== 6 && order.status !== 5 && order.status !== 1) return res.status(400).json({ error: '当前订单状态不允许确认收货' });
  // 快递需等待送达时间到达后才能签收
  if (order.status === 5 && order.deliveryType === 'express' && order.expectedDeliveryDate && new Date() < new Date(order.expectedDeliveryDate)) {
    return res.status(400).json({ error: '包裹尚未送达，请耐心等待' });
  }

  const now = new Date().toISOString();
  update('orders', order.id, { status: 7, completeTime: now });
  const newAchievements = unlockAchievements(req.user.id);
  res.json({ message: '订单已确认收货', newAchievements });
});

export default router;
