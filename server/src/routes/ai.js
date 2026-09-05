import { Router } from 'express';
import { queryAll, queryOne } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();
const KEY = process.env.DEEPSEEK_API_KEY || '';

async function callDeepSeek(messages) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 300, temperature: 0.9 }),
  });
  const data = await r.json();
  return data?.choices?.[0]?.message?.content || '';
}

function gatherContext(user, project) {
  const logs = queryAll('day_logs', { projectId: project.id })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 7);
  const days = logs.map(l => {
    const texts = (l.items || []).map(i => (i.done ? '[完成]' : '[未完成]') + (i.text || '')).filter(Boolean).join('；');
    return `${l.date}（${l.weekday}）：${texts || '（空）'}`;
  }).join('\n');
  const name = user.nickname || user.account;
  const kind = project.type === 'school' ? '学校' : '企业';
  return `用户：${name}（${user.role === 'student' ? '学生' : '职场人'}），在「${project.name}」（${kind}）。近一周记录：\n${days || '暂无记录。'}`;
}

function fallbackReply(context, msg) {
  // 无密钥时的极简人性化短句
  return `我看到你今天记的几笔啦，简单聊两句没问题～`;
}

router.post('/', authMiddleware, async (req, res) => {
  const { message, messages } = req.body || {};
  const text = String(message || '').trim();
  if (!text) return res.status(400).json({ error: '空消息' });
  const project = queryOne('projects', { id: Number(req.body.projectId), userId: req.user.id });
  if (!project) return res.status(404).json({ error: '项目不存在' });
  const user = queryOne('users', { id: req.user.id });
  const context = gatherContext(user, project);

  const sys = [
    '你是一个很亲近的朋友式聊天 AI，用户在用一款极简的每日记录工具。',
    '请读下面的背景，自然地聊，像真人微信聊天：',
    '规则：必须用中文；语句短（一般 10–25 字）；一次只回一小句，不要连续发好几段长文；不要用“您好”等客套；不要用列表或序号；可以自然地回应/共情/给一句简单建议或鼓励；称呼直接用用户名。',
    '背景：' + context,
  ].join('\n');

  const history = Array.isArray(messages) ? messages.slice(-8) : [];
  const deepMessages = [{ role: 'system', content: sys }];
  history.forEach(m => deepMessages.push({ role: m.role === 'ai' ? 'assistant' : 'user', content: String(m.content || '').slice(0, 500) }));
  deepMessages.push({ role: 'user', content: text.slice(0, 500) });

  let reply;
  if (KEY) { try { reply = await callDeepSeek(deepMessages); } catch { reply = '嗯……我这边网络抖了一下，你再说一次？' } }
  else { reply = fallbackReply(context, text); }
  if (!reply) reply = '嗯嗯，我在听～';

  // 归一化，去掉过长的合并，便于前端分段
  reply = reply.replace(/\r/g, '').trim();
  res.json({ reply });
});

export default router;
