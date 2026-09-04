<template>
  <div class="log-screen" @keydown="onGlobalKey">
    <header class="topbar">
      <div class="left">
        <button class="back" @click="router.push('/projects')">‹</button>
        <div>
          <div class="pname">{{ project?.name || '…' }}</div>
          <div class="pdate">{{ project ? (project.type === 'school' ? '入学' : '入职') + ' ' + project.startDate : '' }}</div>
        </div>
      </div>
      <div class="right">
        <button class="icon-btn" @click="showVersions" title="版本记录">版本</button>
        <button class="save-btn" :class="{ dirty: anyDirty }" @click="saveAll" :disabled="saving">
          {{ anyDirty ? '● 保存' : '已保存' }}
        </button>
        <button class="theme-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </div>
    </header>

    <!-- 未保存提示 -->
    <transition name="fade">
      <div v-if="unsavedBanner" class="unsaved-banner">
        <span>检测到有未提交的修改</span>
        <button class="mini primary" @click="commitAll">保存为版本</button>
        <button class="mini ghost" @click="discardAll">放弃改动</button>
      </div>
    </transition>

    <main class="paper" ref="paperRef" @click="paperClick">
      <!-- 日期块 -->
      <section v-for="(day, di) in days" :key="day.date" class="day-block"
        :class="{ dim: !isToday(day.date) && !editingDay[di] }">
        <div class="day-head" @click="focusDay(di)">
          <span class="day-date">{{ fmtDate(day.date) }}</span>
          <span class="day-week">{{ day.weekday }}</span>
          <span class="day-stat" v-if="day.items.length">✓ {{ doneCount(day) }}/{{ day.items.length }}</span>
          <span class="editing-tag" v-if="editingDay[di] && !isToday(day.date)">编辑中</span>
          <span class="dirty-dot" v-if="dirtySet.has(day.date)" title="有未提交修改"></span>
        </div>

        <div class="task-list">
          <div v-for="(it, idx) in day.items" :key="it.id"
            class="task-row"
            :class="{ glow: isGlow(day, idx), done: it.done }"
            :data-date="day.date" :data-idx="idx">
            <span class="num">{{ idx + 1 }}</span>
            <input
              class="task-input"
              :value="it.text"
              placeholder="写点什么…"
              :readonly="!editingDay[di] && !isToday(day.date)"
              @input="e => onEdit(day, idx, e.target.value)"
              @focus="editingDay[di] = true"
              @keydown="e => onRowKey(e, day, idx)"
              @blur="onRowBlur"
            />
            <span v-if="it.isNew" class="new-tag">新</span>
            <button
              class="dot"
              :class="{ off: !it.done }"
              :title="it.done ? '完成' : '未完成'"
              @click.stop="toggleDone(day, idx)"
            ></button>
            <button v-if="editingDay[di] || isToday(day.date)" class="del" @click.stop="removeTask(day, idx)">×</button>
          </div>
        </div>
      </section>

      <!-- 空状态 -->
      <div v-if="!days.length && !loading" class="empty">
        <p>还没有记录</p>
        <p class="hint">点下方 ＋ 开始记录今天吧</p>
      </div>

      <!-- 底部新增行 -->
      <div class="newline" :class="{ glow: false }">
        <button class="plus" @click="addToday">＋</button>
        <span class="newline-hint">开始记录今天 · 或点上方日期编辑过往</span>
      </div>
    </main>

    <!-- 版本弹层 -->
    <div v-if="showVer" class="mask" @click.self="showVer = false">
      <div class="sheet">
        <h3>版本记录 <span v-if="verDay">· {{ verDay.date }}</span></h3>
        <div class="ver-list" v-if="versions.length">
          <div v-for="(v, i) in versions" :key="v.id || i" class="ver-item">
            <div class="ver-meta">
              <span class="ver-no">v{{ v.version }}</span>
              <span class="ver-time">{{ fmtTime(v.createdAt) }}</span>
            </div>
            <div class="ver-preview">{{ preview(v.items) }}</div>
            <button class="mini ghost" @click="rollback(v)">回退到此处</button>
          </div>
        </div>
        <div v-else class="ver-empty">暂无版本，点击"保存"创建第一个版本</div>
        <button class="primary full" @click="showVer = false">关闭</button>
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
const paperRef = ref(null)
const loading = ref(true)
const project = ref(null)
const days = ref([])
const editingDay = reactive({})
const dirtySet = reactive(new Set())
const committed = reactive(new Map()) // date -> snapshot of last commit items
const versions = ref([])
const showVer = ref(false)
const verDay = ref(null)
const saving = ref(false)
const unsavedBanner = ref(false)
const todayStr = today()

const WEEKS = ['周日','周一','周二','周三','周四','周五','周六']
const pad = n => String(n).padStart(2, '0')
function today() { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}` }
function isToday(d) { return d === todayStr }
function fmtDate(d) { if(!d) return ''; const p = d.split('-'); return `${p[0]}年${+p[1]}月${+p[2]}日` }
function weekdayOf(dateStr) { const d = new Date(dateStr + 'T00:00:00'); return WEEKS[d.getDay()] }
function fmtTime(t) { if(!t) return ''; const d = new Date(t); return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}` }
function doneCount(day) { return day.items.filter(i => i.done).length }

const anyDirty = computed(() => dirtySet.size > 0)

function snap(items) { return items.map(i => ({ text: i.text, done: !!i.done })) }
function same(a, b) { return JSON.stringify(a) === JSON.stringify(b) }

let uid = 1
function newItem(text = '') { return { id: 'x' + (uid++), text, done: false, isNew: true } }

async function load() {
  loading.value = true
  try {
    const list = await projectApi.list()
    const arr = Array.isArray(list) ? list : (list.projects || [])
    project.value = arr.find(p => p.id === pid)
    const logs = await projectApi.logs(pid, { full: 1 }) // note: query not passed; api uses /logs
    const logArr = Array.isArray(logs) ? logs : (logs.logs || [])
    days.value = logArr.map(l => ({ date: l.date, weekday: l.weekday || weekdayOf(l.date), items: l.items || [] }))
    // committed baseline = current items (draft). We detect unsaved for latest day via server hasDraft.
    days.value.forEach(d => committed.set(d.date, snap(d.items)))
    // check latest day unsaved
    if (days.value.length) {
      const latest = days.value[days.value.length - 1]
      try {
        const info = await projectApi.log(pid, latest.date)
        const data = info.dayLog ? info : {}
        const dl = info.dayLog || null
        if (dl && info.lastVersion) {
          if (JSON.stringify(dl.items) !== JSON.stringify(info.lastVersion.items)) {
            unsavedBanner.value = true
          }
        }
      } catch { /* ignore */ }
    }
    // focus latest day for editing (unless today not among them -> user clicks +)
    if (days.value.length) editingDay[days.value.length - 1] = true
  } catch { project.value = null } finally { loading.value = false }
}

// auto-save draft debounce
const draftTimers = {}
function scheduleDraft(date) {
  clearTimeout(draftTimers[date])
  draftTimers[date] = setTimeout(async () => {
    const day = days.value.find(d => d.date === date)
    if (!day) return
    const weekday = day.weekday || weekdayOf(date)
    try { await projectApi.draft(pid, date, { weekday, items: day.items }) } catch {}
  }, 800)
}

function markDirty(date) {
  dirtySet.add(date)
  unsavedBanner.value = false
}

function isGlow(day, idx) {
  const base = committed.get(day.date) || []
  if (idx >= base.length) return true
  const cur = day.items[idx]
  const prev = base[idx]
  return cur.text !== prev.text || cur.done !== prev.done
}

function onEdit(day, idx, text) {
  day.items[idx].text = text
  day.items[idx].isNew = false
  markDirty(day.date)
  scheduleDraft(day.date)
  // add trailing row when editing last & has text & ends with newline-ish: handled via Enter
}

function onRowKey(e, day, idx) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const it = day.items[idx]
    if (!it.text && !day.items[idx + 1]) { addRow(day, idx + 1); return }
    addRow(day, idx + 1)
  } else if (e.key === 'Backspace' && !day.items[idx].text && day.items.length > 1) {
    e.preventDefault()
    day.items.splice(idx, 1)
    markDirty(day.date)
    scheduleDraft(day.date)
    nextTickFocus(day, idx - 1 >= 0 ? idx - 1 : 0)
  }
}

function addRow(day, idx) {
  day.items.splice(idx, 0, newItem())
  markDirty(day.date)
  scheduleDraft(day.date)
  nextTickFocus(day, idx)
}

function addToday() {
  let day = days.value.find(d => d.date === todayStr)
  if (!day) {
    day = { date: todayStr, weekday: weekdayOf(todayStr), items: [] }
    days.value.push(day)
  }
  if (!isToday(day.date)) return
  const lastIdx = days.value.indexOf(day)
  editingDay[lastIdx] = true
  const idx = day.items.length
  day.items.push(newItem())
  markDirty(day.date)
  scheduleDraft(day.date)
  nextTickFocus(day, idx)
}

function toggleDone(day, idx) {
  day.items[idx].done = !day.items[idx].done
  day.items[idx].isNew = false
  markDirty(day.date)
  scheduleDraft(day.date)
}

function removeTask(day, idx) {
  day.items.splice(idx, 1)
  markDirty(day.date)
  scheduleDraft(day.date)
}

function focusDay(di) {
  const day = days.value[di]
  if (isToday(day.date)) return
  // allow editing older day
  editingDay[di] = true
  const input = paperRef.value?.querySelector(`[data-date="${day.date}"] .task-input`)
  input?.focus()
}

function onRowBlur() { /* keep state; saving auto */ }

function onGlobalKey() {}

function paperClick(e) {
  // clicking anywhere ensures at least one editable area; no-op mostly
}

function nextTickFocus(day, idx) {
  requestAnimationFrame(() => {
    const el = paperRef.value?.querySelector(`[data-date="${day.date}"] .task-input:nth-of-type(${idx + 1})`)
    // rows are div.task-row; query by index among .task-input
    const rows = paperRef.value?.querySelectorAll(`[data-date="${day.date}"] .task-input`)
    rows?.[idx]?.focus()
  })
}

// ---- save (commit) ----
async function commitDay(date) {
  const day = days.value.find(d => d.date === date)
  if (!day) return
  const weekday = day.weekday || weekdayOf(date)
  try {
    await projectApi.commit(pid, date, { weekday, items: day.items })
    committed.set(date, snap(day.items))
    dirtySet.delete(date)
  } catch (e) { alert(e?.error || '保存失败') }
}

async function saveAll() {
  if (!anyDirty.value) return
  saving.value = true
  const dates = [...dirtySet]
  for (const d of dates) await commitDay(d)
  saving.value = false
  if (unsavedBanner.value) unsavedBanner.value = false
}

async function commitAll() {
  unsavedBanner.value = false
  await saveAll()
}

async function discardAll() {
  unsavedBanner.value = false
  const latest = days.value[days.value.length - 1]
  if (!latest) return
  try {
    const info = await projectApi.log(pid, latest.date)
    if (info.lastVersion) {
      latest.items = info.lastVersion.items.map(i => ({ ...i, isNew: false }))
    } else {
      latest.items = []
    }
    committed.set(latest.date, snap(latest.items))
    dirtySet.delete(latest.date)
  } catch {}
}

// ---- versions & rollback ----
async function showVersions() {
  showVer.value = true
  const latest = days.value[days.value.length - 1]
  verDay.value = latest
  if (!latest) { versions.value = []; return }
  try { versions.value = await projectApi.versions(pid, latest.date) } catch { versions.value = [] }
}

async function rollback(v) {
  const d = verDay.value
  if (!d) return
  try {
    await projectApi.rollback(pid, d.date, v.id || v.version)
    d.items = v.items.map(i => ({ ...i, isNew: false }))
    committed.set(d.date, snap(v.items))
    dirtySet.delete(d.date)
    showVer.value = false
  } catch (e) { alert(e?.error || '回退失败') }
}

function preview(items) {
  const arr = Array.isArray(items) ? items : []
  return arr.slice(0, 3).map(i => (i.done ? '✓ ' : '· ') + i.text).join('　') + (arr.length > 3 ? '…' : '')
}

// keep auto-commit for today's cleanliness optional; skip for v1

onMounted(() => {
  if (!user.isLoggedIn) { router.push('/'); return }
  load()
})
onBeforeUnmount(() => { Object.values(draftTimers).forEach(t => clearTimeout(t)) })
</script>

<style scoped>
.log-screen { min-height: 100vh; display: flex; flex-direction: column; }
.topbar { max-width: 720px; width: 100%; margin: 0 auto; padding: 18px 20px 12px; display: flex; justify-content: space-between; align-items: center; }
.left { display: flex; align-items: center; gap: 12px; }
.back { width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 20px; cursor: pointer; }
.pname { font-size: 18px; font-weight: 700; }
.pdate { font-size: 12px; color: var(--text-2); margin-top: 2px; }
.right { display: flex; align-items: center; gap: 8px; }
.icon-btn { padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.theme-btn { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); cursor: pointer; }
.save-btn { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; transition: all .2s; }
.save-btn.dirty { background: var(--accent); border-color: var(--accent); color: #fff; }
.unsaved-banner { position: sticky; top: 0; z-index: 50; max-width: 720px; margin: 0 auto; width: calc(100% - 40px); display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--glow-border); border-radius: 12px; padding: 12px 16px; box-shadow: var(--shadow); font-size: 14px; }
.unsaved-banner span { flex: 1; color: var(--glow-border); font-weight: 600; }
.mini { padding: 6px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; }
.mini.primary { background: var(--accent); color: #fff; border: none; }
.mini.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }

.paper { max-width: 720px; width: 100%; margin: 0 auto; padding: 10px 20px 80px; }
.day-block { margin-bottom: 8px; }
.day-block.dim { opacity: .45; }
.day-block.dim:hover { opacity: 1; }
.day-head { display: flex; align-items: center; gap: 10px; padding: 18px 0 8px; cursor: pointer; user-select: none; position: sticky; }
.day-date { font-size: 19px; font-weight: 700; }
.day-week { font-size: 13px; color: var(--text-2); }
.day-stat { margin-left: auto; font-size: 13px; color: var(--text-2); }
.editing-tag { font-size: 11px; background: var(--surface-2); padding: 2px 8px; border-radius: 10px; color: var(--text-2); }
.dirty-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--glow-border); }

.task-row { display: flex; align-items: center; gap: 10px; padding: 6px 10px; border-radius: 8px; transition: background .15s; }
.task-row:hover { background: var(--surface-2); }
.task-row.glow { background: var(--glow); }
.task-row.done { opacity: .6; }
.task-row.done .task-input { text-decoration: line-through; color: var(--text-2); }
.num { width: 24px; text-align: right; font-size: 14px; color: var(--text-2); font-variant-numeric: tabular-nums; flex-shrink: 0; }
.task-input { flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: var(--text); font-size: 16px; line-height: 1.6; padding: 4px 0; }
.new-tag { font-size: 10px; background: var(--glow-border); color: #fff; padding: 1px 6px; border-radius: 6px; flex-shrink: 0; }
.dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--green); cursor: pointer; flex-shrink: 0; transition: all .2s; background: transparent; }
.dot.off { border-color: var(--red); }
.dot.off::after { content: ''; display: block; width: 8px; height: 8px; border-radius: 50%; margin: 3px auto 0; background: var(--red); }
.dot:not(.off) { background: var(--green); }
.del { border: none; background: transparent; color: var(--text-2); font-size: 16px; cursor: pointer; opacity: 0; transition: opacity .2s; flex-shrink: 0; }
.task-row:hover .del { opacity: 1; }

.empty { text-align: center; color: var(--text-2); padding: 60px 0 20px; }
.hint { font-size: 13px; margin-top: 6px; }

.newline { margin-top: 10px; padding: 14px 0; display: flex; align-items: center; gap: 12px; border-top: 1px dashed var(--border); }
.plus { width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--accent); color: #fff; font-size: 18px; cursor: pointer; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,122,255,.3); }
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
</style>
