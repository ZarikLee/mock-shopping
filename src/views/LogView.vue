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
        <span class="ver-pill" title="build v3-txt">v3</span>
        <button class="icon-btn" @click="openVersions">版本</button>
        <button class="save-btn" :class="{ dirty: hasDirty }" :disabled="saving" @click="saveAll">
          {{ hasDirty ? '保存修改' : '已保存' }}
        </button>
        <button class="theme-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </div>
    </header>

    <div v-if="loadError" class="err-banner">加载出错：{{ loadError }}</div>
    <transition name="fade">
      <div v-if="unsavedBanner" class="unsaved-banner">
        <span>有未提交的修改</span>
        <button class="mini primary" @click="saveAll">保存为版本</button>
        <button class="mini ghost" @click="discardAll">放弃</button>
      </div>
    </transition>

    <main class="paper" ref="paperEl" @click="focusNew">
      <template v-for="day in days" :key="day.date">
        <div class="day-head" :class="{ dim: !day._edit && !isToday(day.date) }">
          <span class="day-date">{{ dayLabel(day.date) }}</span>
          <span class="day-week">{{ day.weekday }}</span>
          <span class="day-stat" v-if="day.items.length">{{ doneOf(day) }}/{{ day.items.length }}</span>
          <span class="dirty-dot" v-if="day._dirty" title="有未提交修改"></span>
        </div>

        <div class="day-body">
          <div v-for="(it, idx) in day.items" :key="it.id"
            class="task-line" :class="{ glow: isGlow(day, idx), done: it.done }"
            :data-date="day.date">
            <span class="num">{{ idx + 1 }}</span>
            <div class="txt" contenteditable="true"
              @input="e => edit(day, idx, e.target.textContent)"
              @focus="day._edit = true"
              @keydown="e => rowKey(e, day, idx)"
              spellcheck="false"></div>
            <button class="dot" :class="{ off: !it.done }" @click="toggle(day, idx)"></button>
          </div>
        </div>
      </template>

      <div v-if="!loading && !days.length" class="empty">点下面 ＋ 开始记录今天</div>

      <div class="newline">
        <button class="plus" @click="startToday">＋</button>
        <span>开始记录今天</span>
      </div>
    </main>

    <div v-if="showVersions" class="mask" @click.self="showVersions = false">
      <div class="sheet">
        <h3>版本记录</h3>
        <div class="ver-list" v-if="versions.length">
          <div v-for="(v, i) in versions" :key="i" class="ver-item">
            <div class="ver-meta"><span class="ver-no">v{{ v.version }}</span><span class="ver-time">{{ fmtTime(v.createdAt) }}</span></div>
            <div class="ver-preview">{{ preview(v.items) }}</div>
            <button class="mini ghost" @click="rollback(v)">回退到此处</button>
          </div>
        </div>
        <div v-else class="ver-empty">暂无版本，点"保存修改"创建第一个版本</div>
        <button class="primary full" @click="showVersions = false">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
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
const timers = {}

const WEEKS = ['周日','周一','周二','周三','周四','周五','周六']
const pad = n => String(n).padStart(2, '0')
const nowD = new Date()
const tNow = `${nowD.getFullYear()}-${pad(nowD.getMonth()+1)}-${pad(nowD.getDate())}`
const isToday = d => d === tNow
const dayLabel = d => { const p = d.split('-'); return `${p[0]}年${+p[1]}月${+p[2]}日` }
const wk = d => WEEKS[new Date(d + 'T00:00:00').getDay()]
const fmtTime = t => { if (!t) return ''; const d = new Date(t); return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` }
const doneOf = day => day.items.filter(i => i.done).length
const hasDirty = computed(() => days.value.some(d => d._dirty))

let uid = 1
const make = () => ({ id: 'n' + (uid++), text: '', done: false })
const findDay = date => days.value.find(d => d.date === date)
const snap = items => JSON.stringify(items.map(i => [i.text, i.done]))
const norm = l => ({ date: l.date, weekday: l.weekday || wk(l.date), items: (l.items || []).map(i => ({ id: i.id != null ? i.id : 's' + (uid++), text: i.text || '', done: !!i.done })), _base: null, _dirty: false, _edit: false })
function setBase(day) { day._base = snap(day.items); day._dirty = false }

function isGlow(day, idx) {
  if (!day._base) return true
  let arr = []
  try { arr = JSON.parse(day._base) } catch {}
  const it = day.items[idx]
  if (idx >= arr.length) return true
  return it.text !== arr[idx][0] || it.done !== arr[idx][1]
}

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
    days.value = logArr.map(norm)
    days.value.forEach(setBase)
    if (days.value.length) {
      days.value[days.value.length - 1]._edit = true
      const last = days.value[days.value.length - 1]
      try {
        const info = await projectApi.log(pid, last.date)
        if (info.dayLog && info.lastVersion && snap(info.dayLog.items) !== snap(info.lastVersion.items)) unsavedBanner.value = true
      } catch {}
    }
  } catch (e) {
    loadError.value = e?.error || '加载失败'
  } finally { loading.value = false; seedAll() }
}

function bump(day) {
  day._dirty = true
  unsavedBanner.value = false
  clearTimeout(timers[day.date])
  timers[day.date] = setTimeout(() => saveDraft(day), 700)
}
function edit(day, idx, text) {
  if (!day.items[idx]) return
  day.items[idx].text = text.replace(/\n+$/g, '')
  bump(day)
}
function toggle(day, idx) {
  day.items[idx].done = !day.items[idx].done
  bump(day)
}
function rowKey(e, day, idx) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const sel = window.getSelection()
    const node = sel && sel.anchorNode ? sel.anchorNode.parentElement : null
    day.items.splice(idx + 1, 0, make())
    bump(day)
    requestAnimationFrame(() => focusAt(day, idx + 1, 0))
    if (node) node.textContent = day.items[idx].text
  } else if (e.key === 'Backspace' && !day.items[idx].text && day.items.length > 1) {
    e.preventDefault()
    day.items.splice(idx, 1)
    bump(day)
    requestAnimationFrame(() => focusAt(day, Math.max(0, idx - 1), 999))
  }
}
function focusAt(day, idx, end) {
  requestAnimationFrame(() => {
    const rows = paperEl.value?.querySelectorAll(`[data-date="${day.date}"] .txt`)
    const el = rows && rows[idx]
    if (!el) return
    el.focus()
    const sel = window.getSelection()
    const range = document.createRange()
    try {
      range.selectNodeContents(el)
      range.collapse(end === 0)
      sel.removeAllRanges()
      sel.addRange(range)
    } catch {}
  })
}
function focusNew() {}

// 回填已存文本到 contenteditable 行（避免光标时覆盖）
function seedAll() {
  requestAnimationFrame(() => {
    days.value.forEach(day => {
      const els = paperEl.value?.querySelectorAll(`[data-date="${day.date}"] .txt`)
      day.items.forEach((it, i) => {
        const el = els && els[i]
        if (el && el.textContent !== (it.text || '')) el.textContent = it.text || ''
      })
    })
  })
}

function startToday() {
  let day = findDay(tNow)
  if (!day) {
    day = norm({ date: tNow, weekday: wk(tNow), items: [] })
    days.value.push(day)
  }
  day._edit = true
  day.items.push(make())
  bump(day)
  requestAnimationFrame(() => focusAt(day, day.items.length - 1, 0))
}

async function saveDraft(day) {
  try { await projectApi.draft(pid, day.date, { weekday: day.weekday, items: day.items }) } catch {}
}
async function saveAll() {
  saving.value = true
  for (const day of days.value) {
    if (!day._dirty) continue
    try {
      await projectApi.commit(pid, day.date, { weekday: day.weekday, items: day.items })
      setBase(day)
    } catch (e) { loadError.value = e?.error || '保存失败' }
  }
  unsavedBanner.value = false
  saving.value = false
}
async function discardAll() {
  unsavedBanner.value = false
  for (const day of days.value) {
    if (!day._dirty) continue
    let arr = []
    try { arr = JSON.parse(day._base || '[]').map(x => ({ text: x[0], done: x[1] })) } catch {}
    day.items = arr.length ? arr.map(x => ({ id: 's' + (uid++), text: x.text, done: x.done })) : []
    day._dirty = false
    await saveDraft(day)
  }
}
async function openVersions() {
  const day = days.value[days.value.length - 1]
  if (!day) return
  showVersions.value = true
  try { versions.value = await projectApi.versions(pid, day.date) } catch { versions.value = [] }
}
async function rollback(v) {
  const day = days.value[days.value.length - 1]
  if (!day) return
  try {
    await projectApi.rollback(pid, day.date, v.id != null ? v.id : v.version)
    day.items = (v.items || []).map(x => ({ id: 's' + (uid++), text: x.text || '', done: !!x.done }))
    setBase(day)
    showVersions.value = false
  } catch (e) { loadError.value = e?.error || '回退失败' }
}
const preview = items => (items || []).slice(0, 3).map(i => (i.done ? '✓ ' : '· ') + (i.text || '')).join('　') + ((items || []).length > 3 ? '…' : '')

onMounted(() => {
  if (!user.isLoggedIn) { router.push('/'); return }
  load()
})
onBeforeUnmount(() => { Object.values(timers).forEach(t => clearTimeout(t)) })
</script>

<style scoped>
.log-screen { min-height: 100vh; }
/* 桌面加宽自适应 */
.paper, .topbar { width: 100%; max-width: 1000px; margin-left: auto; margin-right: auto; }
.topbar { position: sticky; top: 0; z-index: 40; background: var(--bg); backdrop-filter: blur(14px); padding: 14px 22px 10px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); }
.left { display: flex; align-items: center; gap: 12px; }
.back { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 20px; cursor: pointer; flex-shrink: 0; }
.pname { font-size: 17px; font-weight: 700; }
.pdate { font-size: 11px; color: var(--text-2); margin-top: 2px; }
.right { display: flex; align-items: center; gap: 8px; }
.icon-btn { padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.ver-pill { font-size: 11px; color: var(--accent); background: var(--surface); border: 1px solid var(--border); padding: 3px 8px; border-radius: 8px; }
.theme-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
.save-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.save-btn.dirty { background: var(--accent); border-color: var(--accent); color: #fff; }
.err-banner { max-width: 1000px; margin: 12px auto 0; background: var(--red); color: #fff; padding: 10px 16px; border-radius: 10px; font-size: 13px; }
.unsaved-banner { max-width: 960px; margin: 8px auto 0; width: calc(100% - 44px); display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--glow-border); border-radius: 12px; padding: 10px 14px; box-shadow: var(--shadow); font-size: 14px; }
.unsaved-banner span { flex: 1; color: var(--glow-border); font-weight: 600; }
.mini { padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; }
.mini.primary { background: var(--accent); color: #fff; border: none; }
.mini.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }

.paper { padding: 6px 26px 100px; min-height: 80vh; }
.day-head { display: flex; align-items: center; gap: 10px; padding: 26px 0 4px; user-select: none; }
.day-head.dim { opacity: .5; }
.day-date { font-size: 17px; font-weight: 700; }
.day-week { font-size: 13px; color: var(--text-2); }
.day-stat { margin-left: auto; font-size: 13px; color: var(--text-2); }
.dirty-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--glow-border); }

.day-body { padding-left: 10px; }
.task-line { position: relative; display: flex; align-items: flex-start; gap: 12px; padding: 3px 0; border-radius: 6px; transition: background .15s; }
.task-line.glow { background: var(--glow); }
.num { width: 24px; text-align: right; font-size: 15px; color: var(--text-2); padding-top: 7px; font-variant-numeric: tabular-nums; flex-shrink: 0; line-height: 1.6; }
.txt { flex: 1; min-height: 30px; outline: none; font-size: 16px; line-height: 1.6; padding: 6px 0; color: var(--text); word-break: break-word; cursor: text; }
.task-line.done .txt { text-decoration: line-through; color: var(--text-2); opacity: .7; }
.task-line .txt:empty::before { content: '写点什么…'; color: var(--text-2); opacity: .5; pointer-events: none; }
.dot { margin-top: 8px; width: 16px; height: 16px; border-radius: 50%; border: 2px solid var(--red); cursor: pointer; flex-shrink: 0; background: transparent; }
.dot:not(.off) { border-color: var(--green); background: var(--green); }
.task-line:hover { background: var(--surface-2); }
.task-line.glow:hover { background: var(--glow); }

.empty { text-align: center; color: var(--text-2); padding: 80px 0 20px; }
.newline { margin-top: 18px; padding: 16px 0 16px 34px; display: flex; align-items: center; gap: 10px; color: var(--text-2); font-size: 14px; }
.plus { width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--accent); color: #fff; font-size: 18px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,122,255,.3); }

.mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.sheet { width: 100%; max-width: 560px; background: var(--surface); border-radius: 20px 20px 0 0; padding: 22px 20px 26px; }
.sheet h3 { font-size: 17px; margin-bottom: 14px; }
.ver-list { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.ver-item { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.ver-meta { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-2); }
.ver-no { font-weight: 600; color: var(--accent); }
.ver-preview { font-size: 13px; margin: 6px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ver-empty { text-align: center; color: var(--text-2); padding: 20px; }
.primary { padding: 13px; border-radius: 10px; background: var(--accent); border: none; color: #fff; font-size: 15px; cursor: pointer; }
.primary.full { width: 100%; }
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}

@media (max-width: 600px) {
  .paper, .topbar { width: 100%; }
  .paper { padding: 4px 18px 90px; }
  .save-btn { padding: 7px 10px; }
  .icon-btn { padding: 7px 10px; }
}
</style>
