import { Router } from 'express';
import { queryAll, queryOne, insert, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

// 发送消息
router.post('/', authMiddleware, (req, res) => {
  const { receiverId, content, type } = req.body;
  const senderId = req.user.id;
  if (!receiverId || !content || !content.trim()) {
    return res.status(400).json({ error: '请填写消息内容' });
  }
  const receiver = queryOne('users', { id: Number(receiverId) });
  if (!receiver) return res.status(404).json({ error: '用户不存在' });

  const now = new Date().toISOString();
  const msg = insert('messages', {
    senderId,
    receiverId: Number(receiverId),
    content: content.trim(),
    type: type || 'chat', // 'chat' | 'feedback'
    read: false,
    createdAt: now,
  });
  res.json(msg);
});

// 会话列表
router.get('/conversations', authMiddleware, (req, res) => {
  const me = req.user.id;
  const messages = queryAll('messages').filter(m => m.senderId === me || m.receiverId === me);
  const users = queryAll('users');

  // 找出所有会话对象
  const convMap = {};
  messages.forEach(m => {
    const otherId = m.senderId === me ? m.receiverId : m.senderId;
    if (!convMap[otherId]) {
      convMap[otherId] = { otherId, lastMessage: null, unread: 0, lastTime: '' };
    }
    const conv = convMap[otherId];
    if (!conv.lastMessage || new Date(m.createdAt) > new Date(conv.lastMessage.createdAt)) {
      conv.lastMessage = m;
      conv.lastTime = m.createdAt;
    }
    if (m.receiverId === me && !m.read) {
      conv.unread += 1;
    }
  });

  // 按最后消息时间排序
  const result = Object.values(convMap)
    .sort((a, b) => new Date(b.lastTime) - new Date(a.lastTime))
    .map(conv => {
      const u = users.find(x => x.id === conv.otherId);
      return {
        otherId: conv.otherId,
        otherName: u ? (u.nickname || u.username) : '用户' + conv.otherId,
        otherAvatar: u ? u.avatar : '',
        type: conv.lastMessage ? conv.lastMessage.type : 'chat',
        lastContent: conv.lastMessage ? conv.lastMessage.content : '',
        lastTime: conv.lastTime,
        unread: conv.unread,
      };
    });
  res.json(result);
});

// 与某用户的聊天记录
router.get('/with/:userId', authMiddleware, (req, res) => {
  const me = req.user.id;
  const otherId = Number(req.params.userId);
  const messages = queryAll('messages')
    .filter(m => (m.senderId === me && m.receiverId === otherId) || (m.senderId === otherId && m.receiverId === me))
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(messages);
});

// 标记消息已读
router.post('/:id/read', authMiddleware, (req, res) => {
  const msg = queryOne('messages', { id: Number(req.params.id) });
  if (!msg) return res.status(404).json({ error: '消息不存在' });
  if (msg.receiverId !== req.user.id) return res.status(403).json({ error: '无权操作' });
  update('messages', msg.id, { read: true });
  res.json({ success: true });
});

// 标记与某用户的全部消息已读
router.post('/read-all/:userId', authMiddleware, (req, res) => {
  const me = req.user.id;
  const otherId = Number(req.params.userId);
  const messages = queryAll('messages').filter(m => m.receiverId === me && m.senderId === otherId && !m.read);
  messages.forEach(m => update('messages', m.id, { read: true }));
  res.json({ success: true, count: messages.length });
});

export default router;
