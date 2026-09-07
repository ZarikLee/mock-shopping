<template>
  <div class="rv-page">
    <div class="rv-head">
      <div>
        <h1>回顾与成就</h1>
        <p class="rv-sub">看看这段日子，夸夸坚持的自己</p>
      </div>
      <button class="rv-refresh" @click="load" title="刷新数据">↻</button>
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
function makeReview() {
  reviewText.value = rangeSummary()
  const d = doneInRange.value, t = totalTasks.value
  const p = t ? d / t : 0
  if (p >= 1 && t) unlockIf('perfect_range')
}
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
.rv-page { padding: 26px 30px 90px; max-width: 980px; }
.rv-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.rv-head h1 { font-size: 22px; margin: 0 0 4px; }
.rv-sub { color: var(--text-2); font-size: 13px; margin: 0; }
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
