import { Router } from 'express';
import { queryAll, queryOne, insert, update } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();

function parseBlocked(user) {
  if (!user.blockedUsers) return [];
  try { return JSON.parse(user.blockedUsers); } catch { return []; }
}
function saveBlocked(userId, list) {
  update('users', userId, { blockedUsers: JSON.stringify(list) });
}

// 发送消息
router.post('/', authMiddleware, (req, res) => {
  const { receiverId, content, type } = req.body;
  const senderId = req.user.id;
  if (!receiverId || !content || !content.trim()) {
    return res.status(400).json({ error: '请填写消息内容' });
  }
  const receiver = queryOne('users', { id: Number(receiverId) });
  if (!receiver) return res.status(404).json({ error: '用户不存在' });
  const sender = queryOne('users', { id: senderId });
  const senderBlocked = parseBlocked(sender);
  const receiverBlocked = parseBlocked(receiver);
  if (receiverBlocked.includes(senderId)) {
    return res.status(403).json({ error: '你已被对方屏蔽，无法发送消息' });
  }
  if (senderBlocked.includes(Number(receiverId))) {
    return res.status(403).json({ error: '你已屏蔽对方，请先解除屏蔽' });
  }

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

// 屏蔽用户
router.post('/block', authMiddleware, (req, res) => {
  const { userId } = req.body;
  const me = queryOne('users', { id: req.user.id });
  if (!userId || Number(userId) === req.user.id) return res.status(400).json({ error: '参数错误' });
  const list = parseBlocked(me);
  if (!list.includes(Number(userId))) list.push(Number(userId));
  saveBlocked(req.user.id, list);
  res.json({ success: true, blockedUsers: list });
});

// 解除屏蔽
router.post('/unblock', authMiddleware, (req, res) => {
  const { userId } = req.body;
  const me = queryOne('users', { id: req.user.id });
  const list = parseBlocked(me).filter(id => id !== Number(userId));
  saveBlocked(req.user.id, list);
  res.json({ success: true, blockedUsers: list });
});

// 我的屏蔽列表
router.get('/blocked', authMiddleware, (req, res) => {
  const me = queryOne('users', { id: req.user.id });
  res.json(parseBlocked(me));
});

// 举报用户（附带相关消息）
router.post('/report', authMiddleware, (req, res) => {
  const { reportedId, reason, messageIds } = req.body;
  const reporterId = req.user.id;
  if (!reportedId || Number(reportedId) === reporterId) return res.status(400).json({ error: '参数错误' });
  const reported = queryOne('users', { id: Number(reportedId) });
  if (!reported) return res.status(404).json({ error: '用户不存在' });
  const now = new Date().toISOString();
  const report = insert('reports', {
    reporterId,
    reportedId: Number(reportedId),
    reason: reason || '其他',
    messageIds: messageIds || [],
    status: 'pending',
    createdAt: now,
  });
  res.json(report);
});

// 管理员查看举报列表
router.get('/reports', authMiddleware, (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ error: '无权限' });
  const reports = queryAll('reports').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const users = queryAll('users');
  const result = reports.map(r => {
    const reporter = users.find(u => u.id === r.reporterId);
    const reported = users.find(u => u.id === r.reportedId);
    // 附带聊天记录
    const msgs = (r.messageIds || []).map(id => queryOne('messages', { id: Number(id) })).filter(Boolean);
    return {
      ...r,
      reporterName: reporter ? (reporter.nickname || reporter.username) : '用户' + r.reporterId,
      reportedName: reported ? (reported.nickname || reported.username) : '用户' + r.reportedId,
      messages: msgs,
    };
  });
  res.json(result);
});

// 管理员审核通过（确认违规 → 发系统通知给被举报用户）
router.post('/reports/:id/approve', authMiddleware, (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ error: '无权限' });
  const report = queryOne('reports', { id: Number(req.params.id) });
  if (!report) return res.status(404).json({ error: '举报不存在' });
  update('reports', report.id, { status: 'approved' });
  // 发送系统通知给被举报用户
  const now = new Date().toISOString();
  insert('messages', {
    senderId: 1,
    receiverId: report.reportedId,
    content: '你因发布违规言论被举报并已核实，请注意言行规范，文明交流。',
    type: 'system',
    read: false,
    createdAt: now,
  });
  res.json({ success: true, message: '已确认违规，已通知该用户' });
});

// 管理员驳回举报
router.post('/reports/:id/dismiss', authMiddleware, (req, res) => {
  if (req.user.id !== 1) return res.status(403).json({ error: '无权限' });
  const report = queryOne('reports', { id: Number(req.params.id) });
  if (!report) return res.status(404).json({ error: '举报不存在' });
  update('reports', report.id, { status: 'dismissed' });
  res.json({ success: true, message: '已驳回举报' });
});

export default router;
