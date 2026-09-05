import { Router } from 'express';
import { queryAll, queryOne } from '../db.js';
import { authMiddleware } from './auth.js';

const router = Router();
const KEY = process.env.DEEPSEEK_API_KEY || '';

const WD = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
const wk = d => WD[new Date(d + 'T00:00:00').getDay()];
const pad2 = n => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);

function loadLogs(projectId) {
  return queryAll('day_logs', { projectId })
    .map(l => ({
      date: String(l.date),
      weekday: wk(String(l.date)),
      items: (l.items || [])
        .map(i => ({ text: String(i.text || '').replace(/^[。.。]\s*$/, '').trim(), done: !!i.done }))
        .filter(i => i.text),
    }))
    .filter(l => l.date)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function dayLine(l) {
  const t = l.items.length;
  const d = l.items.filter(i => i.done).length;
  return `${l.date}（${l.weekday}）：完成 ${d}/${t}`;
}

/* —— 功能 1：周报 —— */
function buildWeekly(logs, name) {
  const last = logs.slice(-7);
  const total = last.reduce((n, l) => n + l.items.length, 0);
  const done = last.reduce((n, l) => n + l.items.filter(i => i.done).length, 0);
  const undone = last.flatMap(l => l.items.filter(i => !i.done).map(i => i.text)).slice(0, 8);
  const out = [];
  out.push(`「${name}」本周周报`);
  out.push(`共记录 ${last.length} 天 · 完成 ${done}/${total} 条（${pct(done, total)}%）`);
  last.forEach(l => {
    out.push(dayLine(l));
    l.items.forEach(i => out.push((i.done ? '· 完成 ' : '· 待办 ') + i.text));
  });
  if (undone.length) out.push(`下周待推进：${undone.join('、')}`);
  else out.push('这周都收尾了，下周轻松点，继续保持');
  return out.join('\n');
}

/* —— 功能 2：今日总结/日报 —— */
function buildToday(logs, today) {
  const l = logs.filter(x => x.date === today).pop();
  const out = [];
  if (!l || !l.items.length) {
    out.push('今天还没有记录任何任务');
    const prev = logs.filter(x => x.date < today).slice(-1)[0];
    const leftover = prev ? prev.items.filter(i => !i.done).slice(0, 5) : [];
    if (leftover.length) out.push(`昨天还有没完成的：${leftover.map(i => i.text).join('、')}，今天要不要优先处理`);
    return out.join('\n');
  }
  const done = l.items.filter(i => i.done);
  const undone = l.items.filter(i => !i.done);
  out.push(`${today}（${l.weekday}）小结`);
  out.push(`完成 ${done.length}/${l.items.length} 条`);
  if (done.length) out.push('已完成：' + done.map(i => i.text).join('、'));
  if (undone.length) out.push('还没完成：' + undone.map(i => i.text).join('、') + `（${undone.length} 条），睡前还有时间就再推一下`);
  else out.push('今天的任务都清完了，收工很棒');
  return out.join('\n');
}

/* —— 功能 3：回顾/复盘 最近几天 —— */
function buildReview(logs, days) {
  const list = logs.slice(-days);
  const total = list.reduce((n, l) => n + l.items.length, 0);
  const done = list.reduce((n, l) => n + l.items.filter(i => i.done).length, 0);
  const undone = list.flatMap(l => l.items.filter(i => !i.done).map(i => i.text));
  const out = [];
  out.push(`最近 ${list.length} 天：共 ${total} 条，完成 ${done} 条（${pct(done, total)}%）`);
  list.forEach(l => out.push(dayLine(l)));
  if (undone.length) {
    const top = {};
    undone.forEach(t => { top[t] = (top[t] || 0) + 1; });
    const rep = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => `${e[0]}（${e[1]}次）`);
    out.push(`反复出现、值得优先处理的：${rep.join('、')}`);
  } else {
    out.push('这几天没有遗留的未完成任务，节奏很稳');
  }
  return out.join('\n');
}

/* —— 功能 4：统计 —— */
function buildStats(logs) {
  const total = logs.reduce((n, l) => n + l.items.length, 0);
  const done = logs.reduce((n, l) => n + l.items.filter(i => i.done).length, 0);
  const days = logs.length;
  const out = [];
  if (!total) return '目前还没有任何记录，从写下第一条任务开始吧';
  out.push(`累计记录 ${days} 天 · 共 ${total} 条任务 · 完成 ${done} 条（${pct(done, total)}%）`);
  const byDay = logs.map(l => ({ date: l.date, d: l.items.filter(i => i.done).length, t: l.items.length })).sort((a, b) => b.d / b.t - a.d / a.t);
  const best = byDay[0];
  if (best) out.push(`完成率最高的一天：${best.date}，完成 ${best.d}/${best.t}`);
  const recent = logs.slice(-7);
  if (recent.length) {
    const rd = recent.reduce((n, l) => n + l.items.filter(i => i.done).length, 0);
    const rt = recent.reduce((n, l) => n + l.items.length, 0);
    out.push(`近一周：完成 ${rd}/${rt}（${pct(rd, rt)}%）`);
  }
  return out.join('\n');
}

/* —— 功能 5：规划明天/整理待办 —— */
function buildPlan(logs) {
  const today = todayStr();
  const undone = logs.flatMap(l => l.items.filter(i => !i.done && l.date <= today).map(i => ({ date: l.date, text: i.text })));
  const future = logs.filter(l => l.date > today).flatMap(l => l.items.map(i => `${l.date} ${i.text}`));
  const out = [];
  out.push('明天的安排可以这样：');
  if (undone.length) {
    const n = Math.min(5, undone.length);
    out.push(`先把未收尾的 ${undone.length} 条里挑重要的：`);
    undone.slice(0, n).forEach((u, i) => out.push(`${i + 1}. ${u.text}（${u.date}遗留）`));
  } else {
    out.push('暂时没有遗留的未完成任务');
  }
  if (future.length) out.push('你已提前排了：' + future.slice(0, 6).join('、'));
  out.push('建议：明天只列最重要的 1–3 条，别贪多，先睡个好觉');
  return out.join('\n');
}

function detectSkill(text, logs, project) {
  const name = project.name;
  if (/周报|周总结|周记|本周.{0,4}(总结|回顾|报告)/.test(text)) return buildWeekly(logs, name);
  if (/日报|今天.{0,6}(总结|小结|回顾|梳理|干了|做了什么|状态)|今日小结|总结今天/.test(text)) return buildToday(logs, todayStr());
  if (/明天|明日|接下来|计划|安排|待办|规划|清单/.test(text)) return buildPlan(logs);
  if (/统计|数据|进度|完成率|分析|多少条|做得怎么样|状态如何/.test(text)) return buildStats(logs);
  if (/回顾|复盘|梳理|小结|最近.{0,6}(状态|怎么样)|这?几天/.test(text)) return buildReview(logs, 7);
  if (/会什么|能做什么|功能|技能|怎么用|help|你能帮/.test(text)) {
    return [
      '我能帮你做这些事，都是基于你的真实记录：',
      '1. 写周报 / 今日总结 / 日报',
      '2. 回顾复盘：最近几天的完成情况',
      '3. 数据统计：完成率、最勤快的一天',
      '4. 规划明天 / 整理未完成任务',
      '直接说“帮我写周报”或“统计一下进度”就行',
    ].join('\n');
  }
  return null;
}

async function callDeepSeek(messages) {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: 'deepseek-chat', messages, max_tokens: 400, temperature: 0.8 }),
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

  // —— Skill：命中具体功能时直接给出完整、真实的结果 ——
  const logs = loadLogs(project.id);
  const skilled = detectSkill(text, logs, project);
  if (skilled) return res.json({ reply: skilled });

  const sys = [
    '你是一个很亲近的朋友式聊天 AI，用户在用一款极简的每日记录工具。',
    '请读下面的背景，自然地聊，像真人微信聊天：',
    '规则：必须用中文；语句短（一般 10–25 字）；一次只回一小句，不要连续发好几段长文；不要用“您好”等客套；不要用列表或序号；可以自然地回应/共情/给一句简单建议或鼓励；称呼直接用用户名。',
    '如果用户需要“写周报/统计/规划”这类具体产出，请提醒他直接说关键词（如“帮我写周报”），我不方便在这个闲聊模式里展开长文。',
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

  reply = reply.replace(/\r/g, '').trim();
  res.json({ reply });
});

export default router;
