<template>
  <div class="editor">
    <!-- 顶部条 -->
    <div class="top">
      <div class="t-name"><button class="back-m" @click="router.push('/projects')">‹</button> {{ projectName }} <span class="t-sub">{{ projectSub }}</span></div>
      <div class="t-actions">
        <button class="tb" @click="openVersions">版本</button>
        <button class="tb save" :class="{ on: hasDirty }" @click="saveAll">{{ hasDirty ? '保存修改' : '已保存' }}</button>
      </div>
    </div>

    <div v-if="loadError" class="err">{{ loadError }}</div>

    <!-- 大片文本编辑区 -->
    <div class="canvas" ref="paperEl">
      <template v-for="day in days" :key="day.date">
        <div class="dhead" :class="{ dim: !day._edit && !isToday(day.date) }">
          {{ dayLabel(day.date) }} <em>{{ day.weekday }}</em>
          <i v-if="day.items.length">· {{ doneOf(day) }}/{{ day.items.length }}</i>
          <span class="ddot" v-if="day._dirty"></span>
        </div>

        <div v-for="(it, idx) in day.items" :key="it.id" class="line"
          :class="{ glow: isGlow(day, idx), done: it.done }" :data-date="day.date">
          <span class="no">{{ idx + 1 }}</span>
          <span class="editable" contenteditable="true" spellcheck="false"
            @input="e => edit(day, idx, e.target.textContent)"
            @focus="day._edit = true"
            @keydown="e => rowKey(e, day, idx)"></span>
          <button class="st" :class="{ off: !it.done }" @click="toggle(day, idx)"></button>
        </div>
      </template>

      <div v-if="!loading && !days.length" class="placeholder">
        这里整片空白——点右下角 ＋ 或直接开始打字
      </div>

      <div class="eof">
        <button class="plus" @click="startToday">＋</button>
      </div>
    </div>

    <!-- 未提交：居中弹层 -->
    <div v-if="unsavedPrompt" class="center-mask">
      <div class="center-box">
        <h3>有未提交的修改</h3>
        <p>是否把当前改动保存为一个版本？</p>
        <div class="row">
          <button class="primary" @click="commitFromPrompt">保存为版本</button>
          <button class="ghost" @click="discardAll">放弃改动</button>
        </div>
      </div>
    </div>

    <!-- 版本列表弹层 -->
    <div v-if="showVersions" class="mask" @click.self="showVersions = false">
      <div class="vs">
        <h3>版本记录</h3>
        <div class="vl" v-if="versions.length">
          <div v-for="(v, i) in versions" :key="i" class="vi">
            <div class="vm"><span class="vn">v{{ v.version }}</span><span>{{ fmtTime(v.createdAt) }}</span></div>
            <div class="vp">{{ preview(v.items) }}</div>
            <button class="ghost" @click="rollback(v)">回退到此处</button>
          </div>
        </div>
        <div v-else class="ve">暂无版本</div>
        <button class="primary full" @click="showVersions = false">关闭</button>
      </div>
    </div>

    <!-- 轻提示 -->
    <transition name="fade">
      <div v-if="toast" class="toast">{{ toast }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { projectApi } from '../api/projects'

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const pid = ref(Number(route.params.projectId))
const paperEl = ref(null)
const loading = ref(true)
const loadError = ref('')
const projectName = ref('…')
const projectSub = ref('')
const days = ref([])
const saving = ref(false)
const unsavedPrompt = ref(false)
const versions = ref([])
const showVersions = ref(false)
const toast = ref('')
let toastTimer = null
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
function showToast(msg) { toast.value = msg; clearTimeout(toastTimer); toastTimer = setTimeout(() => (toast.value = ''), 1800) }

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const list = await projectApi.list()
    const arr = Array.isArray(list) ? list : (list.projects || [])
    const p = arr.find(x => x.id === pid.value)
    projectName.value = p?.name || '项目'
    projectSub.value = p ? (p.type === 'school' ? '入学' : '入职') + ' ' + p.startDate : ''
    const logs = await projectApi.logs(pid.value, { full: 1 })
    const logArr = Array.isArray(logs) ? logs : (logs.logs || [])
    days.value = logArr.map(norm)
    days.value.forEach(setBase)
    if (days.value.length) {
      days.value[days.value.length - 1]._edit = true
      const last = days.value[days.value.length - 1]
      try {
        const info = await projectApi.log(pid.value, last.date)
        if (info.dayLog && info.lastVersion && snap(info.dayLog.items) !== snap(info.lastVersion.items)) unsavedPrompt.value = true
      } catch {}
    }
  } catch (e) {
    loadError.value = e?.error || '加载失败'
  } finally { loading.value = false; seedAll() }
}
function seedAll() {
  requestAnimationFrame(() => {
    days.value.forEach(day => {
      const els = paperEl.value?.querySelectorAll(`[data-date="${day.date}"] .editable`)
      day.items.forEach((it, i) => { const el = els && els[i]; if (el && el.textContent !== (it.text || '')) el.textContent = it.text || '' })
    })
  })
}
function bump(day) { day._dirty = true; clearTimeout(timers[day.date]); timers[day.date] = setTimeout(() => saveDraft(day), 700) }
function edit(day, idx, text) { if (!day.items[idx]) return; day.items[idx].text = text.replace(/\n+$/g, ''); bump(day) }
function toggle(day, idx) { day.items[idx].done = !day.items[idx].done; bump(day) }
function rowKey(e, day, idx) {
  if (e.key === 'Enter') {
    e.preventDefault()
    const node = e.target
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
    const rows = paperEl.value?.querySelectorAll(`[data-date="${day.date}"] .editable`)
    const el = rows && rows[idx]
    if (!el) return
    el.focus()
    const sel = window.getSelection(); const range = document.createRange()
    try { range.selectNodeContents(el); range.collapse(end === 0); sel.removeAllRanges(); sel.addRange(range) } catch {}
  })
}
function startToday() {
  let day = findDay(tNow)
  if (!day) { day = norm({ date: tNow, weekday: wk(tNow), items: [] }); days.value.push(day) }
  day._edit = true
  day.items.push(make())
  bump(day)
  requestAnimationFrame(() => focusAt(day, day.items.length - 1, 0))
}
async function saveDraft(day) { try { await projectApi.draft(pid.value, day.date, { weekday: day.weekday, items: day.items }) } catch {} }
async function saveAll() {
  saving.value = true
  for (const day of days.value) {
    if (!day._dirty) continue
    try { await projectApi.commit(pid.value, day.date, { weekday: day.weekday, items: day.items }); setBase(day) }
    catch (e) { loadError.value = e?.error || '保存失败' }
  }
  unsavedPrompt.value = false
  saving.value = false
  showToast('已保存')
}
function commitFromPrompt() { saveAll() }
async function discardAll() {
  unsavedPrompt.value = false
  for (const day of days.value) {
    if (!day._dirty) continue
    let arr = []
    try { arr = JSON.parse(day._base || '[]').map(x => ({ text: x[0], done: x[1] })) } catch {}
    day.items = arr.length ? arr.map(x => ({ id: 's' + (uid++), text: x.text, done: x.done })) : []
    day._dirty = false
    await saveDraft(day)
  }
  showToast('已放弃修改')
}
async function openVersions() {
  const day = days.value[days.value.length - 1]
  if (!day) return
  showVersions.value = true
  try { versions.value = await projectApi.versions(pid.value, day.date) } catch { versions.value = [] }
}
async function rollback(v) {
  const day = days.value[days.value.length - 1]
  if (!day) return
  try {
    await projectApi.rollback(pid.value, day.date, v.id != null ? v.id : v.version)
    day.items = (v.items || []).map(x => ({ id: 's' + (uid++), text: x.text || '', done: !!x.done }))
    setBase(day)
    showVersions.value = false
    showToast('已回退到 v' + v.version)
  } catch (e) { loadError.value = e?.error || '回退失败' }
}
const preview = items => (items || []).slice(0, 3).map(i => (i.done ? '✓ ' : '· ') + (i.text || '')).join('　') + ((items || []).length > 3 ? '…' : '')

onMounted(() => { if (!user.isLoggedIn) { router.push('/login'); return } load() })
watch(() => route.params.projectId, () => { if (!user.isLoggedIn) return; pid.value = Number(route.params.projectId); days.value = []; load() })
onBeforeUnmount(() => { Object.values(timers).forEach(t => clearTimeout(t)); clearTimeout(toastTimer) })
</script>

<style scoped>
.editor { height: 100%; display: flex; flex-direction: column; }
.top { display: flex; align-items: center; justify-content: space-between; padding: 12px 22px; border-bottom: 1px solid var(--border); background: var(--bg); }
.t-name { font-size: 17px; font-weight: 700; }
.t-sub { font-size: 12px; color: var(--text-2); font-weight: 400; margin-left: 8px; }
.t-actions { display: flex; gap: 8px; }
.tb { padding: 6px 12px; border-radius: 7px; border: 1px solid var(--border); background: var(--surface); color: var(--text-2); font-size: 13px; cursor: pointer; }
.tb.save.on { background: var(--accent); border-color: var(--accent); color: #fff; }
.err { padding: 8px 22px; color: var(--red); font-size: 13px; }

/* 整片编辑区：占满剩余，接近全宽 */
.canvas { flex: 1; overflow-y: auto; padding: 26px clamp(20px, 6vw, 90px) 120px; outline: none; }
.dhead { padding: 26px 0 4px; font-size: 16px; font-weight: 700; color: var(--text); }
.dhead em { font-style: normal; color: var(--text-2); font-size: 13px; font-weight: 400; }
.dhead i { color: var(--text-2); font-size: 13px; font-style: normal; }
.dhead.dim { opacity: .45; }
.ddot { display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--glow-border); margin-left: 8px; }

/* 行 = 普通文本行，无框无边，铺满整行 */
.line { display: flex; align-items: flex-start; border-radius: 4px; margin: 0 -6px; }
.line.glow { background: var(--glow); }
.no { width: 30px; text-align: right; padding: 7px 10px 0 0; color: var(--text-2); font-size: 15px; font-variant-numeric: tabular-nums; flex-shrink: 0; user-select: none; line-height: 1.7; }
.editable { flex: 1; min-width: 0; min-height: 32px; padding: 7px 8px; outline: none; font-size: 17px; line-height: 1.7; color: var(--text); cursor: text; }
.line.done .editable { text-decoration: line-through; color: var(--text-2); opacity: .7; }
.editable:empty::before { content: '写下…'; color: var(--text-2); opacity: .4; }
.st { margin: 10px 8px 0 0; width: 15px; height: 15px; border-radius: 50%; border: 2px solid var(--red); background: transparent; cursor: pointer; flex-shrink: 0; opacity: .55; }
.st:not(.off) { border-color: var(--green); background: var(--green); }
.line:hover .st { opacity: 1; }

.placeholder { color: var(--text-2); padding: 40px 10px; font-size: 15px; }
.eof { padding: 30px 0; display: flex; justify-content: center; }
.plus { width: 40px; height: 40px; border-radius: 50%; border: none; background: var(--accent); color: #fff; font-size: 22px; cursor: pointer; box-shadow: 0 4px 14px rgba(0,122,255,.35); }

.mask, .center-mask { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; z-index: 90; }
.mask { background: rgba(0,0,0,.35); align-items: flex-end; }
.center-mask { background: rgba(0,0,0,.25); }
.center-box { width: 320px; background: var(--surface); border-radius: 16px; padding: 22px; text-align: center; box-shadow: var(--shadow); }
.center-box h3 { margin-bottom: 6px; }
.center-box p { color: var(--text-2); font-size: 13px; margin-bottom: 14px; }
.center-box .row { display: flex; gap: 10px; }
.center-box .row button { flex: 1; padding: 10px; border-radius: 10px; font-size: 14px; cursor: pointer; }
.vs { width: 100%; max-width: 560px; background: var(--surface); border-radius: 20px 20px 0 0; padding: 22px 20px 26px; }
.vs h3 { margin-bottom: 14px; }
.vl { max-height: 50vh; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin-bottom: 14px; }
.vi { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; }
.vm { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-2); }
.vn { color: var(--accent); font-weight: 600; }
.vp { font-size: 13px; margin: 6px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ve { text-align: center; color: var(--text-2); padding: 20px; }
.primary { background: var(--accent); color: #fff; border: none; }
.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
.primary.full { width: 100%; padding: 13px; border-radius: 10px; font-size: 15px; cursor: pointer; margin-top: 4px; }

.toast { position: fixed; left: 50%; bottom: 40px; transform: translateX(-50%); background: var(--text); color: var(--bg); padding: 10px 20px; border-radius: 20px; font-size: 14px; box-shadow: var(--shadow); z-index: 120; }
.fade-enter-active,.fade-leave-active{transition:opacity .2s}
.fade-enter-from,.fade-leave-to{opacity:0}

.back-m { display: none; }
@media (max-width: 768px) {
  .back-m { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border: 1px solid var(--border); background: var(--surface); border-radius: 50%; font-size: 18px; cursor: pointer; color: var(--text); margin-right: 8px; }
  .top { padding: 10px 14px; }
  .canvas { padding: 16px 14px 90px; }
  .no { width: 24px; }
}
</style>
