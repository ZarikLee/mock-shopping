<template>
  <div class="log-screen">
    <header class="topbar">
      <div class="left">
        <button class="back" @click="router.push('/projects')">‹</button>
        <div class="titles">
          <div class="pname">{{ projectName }}</div>
          <div class="pdate">{{ projectSub }}</div>
        </div>
      </div>
      <div class="right">
        <button class="icon-btn" @click="openVersions">版本</button>
        <button class="save-btn" :class="{ dirty: dirtyNum > 0 }" :disabled="saving" @click="saveAll">
          {{ dirtyNum > 0 ? '● 保存' : '已保存' }}
        </button>
        <button class="theme-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </div>
    </header>

    <div v-if="loadError" class="err-banner">加载出错：{{ loadError }}</div>

    <transition name="fade">
      <div v-if="unsavedBanner" class="unsaved-banner">
        <span>检测到有未提交的修改</span>
        <button class="mini primary" @click="saveAll">保存为版本</button>
        <button class="mini ghost" @click="discardAll">放弃改动</button>
      </div>
    </transition>

    <main class="paper" ref="paperEl">
      <section v-for="day in days" :key="day.date" class="day-block"
        :class="{ dim: !isToday(day.date) && !st.editing[day.date] }">
        <div class="day-head" @click="enterDay(day.date)">
          <span class="day-date">{{ dayLabel(day.date) }}</span>
          <span class="day-week">{{ day.weekday }}</span>
          <span class="day-stat" v-if="day.items.length">✓ {{ doneOf(day) }}/{{ day.items.length }}</span>
          <span class="editing-tag" v-if="st.editing[day.date] && !isToday(day.date)">编辑中</span>
          <span class="dirty-dot" v-if="st.dirty[day.date]"></span>
        </div>

        <div class="task-list">
          <div v-for="(it, idx) in day.items" :key="it.id"
            class="task-row" :class="{ glow: isGlow(day.date, idx), done: it.done }"
            :data-date="day.date">
            <span class="num">{{ idx + 1 }}</span>
            <input class="task-input" :value="it.text" :readonly="!isEditable(day.date)"
              placeholder="写点什么…"
              @input="e => edit(day.date, idx, e.target.value)"
              @focus="focusIn(day.date)"
              @keydown="e => rowKey(e, day.date, idx)" />
            <button class="dot" :class="{ off: !it.done }" @click.stop="toggle(day.date, idx)"></button>
            <button v-if="isEditable(day.date)" class="del" @click.stop="remove(day.date, idx)">×</button>
          </div>
        </div>
      </section>

      <div v-if="!loading && !days.length" class="empty">
        <p>还没有任何记录</p>
        <p class="hint">点下方 ＋ 开始记录今天</p>
      </div>

      <div class="newline">
        <button class="plus" @click="startToday">＋</button>
        <span class="newline-hint">开始记录今天</span>
      </div>
    </main>

    <div v-if="showVersions" class="mask" @click.self="showVersions = false">
      <div class="sheet">
        <h3>版本记录 <template v-if="versionDay">· {{ dayLabel(versionDay.date) }}</template></h3>
        <div class="ver-list" v-if="versions.length">
          <div v-for="(v, i) in versions" :key="i" class="ver-item">
            <div class="ver-meta"><span class="ver-no">v{{ v.version }}</span><span class="ver-time">{{ fmtTime(v.createdAt) }}</span></div>
            <div class="ver-preview">{{ preview(v.items) }}</div>
            <button class="mini ghost" @click="rollback(v)">回退到此处</button>
          </div>
        </div>
        <div v-else class="ver-empty">暂无版本，点"保存"创建第一个版本</div>
        <button class="primary full" @click="showVersions = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const pid = Number(route.params.projectId)
const paperEl = ref(null)
const loading = ref(true)
const loadError = ref('')
const projectName = ref('…')
const projectSub = ref('')
const days = ref([])
const saving = ref(false)
const unsavedBanner = ref(false)
const versions = ref([])
const showVersions = ref(false)
const versionDay = ref(null)

// 普通 reactive 对象，避免 Set/Map 陷阱
const st = reactive({ editing: {}, dirty: {}, base: {} }) // base[date] = JSON snapshot
const draftTimer = {}

const WEEKS = ['周日','周一','周二','周三','周四','周五','周六']
const pad = n => String(n).padStart(2, '0')
const nowD = new Date()
const tNow = `${nowD.getFullYear()}-${pad(nowD.getMonth()+1)}-${pad(nowD.getDate())}`
const isToday = d => d === tNow
const dayLabel = d => { const p = d.split('-'); return `${p[0]}年${+p[1]}月${+p[2]}日` }
const wk = d => WEEKS[new Date(d + 'T00:00:00').getDay()]
const fmtTime = t => { if (!t) return ''; const d = new Date(t); return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` }
const doneOf = day => day.items.filter(i => i.done).length
const isEditable = date => !!st.editing[date] || isToday(date)
const dirtyNum = computed(() => Object.keys(st.dirty).filter(d => st.dirty[d]).length)

const snap = items => JSON.stringify(items.map(i => ({ t: i.text, d: !!i.done })))
const itemOf = day => day.items.map((it, idx) => ({ id: it.id, text: it.text, done: it.done, idx }))

let uid = 1
const make = () => ({ id: 'n' + (uid++), text: '', done: false })
const findDay = date => days.value.find(d => d.date === date)

function isGlow(date, idx) {
  const bs = st.base[date]
  if (!bs) return idx >= 0 // no committed version -> all new
  let arr
  try { arr = JSON.parse(bs) } catch { arr = [] }
  const it = findDay(date)?.items[idx]
  if (!it) return false
  if (idx >= arr.length) return true
  return it.text !== arr[idx].t || it.done !== arr[idx].d
}

// ---- load ----
async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const list = await projectApi.list()
    const arr = Array.isArray(list) ? list : (list.projects || [])
    const p = arr.find(x => x.id === pid)
    projectName.value = p?.name || '项目'
    projectSub.value = p ? `${p.type === 'school' ? '入学' : '入职'} ${p.startDate}` : ''
    const logs = await projectApi.logs(pid, { full: 1 })
    const logArr = Array.isArray(logs) ? logs : (logs.logs || [])
    days.value = logArr.map(l => ({ date: l.date, weekday: l.weekday || wk(l.date), items: (l.items || []).map(i => ({ id: i.id != null ? i.id : 's' + (uid++), text: i.text || '', done: !!i.done })) }))
    days.value.forEach(d => { st.base[d.date] = snap(d.items); st.dirty[d.date] = false; st.editing[d.date] = isToday(d.date) })
    // 最新的日设为可编辑（若不是今天，也便于直接续写）
    if (days.value.length) st.editing[days.value[days.value.length - 1].date] = true
    // 检测最新一天是否有未提交草稿
    const last = days.value[days.value.length - 1]
    if (last) {
      try {
        const info = await projectApi.log(pid, last.date)
        if (info.dayLog && info.lastVersion) {
          if (snap(info.dayLog.items) !== snap(info.lastVersion.items)) unsavedBanner.value = true
        }
      } catch {}
    }
  } catch (e) {
    loadError.value = e?.error || '加载失败'
  } finally { loading.value = false }
}

// ---- editing ----
function focusIn(date) { st.editing[date] = true }

function mark(date) { st.dirty[date] = true; unsavedBanner.value = false }
function bump(date) {
  mark(date)
  clearTimeout(draftTimer[date])
  draftTimer[date] = setTimeout(() => saveDraft(date), 800)
}
function edit(date, idx, text) {
  const day = findDay(date); if (!day) return
  day.items[idx].text = text
  bump(date)
}
function toggle(date, idx) {
  const day = findDay(date); if (!day) return
  day.items[idx].done = !day.items[idx].done
  bump(date)
}
function remove(date, idx) {
  const day = findDay(date); if (!day) return
  if (day.items.length <= 1) { day.items[0].text = ''; day.items[0].done = false; focusInput(date, 0); bump(date); return }
  day.items.splice(idx, 1)
  bump(date)
  focusInput(date, Math.max(0, idx - 1))
}
function rowKey(e, date, idx) {
  const day = findDay(date); if (!day) return
  if (e.key === 'Enter') {
    e.preventDefault()
    day.items.splice(idx + 1, 0, make())
    bump(date)
    focusInput(date, idx + 1)
  } else if (e.key === 'Backspace' && !day.items[idx].text) {
    if (day.items.length > 1) {
      e.preventDefault()
      day.items.splice(idx, 1)
      bump(date)
      focusInput(date, Math.max(0, idx - 1))
    }
  }
}
function focusInput(date, idx) {
  requestAnimationFrame(() => {
    const rows = paperEl.value?.querySelectorAll(`[data-date="${date}"] .task-input`)
    rows?.[idx]?.focus()
  })
}
function focusLast(date) {
  const day = findDay(date)
  const n = day ? day.items.length - 1 : 0
  focusInput(date, n)
}
function enterDay(date) {
  st.editing[date] = true
  focusLast(date)
}

// 新增今日
function startToday() {
  let day = findDay(tNow)
  if (!day) {
    day = { date: tNow, weekday: wk(tNow), items: [] }
    days.value.push(day)
  }
  st.editing[tNow] = true
  day.items.push(make())
  mark(tNow)
  bump(tNow)
  focusLast(tNow)
}

// ---- save / draft / versions ----
async function saveDraft(date) {
  const day = findDay(date); if (!day) return
  try { await projectApi.draft(pid, date, { weekday: day.weekday, items: day.items }) } catch {}
}
async function saveAll() {
  saving.value = true
  const dates = Object.keys(st.dirty).filter(d => st.dirty[d])
  for (const date of dates) {
    const day = findDay(date); if (!day) continue
    try {
      await projectApi.commit(pid, date, { weekday: day.weekday, items: day.items })
      st.base[date] = snap(day.items)
      st.dirty[date] = false
    } catch (e) { alert(e?.error || '保存失败') }
  }
  unsavedBanner.value = false
  saving.value = false
}
async function discardAll() {
  unsavedBanner.value = false
  const dates = Object.keys(st.dirty).filter(d => st.dirty[d])
  for (const date of dates) {
    const day = findDay(date); if (!day) continue
    let arr = []
    try { arr = JSON.parse(st.base[date] || '[]').map(x => ({ text: x.t, done: x.d })) } catch {}
    day.items = arr.length ? arr.map(x => ({ id: 's' + (uid++), text: x.text, done: x.done })) : []
    st.dirty[date] = false
    await saveDraft(date)
  }
}
async function openVersions() {
  const day = days.value[days.value.length - 1]
  if (!day) return
  versionDay.value = day
  showVersions.value = true
  try { versions.value = await projectApi.versions(pid, day.date) } catch { versions.value = [] }
}
async function rollback(v) {
  const day = versionDay.value; if (!day) return
  try {
    await projectApi.rollback(pid, day.date, v.id != null ? v.id : v.version)
    day.items = (v.items || []).map(x => ({ id: 's' + (uid++), text: x.text || '', done: !!x.done }))
    st.base[day.date] = snap(day.items)
    st.dirty[day.date] = false
    showVersions.value = false
  } catch (e) { alert(e?.error || '回退失败') }
}
const preview = items => (items || []).slice(0, 3).map(i => (i.done ? '✓ ' : '· ') + (i.text || '')).join('　') + ((items || []).length > 3 ? '…' : '')

onMounted(() => {
  if (!user.isLoggedIn) { router.push('/'); return }
  load()
})
onBeforeUnmount(() => { Object.values(draftTimer).forEach(t => clearTimeout(t)) })
</script>

<style scoped>
.log-screen { min-height: 100vh; }
.topbar { position: sticky; top: 0; z-index: 40; background: var(--bg); backdrop-filter: blur(12px); max-width: 760px; margin: 0 auto; padding: 14px 20px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.left { display: flex; align-items: center; gap: 12px; }
.back { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 20px; cursor: pointer; flex-shrink: 0; }
.pname { font-size: 17px; font-weight: 700; line-height: 1.2; }
.pdate { font-size: 11px; color: var(--text-2); margin-top: 2px; }
.right { display: flex; align-items: center; gap: 8px; }
.icon-btn { padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.theme-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
.save-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.save-btn.dirty { background: var(--accent); border-color: var(--accent); color: #fff; }

.err-banner { max-width: 760px; margin: 12px auto 0; background: var(--red); color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; }
.unsaved-banner { position: sticky; top: 62px; z-index: 39; max-width: 720px; margin: 8px auto 0; width: calc(100% - 40px); display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--glow-border); border-radius: 12px; padding: 10px 14px; box-shadow: var(--shadow); font-size: 14px; }
.unsaved-banner span { flex: 1; color: var(--glow-border); font-weight: 600; }
.mini { padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; }
.mini.primary { background: var(--accent); color: #fff; border: none; }
.mini.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }

.paper { max-width: 760px; margin: 0 auto; padding: 8px 22px 90px; }
.day-block { margin-bottom: 6px; }
.day-block.dim { opacity: .42; }
.day-block.dim:hover { opacity: 1; }
.day-head { display: flex; align-items: center; gap: 10px; padding: 20px 0 6px; cursor: pointer; user-select: none; }
.day-date { font-size: 18px; font-weight: 700; }
.day-week { font-size: 13px; color: var(--text-2); }
.day-stat { margin-left: auto; font-size: 13px; color: var(--text-2); }
.editing-tag { font-size: 11px; background: var(--surface-2); padding: 2px 8px; border-radius: 10px; color: var(--text-2); }
.dirty-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--glow-border); flex-shrink: 0; }

.task-row { display: flex; align-items: center; gap: 10px; padding: 5px 8px; border-radius: 8px; transition: background .15s; }
.task-row:hover { background: var(--surface-2); }
.task-row.glow { background: var(--glow); }
.task-row.done { opacity: .6; }
.task-row.done .task-input { text-decoration: line-through; color: var(--text-2); }
.num { width: 22px; text-align: right; font-size: 14px; color: var(--text-2); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.task-input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--text); font-size: 16px; line-height: 1.7; padding: 3px 0; }
.dot { width: 17px; height: 17px; border-radius: 50%; border: 2px solid var(--red); cursor: pointer; flex-shrink: 0; background: transparent; transition: all .2s; }
.dot.off { border-color: var(--red); }
.dot:not(.off) { border-color: var(--green); background: var(--green); }
.del { border: none; background: transparent; color: var(--text-2); font-size: 15px; cursor: pointer; opacity: 0; transition: opacity .2s; flex-shrink: 0; padding: 0 2px; }
.task-row:hover .del { opacity: 1; }

.empty { text-align: center; color: var(--text-2); padding: 70px 0 20px; }
.hint { font-size: 13px; margin-top: 6px; }
.newline { margin-top: 12px; padding: 16px 0; display: flex; align-items: center; gap: 12px; border-top: 1px dashed var(--border); }
.plus { width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--accent); color: #fff; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,122,255,.3); }
.newline-hint { color: var(--text-2); font-size: 13px; }

.mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.sheet { width: 100%; max-width: 560px; background: var(--surface); border-radius: 20px 20px 0 0; padding: 22px 20px 26px; }
.sheet h3 { font-size: 17px; margin-bottom: 14px; }
.ver-list { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.ver-item { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.ver-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-2); }
.ver-no { font-weight: 600; color: var(--accent); }
.ver-preview { font-size: 13px; margin: 6px 0; color: var(--text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ver-empty { text-align: center; color: var(--text-2); padding: 20px; }
.primary { padding: 13px; border-radius: 10px; background: var(--accent); border: none; color: #fff; font-size: 15px; cursor: pointer; }
.primary.full { width: 100%; }
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}
</style>
