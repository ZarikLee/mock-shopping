<template>
  <div class="lp">
    <!-- 顶部导航 -->
    <header class="nav">
      <div class="nav-inner">
        <a class="brand" href="/">
          <img src="/papertodo_logo.png?v=2" alt="纸上" />
          <span class="brand-t">纸上 <b>Paper&nbsp;Todo</b></span>
        </a>
        <nav class="nav-links">
          <a href="#features">功能</a>
          <a href="#how">怎么用</a>
          <a href="#ai">AI 小纸</a>
          
        </nav>
        <div class="nav-actions">
          <button class="round" @click="theme.toggle" :title="theme.theme === 'dark' ? '切换到日间' : '切换到暗色'">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
          <button class="ghost" @click="go('/login')">登录</button>
          <button class="primary sm" @click="go('/login')">开始使用</button>
        </div>
      </div>
    </header>

    <!-- 视差/光斑背景 -->
    <div class="bg" aria-hidden="true">
      <span class="blob b1"></span>
      <span class="blob b2"></span>
      <span class="blob b3"></span>
      <span class="grid"></span>
    </div>

    <!-- HERO -->
    <section class="hero">
      <div class="hero-text rv">
        <span class="chip"><i></i> 像写日记一样，把每天写下来</span>
        <h1>
          <span class="row">每天一点记录，</span>
          <span class="row"><span class="grad">积成看得见的</span></span>
          <span class="row type-line">{{ typed }}<i class="caret"></i></span>
        </h1>
        <p class="sub">纸上 · Paper Todo 帮你把待办写成一页页的「日志」——回车即下一项、随手滑动标记完成、AI 自动生成周报。所有内容自动保存，来了就写，走了也没关系。</p>
        <div class="cta-row">
          <button class="primary big" @click="go('/login')">免费开始使用 <span class="arr">→</span></button>
          <button class="outline" @click="scrollTo('#features')">看看它能做什么</button>
        </div>
        <div class="trust">
          <span>✓ 免安装 · 网页即用</span>
          <span>✓ 数据自动云端保存</span>
          <span>✓ 学生 / 职场人通用</span>
        </div>
      </div>

      <!-- 浮动演示卡片 -->
      <div class="hero-visual" aria-hidden="true">
        <div class="tilt">
          <div class="demo">
            <div class="demo-head"><span>纸上 · Paper Todo</span><span class="dot"></span></div>
            <div class="demo-row demo-date"><span class="dd">9 月 6 日</span><span class="week">周六</span><span class="meta">3/3</span></div>
            <div class="demo-li on"><span class="no">1</span><span class="tx">写今天的周报大纲</span><span class="sw"></span></div>
            <div class="demo-li"><span class="no">2</span><span class="tx">运动 30 分钟</span><span class="sw"></span></div>
            <div class="demo-li"><span class="no">3</span><span class="tx">读 20 页书</span><span class="sw"></span></div>
            <div class="demo-foot">已自动保存 20:31</div>
          </div>
          <div class="float-card ai-bub"><b>AI</b> 今天收尾得漂亮，明早从最重要的那件开始 ✨</div>
          <div class="float-card save-bub">✓ 已自动保存</div>
          <div class="float-card cal-bub"><i class="min"></i><i class="min m2"></i><i class="min m3"></i><i class="min m4"></i></div>
        </div>
      </div>
    </section>

    <!-- 跑马灯 -->
    <div class="marquee" aria-hidden="true">
      <div class="mq-track">
        <template v-for="n in 2" :key="n">
          <span v-for="w in words" :key="w + n" class="mq-item">{{ w }}</span>
        </template>
      </div>
    </div>

    <!-- 数据条 -->
    <section class="band rv" id="features">
      <div class="stat" v-for="s in stats" :key="s.label">
        <span class="num"><i :data-count="s.to" ref="statEls">{{ s.from }}</i>{{ s.suffix }}</span>
        <span class="lbl">{{ s.label }}</span>
      </div>
    </section>

    <!-- 功能卡 -->
    <section class="sec">
      <h2 class="sec-t rv">为什么要用「纸上」？</h2>
      <p class="sec-s rv">把散乱的待办，变成能回看、能总结的人生日志</p>
      <div class="grid">
        <div class="card rv" v-for="f in feats" :key="f.t">
          <div class="ico" v-html="f.ico"></div>
          <h3>{{ f.t }}</h3>
          <p>{{ f.d }}</p>
        </div>
      </div>
    </section>

    <!-- 三步 -->
    <section class="sec how" id="how">
      <h2 class="sec-t rv">三步开始记录</h2>
      <div class="steps">
        <div class="step rv" v-for="(s,i) in steps" :key="i">
          <span class="num">{{ i + 1 }}</span>
          <h3>{{ s.t }}</h3>
          <p>{{ s.d }}</p>
        </div>
      </div>
    </section>

    <!-- AI 区域 -->
    <section class="ai-sec rv" id="ai">
      <div class="ai-text">
        <span class="chip violet"><i></i> 小纸 AI</span>
        <h2>不只是记录，还能帮你“写”</h2>
        <p>说一句「帮我写周报」「总结这周」，小纸会基于你真实的记录，直接给你一份能交差的成稿——做完、待办清清楚楚。</p>
        <button class="primary" @click="go('/login')">去和小纸聊聊</button>
      </div>
      <div class="ai-demo">
        <div class="chat me">帮我写这周周报</div>
        <div class="chat ai">
          「中山大学」本周周报<br />共记录 5 天，完成 9/11 条。<br /><br />已完成工作内容：<br />1. 写完周报大纲<br />2. 复习高数第四章…<br /><br />下周计划：<br />1. 处理论文反馈…
        </div>
        <div class="chat me">统计一下进度</div>
        <div class="chat ai">近一周完成 9/11（82%），完成率最高的一天是周三 👏</div>
      </div>
    </section>

    <!-- 最终 CTA -->
    <footer class="foot">
      <img src="/papertodo_logo.png?v=2" alt="纸上" />
      <span>纸上 · Paper Todo</span>
      <span class="sep">|</span>
      <span>© 2026 PaperTodo</span>
      <button class="link" @click="go('/login')">登录</button>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const theme = useThemeStore()

const typed = ref('')
const words = ['把今天记下来', '每天自动保存', '随手滑动完成', 'AI 帮我写周报']
const TITLES = ['纸上 · Paper Todo｜把每天写下来', '纸上 - Paper Todo']
let wTimer = null
let wTimers = []

const go = p => router.push(p)
const scrollTo = sel => document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth' })

const stats = [
  { from: 0, to: 365, suffix: '+', label: '可回看的天数' },
  { from: 0, to: 99, suffix: '.9%', label: '稳定自动保存' },
  { from: 0, to: 8, suffix: 's', label: 'AI 极速成稿' },
  { from: 0, to: 0, suffix: ' 学习成本', label: '打开就会写' },
]
const feats = [
  { t: '云文件管理', d: '所有图片与附件按日期归档，可筛选、上传、删除；容量不够还能用积分永久扩容。', ico: '<svg viewBox="0 0 24 24"><path d="M4 5h16M4 9h10M4 13h6"/><rect x="14" y="12" width="7" height="9" rx="1.5"/></svg>' },
  { t: '积分与激励', d: '每天登录、完成任务都能赚积分；AI 有免费额度、超出消耗积分，云盘用积分扩容，把坚持变成奖励。', ico: '<svg viewBox="0 0 24 24"><path d="M12 3l2 5h5l-4 3.5L17 17l-5-3-5 3 2-5.5L5 8h5z"/></svg>' },
  { t: '像写日记一样记任务', d: '一天一张卡片，回车即写下一项；字体字号随你调，随手滑动标完成，写错可上/下一版本回退。', ico: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8M8 17h5"/></svg>' },
  { t: '图片与附件', d: '每条任务下可传图、缩略图统一大小可预览；每张卡片可挂文件，在线预览 + 下载 + 悬停删除。', ico: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>' },
  { t: 'AI 小纸 · 会写东西', d: '「帮我写周报」即基于你的真实记录给出整段成稿；还能总结、统计完成率、规划明天。', ico: '<svg viewBox="0 0 24 24"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z"/></svg>' },
  { t: '日历热力', d: '月历每天按完成度点亮深浅不一的蓝色方块，5/5 最深、0/5 留白，一眼看出缺勤与节奏。', ico: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="18" rx="2"/><path d="M4 9h16"/><rect x="8" y="13" width="3" height="3" fill="#34c759"/><rect x="12" y="13" width="3" height="3" fill="#0a84ff"/><rect x="16" y="13" width="3" height="3" fill="#5e5ce6"/></svg>' },
  { t: '代码级缩略图', d: '右侧 minimap 像编辑器地图：内容恒定缩放、完成橙色一目了然，点击任意位置直达对应记录。', ico: '<svg viewBox="0 0 24 24"><path d="M4 6h16M4 10h16M4 14h10M4 18h6"/><rect x="16" y="14" width="5" height="4" rx="1"/></svg>' },
  { t: '反馈 → 管理员回复', d: '建议直达管理员并收到站内消息回复；新消息红点角标实时提醒，可一键已读。', ico: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.6 8.6 0 0 1-3.2-.6L3 20l1-5.2A8.5 8.5 0 1 1 21 11.5z"/><circle cx="12" cy="11.5" r="1.6"/></svg>' },
]
const steps = [
  { t: '创建你的学校 / 企业', d: '选学生或职场人，建一个项目，设定开始日期。' },
  { t: '像发日记一样写任务', d: '每天一页，回车续写下一项，滑动标完成，其余交给自动保存。' },
  { t: '回顾与 AI 成稿', d: '翻翻过去的日子，或直接让小纸写周报、做统计、定明日计划。' },
]
const marqueeWords = words.concat(['周报', '每日记录', '自动保存', 'minimap', '日历', 'AI 小纸', '隐私保护', '多项目'])

let io = null
function reveal() {
  io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } })
  }, { threshold: 0.12 })
  document.querySelectorAll('.rv').forEach(el => io.observe(el))
}
function typeLoop() {
  let wi = 0, timers = []
  const fire = (fn, d) => { const t = setTimeout(fn, d); timers.push(t) }
  const type = i => {
    const w = words[wi]
    if (i <= w.length) {
      typed.value = w.slice(0, i)
      fire(() => type(i + 1), i === w.length ? 2000 : 110)
    } else {
      let j = w.length
      const del = () => {
        j--
        typed.value = w.slice(0, j)
        if (j > 0) fire(del, 55)
        else { wi = (wi + 1) % words.length; typed.value = ''; fire(() => type(1), 600) }
      }
      del()
    }
  }
  fire(() => type(1), 400)
  wTimers = timers
}
function countUp() {
  const io2 = new IntersectionObserver(es => {
    es.forEach(e => {
      if (!e.isIntersecting) return
      io2.unobserve(e.target)
      const el = e.target
      const end = Number(el.dataset.count || 0)
      if (!end) { el.textContent = '0'; return }
      const t0 = performance.now(); const dur = 1300
      const tick = now => {
        const p = Math.min(1, (now - t0) / dur)
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)))
        if (p < 1) requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
  }, { threshold: 0.4 })
  document.querySelectorAll('[data-count]').forEach(el => io2.observe(el))
}
function tiltFx() {
  const wrap = document.querySelector('.tilt')
  if (!wrap || !window.matchMedia('(hover:hover)').matches) return
  const move = ev => {
    const r = wrap.getBoundingClientRect()
    const x = (ev.clientX - r.left) / r.width - 0.5
    const y = (ev.clientY - r.top) / r.height - 0.5
    wrap.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg)`
  }
  wrap.addEventListener('mousemove', move)
  wrap.addEventListener('mouseleave', () => { wrap.style.transform = '' })
}
onMounted(() => {
  document.title = TITLES[0]
  reveal(); typeLoop(); countUp(); tiltFx()
})
onBeforeUnmount(() => { clearInterval(wTimer); (wTimers || []).forEach(clearTimeout); if (io) io.disconnect(); document.title = TITLES[1] })
</script>

<style scoped>
.lp { position: relative; min-height: 100vh; overflow-x: hidden; background: var(--bg); color: var(--text); }
.bg { position: fixed; inset: 0; z-index: 0; overflow: hidden; pointer-events: none; }
.blob { position: absolute; border-radius: 50%; filter: blur(90px); opacity: .5; animation: drift 18s ease-in-out infinite; }
.b1 { width: 560px; height: 560px; left: -140px; top: -120px; background: radial-gradient(circle, rgba(10,132,255,.5), transparent 70%); }
.b2 { width: 520px; height: 520px; right: -160px; top: 6%; background: radial-gradient(circle, rgba(124,77,255,.4), transparent 70%); animation-delay: -6s; }
.b3 { width: 480px; height: 480px; left: 30%; bottom: -180px; background: radial-gradient(circle, rgba(0,197,160,.35), transparent 70%); animation-delay: -11s; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px); background-size: 44px 44px; -webkit-mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, #000 30%, transparent 75%); mask-image: radial-gradient(ellipse 70% 50% at 50% 0%, #000 30%, transparent 75%); }
@keyframes drift { 0%,100% { transform: translate(0,0) scale(1); } 33% { transform: translate(40px,-30px) scale(1.08); } 66% { transform: translate(-30px,20px) scale(.94); } }
.nav { position: sticky; top: 0; z-index: 20; backdrop-filter: saturate(1.4) blur(14px); background: color-mix(in srgb, var(--bg) 62%, transparent); border-bottom: 1px solid var(--border); }
.nav-inner { max-width: 1180px; margin: 0 auto; display: flex; align-items: center; gap: 18px; padding: 12px 22px; }
.brand { display: flex; align-items: center; gap: 10px; }
.brand img { width: 30px; height: 30px; border-radius: 8px; }
.brand-t { font-size: 16px; font-weight: 700; }
.brand-t b { color: var(--accent); font-weight: 700; }
.nav-links { display: flex; gap: 22px; margin: 0 auto; }
.nav-links a { color: var(--text-2); font-size: 14px; text-decoration: none; transition: color .2s; }
.nav-links a:hover { color: var(--text); }
.nav-actions { display: flex; align-items: center; gap: 8px; }
.round { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; font-size: 15px; }
.ghost { border: 1px solid var(--border); background: transparent; color: var(--text); border-radius: 9px; padding: 8px 14px; font-size: 14px; cursor: pointer; }
.primary { border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; padding: 12px 22px; transition: transform .2s, box-shadow .2s; }
.primary:hover { transform: translateY(-1px); box-shadow: 0 10px 26px rgba(10,132,255,.35); }
.primary.sm { padding: 8px 16px; }
.primary.big { font-size: 16px; padding: 15px 30px; }
.primary .arr { display: inline-block; transition: transform .2s; }
.primary:hover .arr { transform: translateX(4px); }
.primary.glow { box-shadow: 0 0 0 6px rgba(10,132,255,.12), 0 16px 40px rgba(10,132,255,.4); }
.outline { border: 1px solid var(--border); background: var(--surface); color: var(--text); border-radius: 10px; padding: 14px 22px; font-size: 15px; cursor: pointer; }
.outline:hover { border-color: var(--accent); color: var(--accent); }

.hero { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; padding: 96px 22px 40px; display: flex; align-items: center; gap: 40px; }
.hero-text { flex: 1; min-width: 0; }
.chip { display: inline-flex; align-items: center; gap: 7px; font-size: 13px; color: var(--accent); border: 1px solid color-mix(in srgb, var(--accent) 35%, transparent); background: color-mix(in srgb, var(--accent) 10%, transparent); padding: 6px 12px; border-radius: 999px; margin-bottom: 22px; }
.chip i { width: 7px; height: 7px; border-radius: 50%; background: var(--accent); }
.chip.violet { color: #7b6cff; border-color: rgba(123,108,255,.4); background: rgba(123,108,255,.12); }
.chip.violet i { background: #7b6cff; }
h1 { font-size: clamp(34px, 5.4vw, 60px); line-height: 1.12; letter-spacing: -1px; font-weight: 800; margin: 0 0 20px; }
.grad { background: linear-gradient(100deg, #0a84ff 0%, #7b6cff 55%, #ff5f9e 100%); -webkit-background-clip: text; background-clip: text; color: transparent; }
.row { display: block; }
.type-line { display: block; color: var(--accent); white-space: nowrap; max-width: 100%; overflow: hidden; min-height: 1.06em; }


.caret { font-style: normal; margin-left: 2px; border-right: 3px solid var(--accent); animation: blink 1s steps(1) infinite; }
@keyframes blink { 50% { opacity: 0; } }
.sub { font-size: 16px; line-height: 1.8; color: var(--text-2); max-width: 520px; margin: 0 0 28px; }
.cta-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.trust { display: flex; gap: 16px; flex-wrap: wrap; margin-top: 26px; color: var(--text-2); font-size: 13px; }

.hero-visual { flex: 1; min-width: 320px; perspective: 1000px; }
.tilt { transition: transform .25s ease; transform-style: preserve-3d; }
.demo { position: relative; border-radius: 20px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 30px 80px rgba(0,0,0,.18); padding: 14px 16px; max-width: 420px; margin: 0 auto; }
.demo-head { display: flex; align-items: center; justify-content: space-between; color: var(--text-2); font-size: 12px; border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 8px; }
.demo-head .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); }
.demo-row { display: flex; align-items: center; }
.demo-date { gap: 8px; font-weight: 700; padding: 4px 0 8px; }
.demo-date .week { color: var(--text-2); font-weight: 400; font-size: 13px; }
.demo-date .meta { margin-left: auto; color: var(--green); font-size: 12px; font-weight: 600; }
.demo-li { display: flex; align-items: center; gap: 10px; padding: 8px 2px; border-top: 1px solid var(--border); }
.demo-li .no { color: var(--text-2); font-size: 12px; width: 14px; }
.demo-li .tx { flex: 1; font-size: 14px; }
.demo-li .sw { width: 34px; height: 19px; border-radius: 10px; background: #e6e6ea; position: relative; }
.demo-li.on .sw { background: var(--green); }
.demo-li.on .sw::after { content: ''; position: absolute; left: 17px; top: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; }
.demo-li .sw::after { content: ''; position: absolute; left: 2px; top: 2px; width: 15px; height: 15px; border-radius: 50%; background: #fff; }
.demo-foot { margin-top: 10px; font-size: 11px; color: var(--text-2); }
.float-card { position: absolute; border-radius: 14px; background: var(--surface); border: 1px solid var(--border); box-shadow: 0 18px 50px rgba(0,0,0,.18); padding: 10px 14px; font-size: 13px; animation: floaty 6s ease-in-out infinite; }
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
.ai-bub { top: -34px; right: -14px; background: linear-gradient(135deg, #7b6cff, #0a84ff); color: #fff; border: none; max-width: 210px; animation-delay: -1s; }
.ai-bub b { display: inline-block; background: rgba(255,255,255,.25); border-radius: 5px; font-size: 11px; padding: 0 6px; margin-right: 6px; }
.save-bub { bottom: -18px; left: -16px; color: var(--green); font-weight: 600; animation-delay: -3s; }
.cal-bub { bottom: 30px; right: -26px; display: flex; gap: 4px; animation-delay: -4.5s; }
.cal-bub .min { width: 10px; height: 10px; border-radius: 3px; background: rgba(10,132,255,.2); }
.cal-bub .min.m2 { background: rgba(10,132,255,.45); }
.cal-bub .min.m3 { background: rgba(10,132,255,.7); }
.cal-bub .min.m4 { background: #0a84ff; }

.marquee { position: relative; z-index: 1; overflow: hidden; padding: 10px 0; border-block: 1px solid var(--border); background: color-mix(in srgb, var(--surface) 55%, transparent); -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent); }
.mq-track { display: inline-flex; gap: 10px; white-space: nowrap; animation: scrollX 22s linear infinite; }
.mq-item { font-size: 14px; color: var(--text-2); border: 1px solid var(--border); border-radius: 999px; padding: 6px 16px; background: var(--surface); }
@keyframes scrollX { to { transform: translateX(-50%); } }

.band { position: relative; z-index: 1; max-width: 900px; margin: 60px auto 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 18px; padding: 0 22px; }
.stat { text-align: center; padding: 26px 10px; border-radius: 18px; background: color-mix(in srgb, var(--surface) 70%, transparent); border: 1px solid var(--border); backdrop-filter: blur(6px); }
.stat .num { font-size: 30px; font-weight: 800; color: var(--accent); }
.stat .lbl { display: block; margin-top: 6px; color: var(--text-2); font-size: 13px; }

.sec { position: relative; z-index: 1; max-width: 1180px; margin: 0 auto; padding: 90px 22px 0; }
.sec-t { text-align: center; font-size: clamp(26px, 4vw, 40px); font-weight: 800; letter-spacing: -.5px; margin-bottom: 10px; }
.sec-s { text-align: center; color: var(--text-2); font-size: 15px; margin-bottom: 44px; }
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
.card { padding: 28px 24px; border-radius: 18px; background: var(--surface); border: 1px solid var(--border); transition: transform .25s, box-shadow .25s; }
.card:hover { transform: translateY(-5px); box-shadow: 0 20px 50px rgba(0,0,0,.14); }
.card .ico { width: 46px; height: 46px; border-radius: 13px; background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.card .ico svg { width: 24px; height: 24px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.card h3 { font-size: 18px; margin-bottom: 8px; }
.card p { color: var(--text-2); font-size: 14px; line-height: 1.7; margin: 0; }

.how .steps { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 22px; }
.step { position: relative; padding: 26px 22px; border-radius: 18px; border: 1px dashed var(--border); }
.step .num { position: absolute; top: -16px; left: 18px; width: 34px; height: 34px; border-radius: 10px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.step h3 { margin: 14px 0 8px; font-size: 17px; }
.step p { color: var(--text-2); font-size: 14px; line-height: 1.7; margin: 0; }

.ai-sec { position: relative; z-index: 1; max-width: 1180px; margin: 90px auto 0; padding: 60px 40px; border-radius: 30px; background: linear-gradient(120deg, rgba(10,132,255,.1), rgba(123,108,255,.1)); border: 1px solid var(--border); display: grid; grid-template-columns: 1fr 1fr; gap: 40px; align-items: center; }
.ai-text h2 { font-size: clamp(24px, 3.4vw, 34px); font-weight: 800; margin: 12px 0 12px; }
.ai-text p { color: var(--text-2); line-height: 1.8; margin-bottom: 22px; }
.ai-demo { display: flex; flex-direction: column; gap: 12px; }
.chat { max-width: 86%; padding: 11px 14px; border-radius: 14px; font-size: 13px; line-height: 1.6; }
.chat.me { align-self: flex-end; background: var(--accent); color: #fff; border-bottom-right-radius: 4px; }
.chat.ai { align-self: flex-start; background: var(--surface); border: 1px solid var(--border); border-bottom-left-radius: 4px; }

.cta { position: relative; z-index: 1; max-width: 800px; margin: 100px auto 0; padding: 64px 26px; text-align: center; border-radius: 30px; background: radial-gradient(circle at 50% 0%, rgba(10,132,255,.25), transparent 70%), var(--surface); border: 1px solid var(--border); }
.cta h2 { font-size: clamp(26px, 4.4vw, 44px); font-weight: 800; margin-bottom: 12px; }
.cta p { color: var(--text-2); font-size: 15px; margin-bottom: 26px; }

.foot { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; padding: 40px 20px 60px; color: var(--text-2); font-size: 13px; }
.foot img { width: 24px; height: 24px; border-radius: 7px; }
.foot .sep { opacity: .5; }
.foot .link { border: none; background: none; color: var(--accent); cursor: pointer; font-size: 13px; }

/* reveal */
.rv { opacity: 0; transform: translateY(26px); transition: opacity .7s ease, transform .7s ease; }
.rv.in { opacity: 1; transform: none; }

@media (max-width: 900px) {
  .hero { flex-direction: column; padding-top: 60px; }
  .nav-links { display: none; }
  .hero-visual { width: 100%; }
  .ai-sec { grid-template-columns: 1fr; padding: 40px 24px; }
  .float-card { display: none; }
  .demo { max-width: 100%; }
}
</style>
