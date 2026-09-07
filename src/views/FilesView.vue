<template>
  <div class="files-page">
    <div class="fp-head">
      <div>
        <h1>云文件管理</h1>
        <p class="fp-sub">按日期查看该项目所有图片与附件（图片可直接预览）</p>
      </div>
      <span class="fp-count">共 {{ totalImg }} 图 · {{ totalFile }} 文件</span>
    </div>
    <div class="quota">
      <span class="q-lbl">云盘用量</span>
      <div class="q-bar"><i :style="{ width: quotaPct + '%' }"></i></div>
      <span class="q-num">{{ fmtMB(used) }} / {{ fmtMB(limit) }} MB</span>
      <button class="q-buy" @click="convOpen = true">积分扩容量</button>
    </div>
    <p class="quota-hint">基础 100MB；用积分永久扩容：1 积分 = +20MB，当前可用 {{ points }} 积分。</p>

    <div v-if="loading" class="fp-load"><span class="spin"></span><p>{{ spinTxt }}</p></div>
    <div v-else-if="!rows.length" class="empty">这个项目还没有图片或附件</div>

    <div v-else class="fp-list">
      <section v-for="r in rows" :key="r.date" class="fp-day">
        <div class="fp-date">{{ dayLabel(r.date) }} <em>{{ r.weekday }}</em>
          <span class="fp-n" v-if="r.images.length || r.files.length">{{ r.images.length }} 图 / {{ r.files.length }} 文件</span>
        </div>
        <div v-if="r.images.length" class="fp-imgs">
          <span v-for="(u, i) in r.images" :key="'i' + i" class="thumb" @click="open(u, 'image', '图片' + (i + 1))">
            <img :src="u" alt="" />
          </span>
        </div>
        <div v-if="r.files.length" class="fp-files">
          <button v-for="(f, i) in r.files" :key="'f' + i" class="fp-chip" @click="open(f.url, f.type, f.name)">
            <svg viewBox="0 0 24 24" width="13" height="13"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>
            <span class="fc-name">{{ f.name }}</span>
          </button>
        </div>
      </section>
    </div>

    <!-- 积分转容量 -->
    <transition name="fade">
      <div v-if="convOpen" class="conv-mask" @click.self="convOpen = false">
        <div class="conv-card">
          <h3>积分扩容云盘</h3>
          <p class="conv-tip">当前积分：{{ points }}　比例：1 积分 = +20MB（永久）</p>
          <div class="conv-presets">
            <button v-for="p in [5, 10, 20, 50]" :key="p" :class="{ on: convPoints === p }" @click="convPoints = p">{{ p }} 积分 → +{{ p * 20 }}MB</button>
          </div>
          <button class="conv-do" :disabled="convBusy || convPoints < 1 || convPoints > points" @click="doConvert">确认扩容</button>
          <button class="conv-cancel" @click="convOpen = false">取消</button>
        </div>
      </div>
    </transition>

    <!-- 预览 -->
    <transition name="fade">
      <div v-if="pv.open" class="pv-mask" @click.self="close">
        <div class="pv-card">
          <div class="pv-head"><b>{{ pv.name }}</b><button class="pv-x" @click="close">×</button></div>
          <div class="pv-body">
            <img v-if="pv.kind === 'image'" :src="pv.url" alt="" />
            <video v-else-if="pv.kind === 'video'" :src="pv.url" controls></video>
            <audio v-else-if="pv.kind === 'audio'" :src="pv.url" controls></audio>
            <pre v-else-if="pv.kind === 'text'" class="pv-text">{{ pv.text }}</pre>
            <div v-else class="pv-fallback"><p>该类型暂不支持在线预览</p><a class="pv-dl big" :href="pv.url" :download="pv.name">下载查看</a></div>
          </div>
          <div class="pv-foot"><a class="pv-dl" :href="pv.url" :download="pv.name || 'download'">下载原文件</a></div>
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
import { authApi } from '../api/auth'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const pid = ref(Number(route.params.projectId))
const rows = ref([])
const loading = ref(true)
const spinTxt = ref('正在翻看你的云盘…')
const spinMsgs = ['正在翻看你的云盘…', '一张张帮你排好队…', '数一数今天的图片…', '马上就好，别着急哦 ✨']
let spinTimer = null
const totalImg = ref(0)
const totalFile = ref(0)
const used = ref(0)
const limit = ref(100 * 1024 * 1024)
const bonus = ref(0)
const points = ref(0)
const convOpen = ref(false)
const convPoints = ref(10)
const quotaPct = computed(() => limit.value ? Math.min(100, Math.round(used.value / limit.value * 100)) : 0)
const fmtMB = b => (b / (1024 * 1024)).toFixed(1)
const WEEKS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const wk = d => WEEKS[new Date(d + 'T00:00:00').getDay()]
const pad = n => String(n).padStart(2, '0')
const dayLabel = d => { const p = d.split('-'); return `${p[0]}年${+p[1]}月${+p[2]}日` }

const convBusy = ref(false)
const doConvert = async () => { if (!convPoints.value || convPoints.value < 1 || convPoints.value > points.value) return; convBusy.value = true; try { await authApi.convertStorage({ points: convPoints.value }); convOpen.value = false; await loadStorage() } catch (e) { alert((e && e.error) || '转换失败') } finally { convBusy.value = false } }
const loadStorage = async () => { try { const r = await projectApi.storage(); used.value = (r && (r.used != null ? r.used : 0)) || 0; if (r && r.limit) limit.value = r.limit; points.value = (r && r.points != null ? r.points : points.value) } catch {} }
const pv = ref({ open: false, url: '', name: '', kind: 'file', text: '' })
function b64Text(b64) { try { const bin = atob(b64); const bytes = Uint8Array.from(bin, c => c.charCodeAt(0)); return new TextDecoder().decode(bytes) } catch { return '' } }
function textOf(u) { const i = u.indexOf(','); if (i < 0) return ''; const head = u.slice(0, i), body = u.slice(i + 1); try { return /;base64/i.test(head) ? b64Text(body) : decodeURIComponent(body) } catch { return body } }
function open(url, type, name) {
  const t = (type || '').toLowerCase()
  const kind = /^data:image/.test(url) || t.indexOf('image') === 0 ? 'image' : /^data:video/.test(url) || t.indexOf('video') === 0 ? 'video' : /^data:audio/.test(url) || t.indexOf('audio') === 0 ? 'audio' : t.startsWith('text/') || t.includes('json') || t.includes('csv') || t.includes('xml') || t.includes('javascript') || t.includes('svg') || /^data:text\//.test(url) ? 'text' : 'file'
  pv.value = { open: true, url, name: name || '预览', kind, text: kind === 'text' ? textOf(url) : '' }
}
function close() { pv.value.open = false }

async function load() {
  loading.value = true
  try {
    const logs = await projectApi.logs(pid.value, { full: 1 })
    const arr = Array.isArray(logs) ? logs : (logs.logs || [])
    rows.value = arr
      .filter(l => (l.files && l.files.length) || (l.images && l.images.length))
      .map(l => ({ date: l.date, weekday: wk(l.date), images: l.images || [], files: l.files || [] }))
      .sort((a, b) => b.date.localeCompare(a.date))
    totalImg.value = rows.value.reduce((n, r) => n + r.images.length, 0)
    totalFile.value = rows.value.reduce((n, r) => n + r.files.length, 0)
  } catch { rows.value = [] } finally { loading.value = false }
  if (spinTimer) { clearInterval(spinTimer); spinTimer = null }
  try { const r = await projectApi.storage(); used.value = (r && (r.used != null ? r.used : 0)) || 0; if (r && r.limit) limit.value = r.limit; bonus.value = (r && r.bonus) || 0; points.value = (r && r.points != null ? r.points : points.value) } catch {}
}
onMounted(() => { if (!user.isLoggedIn) { router.push('/login'); return } load(); spinTimer = setInterval(() => { spinTxt.value = spinMsgs[Math.floor(Math.random() * spinMsgs.length)] }, 1000) })
</script>

<style scoped>
.files-page { padding: clamp(16px, 3vw, 30px) clamp(14px, 4vw, 40px) 80px; width: 100%; box-sizing: border-box; max-width: 1200px; margin: 0 auto; position: relative; }
.fp-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
.fp-head h1 { font-size: 22px; margin: 0 0 4px; }
.fp-sub { color: var(--text-2); font-size: 13px; margin: 0; }
.fp-count { font-size: 12px; color: var(--text-2); white-space: nowrap; }
.quota { display: flex; align-items: center; gap: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 10px 14px; margin-bottom: 18px; }
.q-lbl { font-size: 12px; color: var(--text-2); }
.q-bar { flex: 1; height: 8px; border-radius: 5px; background: var(--surface-2); overflow: hidden; }
.q-bar i { display: block; height: 100%; background: linear-gradient(90deg, var(--accent), #7b6cff); border-radius: 5px; transition: width .4s; }
.q-num { font-size: 12px; color: var(--text-2); white-space: nowrap; }
.q-buy { flex-shrink: 0; border: none; border-radius: 9px; background: var(--accent); color: #fff; padding: 6px 12px; font-size: 12px; cursor: pointer; }
.quota-hint { font-size: 11px; color: var(--text-2); margin: -10px 0 18px; }
.conv-mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); z-index: 240; display: flex; align-items: center; justify-content: center; padding: 20px; }
.conv-card { width: min(360px, 92vw); background: var(--surface); border-radius: 16px; padding: 20px; display: flex; flex-direction: column; gap: 12px; }
.conv-card h3 { margin: 0; }
.conv-tip { margin: 0; color: var(--text-2); font-size: 13px; }
.conv-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.conv-presets button { padding: 10px; border: 1px solid var(--border); border-radius: 9px; background: var(--bg); color: var(--text); font-size: 12px; cursor: pointer; }
.conv-presets button.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent); }
.conv-do { border: none; border-radius: 10px; background: var(--accent); color: #fff; padding: 12px; font-size: 14px; cursor: pointer; }
.conv-do:disabled { opacity: .5; }
.conv-cancel { border: none; background: none; color: var(--text-2); font-size: 13px; cursor: pointer; }
.empty { text-align: center; color: var(--text-2); padding: 60px 0; }
.fp-load { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 80px 0; color: var(--text-2); font-size: 13px; }
.spin { width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--surface-2); border-top-color: var(--accent); animation: fpspin .8s linear infinite; }
@keyframes fpspin { to { transform: rotate(360deg); } }
.fp-list { display: flex; flex-direction: column; gap: 14px; }
.fp-day { background: var(--surface); border: 1px solid var(--border); border-radius: 14px; padding: 14px 18px; }
.fp-date { font-weight: 600; margin-bottom: 10px; }
.fp-date em { font-style: normal; color: var(--text-2); font-weight: 400; margin-left: 6px; }
.fp-n { float: right; color: var(--text-2); font-size: 12px; font-weight: 400; }
.fp-imgs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 8px; }
.fp-imgs .thumb { width: 96px; height: 96px; border-radius: 10px; overflow: hidden; border: 1px solid var(--border); cursor: zoom-in; }
.fp-imgs .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.fp-files { display: flex; flex-wrap: wrap; gap: 6px; }
.fp-chip { display: inline-flex; align-items: center; gap: 5px; max-width: 240px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 12px; padding: 4px 9px; border-radius: 8px; cursor: pointer; }
.fp-chip svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.fc-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pv-mask { position: fixed; inset: 0; background: rgba(0, 0, 0, .55); z-index: 220; display: flex; align-items: center; justify-content: center; padding: 24px; }
.pv-card { width: min(860px, 94vw); max-height: 92vh; background: var(--surface); border-radius: 16px; display: flex; flex-direction: column; overflow: hidden; }
.pv-head { display: flex; justify-content: space-between; padding: 10px 14px; border-bottom: 1px solid var(--border); }
.pv-head b { font-size: 14px; }
.pv-x { width: 26px; height: 26px; border: none; border-radius: 50%; background: var(--surface-2); cursor: pointer; font-size: 15px; }
.pv-body { flex: 1; min-height: 0; background: #fff; display: flex; align-items: center; justify-content: center; flex-direction: column; overflow: auto; }
.pv-body img { max-width: 100%; max-height: 100%; object-fit: contain; }
.pv-body video { max-width: 100%; max-height: 100%; }
.pv-body audio { width: 86%; }
.pv-text { width: 100%; height: 100%; margin: 0; padding: 14px; overflow: auto; white-space: pre-wrap; word-break: break-all; font-size: 13px; font-family: ui-monospace, Menlo, Consolas, monospace; box-sizing: border-box; }
.pv-fallback { display: flex; flex-direction: column; gap: 12px; align-items: center; color: #666; }
.pv-foot { padding: 8px 14px; text-align: right; border-top: 1px solid var(--border); }
.pv-dl { color: var(--accent); font-size: 13px; text-decoration: none; }
.pv-dl.big { background: var(--accent); color: #fff; padding: 9px 20px; border-radius: 9px; }
.fade-enter-active, .fade-leave-active { transition: opacity .2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

@media (max-width: 640px){ .fp-imgs .thumb { width: 72px; height: 72px; } .quota { flex-wrap: wrap; } }
