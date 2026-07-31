import { Router } from 'express';
import { queryOne, queryAll } from '../db.js';
import { getLevel, ACHIEVEMENTS } from '../achievements.js';

const router = Router();

router.get('/:id/profile', (req, res) => {
  const id = Number(req.params.id);
  const user = queryOne('users', { id });
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const orders = queryAll('orders').filter(o => o.userId === id && o.status >= 1);
  const totalPurchases = orders.reduce((sum, o) => sum + (o.count || 0), 0);
  const totalSpent = orders.reduce((sum, o) => sum + (o.payAmount || 0), 0);

  const achievements = (user.achievements || [])
    .map(aid => ACHIEVEMENTS.find(a => a.id === aid))
    .filter(Boolean)
    .map(a => ({ id: a.id, name: a.name, icon: a.icon }));

  res.json({
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    avatar: user.avatar,
    level: getLevel(user.experience || 0),
    experience: user.experience || 0,
    achievements,
    bio: user.bio || '',
    homeCity: user.homeCity || '',
    joinDate: user.created_at || null,
    stats: {
      totalPurchases,
      totalSpent,
    },
  });
});

export default router;
