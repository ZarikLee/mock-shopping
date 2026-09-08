<template>
  <div class="rv-page">
    <div class="rv-head">
      <div>
        <h1>回顾与成就</h1>
        <p class="rv-sub">看看这段日子，夸夸坚持的自己</p>
      </div>
      <div class="rv-acts">
        <button class="rv-share" @click="genShare">分享成就</button>
        <button class="rv-refresh" @click="load" title="刷新数据">↻</button>
      </div>
    </div>

    <div v-if="loading" class="rv-load"><span class="spin"></span><p>正在整理你的日子…</p></div>

    <template v-else>
      <!-- 总览 -->
      <div class="stat-row">
        <div class="stat"><b>{{ totalDays }}</b><span>记录天数</span></div>
        <div class="stat"><b>{{ totalTasks }}</b><span>累计任务</span></div>
        <div class="stat"><b>{{ allDoneDays }}</b><span>全完成的天</span></div>
        <div class="stat"><b>{{ streak }} 天</b><span>最长连续记录</span></div>
      </div>

      <!-- 回顾区 -->
      <div class="rv-sec">
        <div class="rv-sec-head">
          <h2>回顾</h2>
          <div class="seg">
            <button :class="{ on: scope === 'month' }" @click="scope = 'month'">本月</button>
            <button :class="{ on: scope === 'last' }" @click="scope = 'last'">上月</button>
            <button :class="{ on: scope === 'year' }" @click="scope = 'year'">今年</button>
          </div>
        </div>

        <div class="rv-box">
          <p class="rv-summary" v-if="!reviewText">选择范围，看看这段日子你做了什么。</p>
          <p class="rv-summary" v-else>{{ reviewText }}</p>
          <button class="gen" @click="makeReview">生成{{ scopeLabel }}回顾</button>
        </div>
      </div>

      <!-- 成就 -->
      <div class="rv-sec">
        <div class="rv-sec-head"><h2>成就</h2><span class="rv-hint">已点亮 {{ earned }} / {{ badges.length }}</span></div>
        <div class="badges">
          <div v-for="b in badges" :key="b.k" class="badge" :class="{ on: b.got, now: b.k === justUnlocked }">
            <span class="b-ico">{{ b.ico }}</span>
            <span class="b-name">{{ b.name }}</span>
            <span class="b-desc">{{ b.got ? (b.when ? '达成于 ' + b.when : '已达成') : '未解锁' }}</span>
          </div>
        </div>
      </div>
    </template>

    <!-- 分享预览 -->
    <transition name="fade">
      <div v-if="shareOpen" class="share-mask" @click.self="shareOpen = false">
        <div class="share-box">
          <div class="share-bar">
            <span class="share-name">{{ THEMES[themeIdx].name }} · {{ themeIdx + 1 }}/{{ THEMES.length }}</span>
            <button class="share-next" @click="themeIdx = (themeIdx + 1) % THEMES.length; genShare()">换一个模板 ↻</button>
          </div>
          <img :src="shareUrl" alt="分享图" />
          <div class="share-ops">
            <button class="share-save" @click="downloadShare">保存图片</button>
            <button class="share-cancel" @click="shareOpen = false">关闭</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { projectApi } from '../api/projects'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const pid = ref(Number(route.params.projectId))
const logs = ref([])
const loading = ref(true)
const scope = ref('month')
const justUnlocked = ref('')

const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const pad = n => String(n).padStart(2, '0')
const dstr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const now = new Date()
const today = dstr(now)

const scopeLabel = computed(() => ({ month: '本月', last: '上月', year: '今年' }[scope.value] || '本月'))
const scopeRange = computed(() => {
  const d = new Date()
  let s, e
  if (scope.value === 'month') { s = new Date(d.getFullYear(), d.getMonth(), 1); e = d }
  else if (scope.value === 'last') { s = new Date(d.getFullYear(), d.getMonth() - 1, 1); e = new Date(d.getFullYear(), d.getMonth(), 0) }
  else { s = new Date(d.getFullYear(), 0, 1); e = d }
  return { s: dstr(s), e: dstr(e) }
})

const rangeLogs = computed(() => {
  const { s, e } = scopeRange.value
  return logs.value.filter(l => l.date >= s && l.date <= e)
})
const totalDays = computed(() => rangeLogs.value.length)
const totalTasks = computed(() => rangeLogs.value.reduce((n, l) => n + (l.items || []).length, 0))
const doneInRange = computed(() => rangeLogs.value.reduce((n, l) => n + (l.items || []).filter(i => i.done).length, 0))
const allDoneDays = computed(() => logs.value.filter(l => (l.items || []).length && (l.items || []).every(i => i.done)).length)
const streak = computed(() => longestStreak())

function rangeSummary() {
  const t = totalTasks.value, d = doneInRange.value, p = t ? Math.round((d / t) * 100) : 0
  const days = rangeLogs.value.length
  let s = `${scopeLabel.value}共记录 ${days} 天，任务 ${t} 条，完成 ${d} 条（${p}%）。`
  if (!t) { s += ' 这个周期还没有任务记录，从今天写第一条开始吧。'; return s }
  const best = rangeLogs.value.reduce((m, l) => { const dl = (l.items || []).filter(i => i.done).length; const dt = (l.items || []).length; const r = dt ? dl / dt : 0; return r > (m ? m.r : -1) ? { date: l.date, r } : m }, null)
  if (best && best.r > 0) s += ` 完成率最高的是 ${best.date}。`
  if (p >= 90) s += ' 这个周期收尾漂亮，节奏很稳，继续保持。'
  else if (p >= 70) s += ' 大部分都完成了，很棒，差的一点明天补上就好。'
  else if (p >= 40) s += ' 完成过半，值得肯定——试着每天只留最重要的 3 件，会更轻松。'
  else s += ' 起步最难，先挑一两件最重要的事开始，慢慢来。'
  return s
}

const reviewText = ref('')
const shareUrl = ref('')
const shareOpen = ref(false)
const themeIdx = ref(0)
function makeReview() {
  reviewText.value = rangeSummary()
  const d = doneInRange.value, t = totalTasks.value
  const p = t ? d / t : 0
  if (p >= 1 && t) unlockIf('perfect_range')
}

const THEMES = [
  { name: '宣纸暖', bg: ['#faf6ef', '#f0e7d6', '#e4d4bb'], ink: '#2b2b2b', dim: 'rgba(90,80,70,.65)', accent: 'rgba(180,120,80,.9)', deco: '#d9c6a8', box: 'rgba(255,255,255,.62)' },
  { name: '月白蓝', bg: ['#eef4fb', '#dce9f7', '#c4d8ec'], ink: '#22314a', dim: 'rgba(60,80,110,.6)', accent: 'rgba(52,96,150,.9)', deco: '#aec6e4', box: 'rgba(255,255,255,.62)' },
  { name: '墨玉绿', bg: ['#eef5ee', '#dcebe0', '#c2d9c6'], ink: '#20392a', dim: 'rgba(60,100,75,.6)', accent: 'rgba(62,120,86,.9)', deco: '#a8cdb0', box: 'rgba(255,255,255,.6)' },
  { name: '薄雾紫', bg: ['#f6f2fb', '#e9e2f6', '#d4c8ec'], ink: '#34284f', dim: 'rgba(80,60,120,.6)', accent: 'rgba(115,88,180,.9)', deco: '#c5b4e4', box: 'rgba(255,255,255,.62)' },
  { name: '落樱粉', bg: ['#fdf3f3', '#f9e4e2', '#efc8c4'], ink: '#55201f', dim: 'rgba(140,70,66,.6)', accent: 'rgba(190,90,86,.9)', deco: '#eab9b3', box: 'rgba(255,255,255,.6)' },
  { name: '星夜灰蓝', bg: ['#20293a', '#141b2a', '#0b0f1a'], ink: '#e8edf5', dim: 'rgba(200,210,230,.72)', accent: 'rgba(150,180,220,.95)', deco: '#3c4a66', box: 'rgba(255,255,255,.10)', stroke: 'rgba(150,180,220,.4)' },
  { name: '苔原绿灰', bg: ['#eceee6', '#dde3d3', '#c6cfb8'], ink: '#2b3222', dim: 'rgba(80,95,60,.6)', accent: 'rgba(110,135,80,.95)', deco: '#aebda0', box: 'rgba(255,255,255,.6)' },
  { name: '奶茶棕', bg: ['#f9f1e6', '#f0dfc6', '#e0c7a2'], ink: '#4a2f17', dim: 'rgba(120,85,45,.62)', accent: 'rgba(150,105,55,.95)', deco: '#cdab7d', box: 'rgba(255,255,255,.6)' },
  { name: '晨雾青', bg: ['#eef7f6', '#dbecec', '#bfdbdb'], ink: '#1f3f3f', dim: 'rgba(50,100,100,.6)', accent: 'rgba(40,120,120,.95)', deco: '#9cc4c4', box: 'rgba(255,255,255,.62)' },
  { name: '夕照橙', bg: ['#fdf1e4', '#f8dcbc', '#eeb98a'], ink: '#55280e', dim: 'rgba(150,80,30,.6)', accent: 'rgba(200,110,45,.95)', deco: '#e6a86e', box: 'rgba(255,255,255,.55)' },
]
const QUOTES = ['日子因记录而有了重量，也因回望而有了光。', '把今天认真写完，明天自会认真作答。', '时间不语，却在纸上留下了它走过的样子。', '慢慢来，比较快——你已经在路上。', '所谓坚持，不过是把寻常的一天又过好了一次。', '愿所记皆有回响，所行皆有来路。']
function wrapLines(ctx, text, maxW) { const out=[]; let cur=''; for (const ch of text) { if (ctx.measureText(cur+ch).width>maxW && cur){out.push(cur);cur=ch}else cur+=ch } if(cur)out.push(cur); return out }
function drawRoundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill()}
function genShare(){
  const th = THEMES[themeIdx.value]
  const W=1080,H=1440; const cv=document.createElement('canvas'); cv.width=W; cv.height=H
  const ctx=cv.getContext('2d')
  const serif='"Songti SC","STSong","Noto Serif SC",Georgia,serif'
  const sans='-apple-system,"PingFang SC",sans-serif'
  const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,th.bg[0]); g.addColorStop(.55,th.bg[1]); g.addColorStop(1,th.bg[2])
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H)
  const stroke = th.stroke || 'rgba(180,120,80,.5)'
  ctx.save(); ctx.globalAlpha=.18; ctx.fillStyle=th.deco
  if(themeIdx.value%3===0){ctx.beginPath();ctx.arc(W-90,190,300,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(70,H-150,260,0,Math.PI*2);ctx.fill()}
  else if(themeIdx.value%3===1){ctx.beginPath();ctx.arc(W/2,H-120,430,0,Math.PI*2);ctx.fill()}
  else { for(let i=0;i<26;i++){ctx.beginPath();ctx.arc(80+i*38,120+(i%4)*60,4+(i%3)*3,0,Math.PI*2);ctx.fill()} }
  ctx.restore()
  ctx.strokeStyle=stroke; ctx.lineWidth=2; ctx.strokeRect(52,52,W-104,H-104)
  ctx.globalAlpha=.5; ctx.strokeRect(64,64,W-128,H-128); ctx.globalAlpha=1
  ctx.fillStyle=th.ink; ctx.font='600 44px '+sans; ctx.textAlign='left'
  ctx.fillText('纸上 · Paper Todo',96,148)
  ctx.font='20px '+sans; ctx.fillStyle=th.dim; ctx.fillText('像写日记一样，把每天写下来',96,192)
  const d=new Date(); const now={y:d.getFullYear(),m:d.getMonth()+1}
  const lab = scope.value==='year' ? `${now.y} 年度回顾` : scope.value==='last' ? `${now.y}年${now.m===1?12:now.m-1}月` : `${now.y}年${now.m}月`
  ctx.fillStyle=th.ink; ctx.font='700 84px '+serif; ctx.fillText(lab,96,350)
  ctx.fillStyle=th.accent; ctx.font='24px '+sans; ctx.fillText(scopeLabel.value+' · 与日子温柔交手',96,410)
  const q=QUOTES[Math.floor(Math.random()*QUOTES.length)]
  ctx.fillStyle=th.ink; ctx.font='42px '+serif; let yy=540
  wrapLines(ctx,'「'+q+'」',W-200).forEach(line=>{ctx.fillText(line,96,yy);yy+=68})
  const stats=[{t:'记录天数',v:String(totalDays.value)},{t:'完成任务',v:String(doneInRange.value)},{t:'完成率',v:totalTasks.value?Math.round(doneInRange.value/totalTasks.value*100)+'%':'—'}]
  const cw=(W-192-40)/3
  stats.forEach((s2,i)=>{const x=96+i*(cw+20);ctx.fillStyle=th.box;drawRoundRect(ctx,x,760,cw,210,24);ctx.fillStyle=th.accent;ctx.font='700 84px '+serif;ctx.textAlign='center';ctx.fillText(s2.v,x+cw/2,880);ctx.fillStyle=th.dim;ctx.font='22px '+sans;ctx.fillText(s2.t,x+cw/2,930);ctx.textAlign='left'})
  ctx.fillStyle=th.dim; ctx.font='400 30px '+serif; let cy=1180
  wrapLines(ctx,reviewText.value||'愿你在记录里，遇见更从容的自己。',W-200).slice(0,4).forEach(line=>{ctx.fillText(line,96,cy);cy+=52})
  ctx.strokeStyle=stroke; ctx.beginPath(); ctx.moveTo(96,H-170); ctx.lineTo(W-96,H-170); ctx.stroke()
  ctx.fillStyle=th.dim; ctx.font='24px '+sans; ctx.fillText('纸上 · Paper Todo　papertodo.com',96,H-112)
  shareUrl.value=cv.toDataURL('image/png'); shareOpen.value=true
}
function downloadShare(){ const a=document.createElement('a'); a.href=shareUrl.value; a.download='纸上成就.png'; a.click() }
function longestStreak() {
  const dates = [...new Set(logs.value.map(l => l.date))].sort()
  let best = 0, cur = 0, prev = ''
  for (const date of dates) {
    const gap = prev ? (new Date(date) - new Date(prev)) / 86400000 : 1
    cur = gap === 1 ? cur + 1 : 1
    if (cur > best) best = cur
    prev = date
  }
  return best
}

/* —— 成就 —— */
const badges = ref([])
const earned = computed(() => badges.value.filter(b => b.got).length)
function evalBadges() {
  const days = logs.value.slice().sort((a, b) => a.date.localeCompare(b.date))
  const recordDates = days.filter(l => (l.items || []).length)
  const perfect = recordDates.filter(l => (l.items || []).every(i => i.done)).length
  const allItems = days.reduce((n, l) => n + (l.items || []).length, 0)
  const allDone = days.reduce((n, l) => n + (l.items || []).filter(i => i.done).length, 0)
  const st = longestStreak()
  const list = [
    { k: 'first', ico: '🌱', name: '第一步', got: recordDates.length >= 1, when: recordDates[0] && recordDates[0].date },
    { k: 's3', ico: '🔥', name: '连续 3 天', got: st >= 3 },
    { k: 's7', ico: '✨', name: '连续 7 天', got: st >= 7 },
    { k: 's30', ico: '🏆', name: '连续 30 天', got: st >= 30 },
    { k: 'p1', ico: '✅', name: '满分的日子', got: perfect >= 1 },
    { k: 'p5', ico: '⭐', name: '满分 ×5', got: perfect >= 5 },
    { k: 'p20', ico: '💎', name: '满分 ×20', got: perfect >= 20 },
    { k: 't100', ico: '📝', name: '任务 100 条', got: allItems >= 100 },
    { k: 't500', ico: '🚀', name: '任务 500 条', got: allItems >= 500 },
    { k: 'rate90', ico: '🎯', name: '累计完成率 90%+', got: allItems >= 20 && allDone / allItems >= 0.9 },
  ]
  badges.value = list
  // 若有新点亮则高亮一个（简单提示）
  const just = list.find(b => b.got && !b.when)
  if (just) { justUnlocked.value = just.k; setTimeout(() => { justUnlocked.value = '' }, 4000) }
}
function unlockIf(k) {
  const b = badges.value.find(x => x.k === k)
  if (b && !b.got) { b.got = true; justUnlocked.value = k; setTimeout(() => { justUnlocked.value = '' }, 4000) }
}

async function load() {
  loading.value = true
  try {
    const res = await projectApi.logs(pid.value, { full: 1 })
    const arr = Array.isArray(res) ? res : (res.logs || [])
    logs.value = arr.filter(l => (l.items || []).length)
  } catch { logs.value = [] }
  loading.value = false
  evalBadges()
  makeReview()
}
onMounted(() => { if (!user.isLoggedIn) { router.push('/login'); return } load() })
</script>

<style scoped>
.rv-page { padding: clamp(16px, 3vw, 30px) clamp(14px, 4vw, 40px) 90px; width: 100%; box-sizing: border-box; max-width: 1200px; margin: 0 auto; }
.rv-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.rv-head h1 { font-size: 22px; margin: 0 0 4px; }
.rv-sub { color: var(--text-2); font-size: 13px; margin: 0; }
.rv-acts { display: flex; align-items: center; gap: 10px; }
.rv-share { border: none; border-radius: 9px; background: linear-gradient(120deg,#d9a45b,#c07b52); color: #fff; padding: 8px 14px; font-size: 13px; cursor: pointer; }
.share-mask { position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 260; display: flex; align-items: center; justify-content: center; padding: 20px; }
.share-box { width: min(460px, 94vw); display: flex; flex-direction: column; gap: 12px; }
.share-bar { display: flex; align-items: center; justify-content: space-between; }
.share-name { font-size: 13px; color: var(--text); }
.share-next { border: none; border-radius: 8px; background: var(--surface-2); color: var(--accent); padding: 6px 12px; font-size: 12px; cursor: pointer; }
.share-box img { width: 100%; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
.share-ops { display: flex; justify-content: center; gap: 12px; }
.share-save { border: none; border-radius: 9px; background: var(--accent); color: #fff; padding: 10px 20px; font-size: 14px; cursor: pointer; }
.share-cancel { border: 1px solid var(--border); border-radius: 9px; background: var(--surface); color: var(--text); padding: 10px 20px; font-size: 14px; cursor: pointer; }
.rv-refresh { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 18px; cursor: pointer; }
.rv-load { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 90px 0; color: var(--text-2); font-size: 13px; }
.spin { width: 36px; height: 36px; border-radius: 50%; border: 3px solid var(--surface-2); border-top-color: var(--accent); animation: sp .8s linear infinite; }
@keyframes sp { to { transform: rotate(360deg); } }
.stat-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; margin-bottom: 22px; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 16px; text-align: center; }
.stat b { display: block; font-size: 24px; color: var(--accent); }
.stat span { color: var(--text-2); font-size: 12px; }
.rv-sec { margin-bottom: 24px; }
.rv-sec-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.rv-sec-head h2 { font-size: 17px; margin: 0; }
.seg { display: flex; background: var(--surface-2); border-radius: 9px; padding: 3px; gap: 3px; }
.seg button { border: none; background: transparent; color: var(--text-2); padding: 6px 14px; border-radius: 7px; font-size: 13px; cursor: pointer; }
.seg button.on { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: var(--shadow); }
.rv-box { background: linear-gradient(120deg, rgba(10,132,255,.08), rgba(123,108,255,.08)); border: 1px solid var(--border); border-radius: 16px; padding: 18px 20px; }
.rv-summary { line-height: 1.9; font-size: 14px; color: var(--text); white-space: pre-line; margin: 0 0 14px; }
.gen { border: none; border-radius: 10px; background: var(--accent); color: #fff; padding: 9px 18px; font-size: 14px; cursor: pointer; }
.gen:hover { opacity: .9; }
.rv-hint { color: var(--text-2); font-size: 12px; }
.badges { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.badge { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px; text-align: center; opacity: .5; filter: grayscale(.6); }
.badge.on { opacity: 1; filter: none; }
.badge.now { outline: 2px solid var(--accent); }
.b-ico { font-size: 26px; display: block; margin-bottom: 6px; }
.b-name { display: block; font-weight: 600; font-size: 13px; margin-bottom: 4px; }
.b-desc { font-size: 11px; color: var(--text-2); }
</style>

@media (max-width: 640px){ .badges { grid-template-columns: repeat(auto-fill, minmax(110px, 1fr)); } .rv-box { padding: 14px; } }
