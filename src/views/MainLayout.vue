<template>
  <div class="shell">
    <!-- 侧边栏（桌面常显，移动端抽屉） -->
    <transition name="drawer">
      <aside class="sidebar" v-show="showSidebar">
        <div class="brand" @click="goHome">
          <div class="brand-mark"><img src="/papertodo_logo.png?v=2" alt="纸上" /></div>
          <div class="brand-name">纸上 - Paper Todo</div>
        </div>
        <div class="me">
          <div class="me-id">
            <div class="me-name">{{ user.user?.nickname }}</div>
            <div class="me-role">{{ user.roleText || '未设置身份' }}</div>
          </div>
          <button class="pts-chip" :class="{ pop: ptsPop }" @click="openPts" title="积分：用于云盘容量与 AI 次数加成">
            <i>✦</i><b>{{ points }}</b>
          </button>
        </div>
        <div class="proj-drop">
          <span class="pd-label">当前项目</span>
          <div class="pd" ref="pdRef">
            <button class="pd-btn" @click="pdOpen = !pdOpen">
              <span class="pd-cur">{{ currentName || '选择项目…' }}</span>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            <transition name="fade"><div v-if="pdOpen" class="pd-list">
              <button v-for="p in projects" :key="p.id" class="pd-item" :class="{ cur: currentProjId === String(p.id) }" @click="pickProj(p.id)">
                <span class="pd-it">{{ p.type === 'school' ? '学' : '企' }} · {{ p.name }}</span>
                <span v-if="currentProjId === String(p.id)" class="pd-ok">✓</span>
              </button>
              <button class="pd-item new" @click="newProj">＋ 新建{{ user.roleText === '学生' ? '学校' : user.roleText === '职场人' ? '企业' : '项目' }}</button>
              <div v-if="!projects.length" class="pd-empty">还没有项目</div>
            </div></transition>
          </div>
          <p v-if="!projects.length" class="pd-hint">还没有项目，点“＋新建”创建</p>
        </div>
        <div class="ftabs">
          <button class="ftab" :class="{ on: route.path.startsWith('/log/') }" @click="openProject(currentProjId || firstId)"><svg viewBox="0 0 24 24" width="14" height="14"><rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M8 13h4"/></svg>每日待办</button><button class="ftab" :class="{ on: route.path.startsWith('/files/') }" @click="goFiles(currentProjId || firstId)"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>云文件管理</button><button class="ftab" :class="{ on: route.path.startsWith('/review/') }" @click="goReview(currentProjId || firstId)"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>回顾与成就</button>
          <button class="ftab" :class="{ on: route.path.startsWith('/files/') }" @click="goFiles(currentProjId || firstId)"><svg viewBox="0 0 24 24" width="14" height="14"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>云文件管理</button>
        </div>
        <div class="sb-foot">
          <button class="sb-btn" @click="settingsOpen = true">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            <span>设置</span>
          </button>
          <button class="sb-btn" @click="logout">退出登录</button>
        </div>
      </aside>
    </transition>

    <!-- 设置悬浮窗 -->
    <transition name="fade">
      <div v-if="settingsOpen" class="center-mask" @click.self="settingsOpen = false">
        <div class="center-card">
          <div class="c-head">
            <button v-if="setPage !== 'menu'" class="c-back" @click="setPage = 'menu'">‹</button>
            <h3>{{ pageTitle }}</h3>
            <button class="c-x" @click="settingsOpen = false">×</button>
          </div>

          <!-- 菜单 -->
          <div v-if="setPage === 'menu'" class="s-list">
            <button class="s-row" @click="setPage = 'profile'"><span class="s-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span><span>个人信息</span><i>›</i></button>
            <button class="s-row" @click="setPage = 'about'"><span class="s-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg></span><span>版本信息</span><i>›</i></button>
            <button class="s-row" @click="setPage = 'feedback'"><span class="s-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg></span><span>建议反馈</span><span class="s-badge" v-if="unreadReplies">{{ unreadReplies }}</span><i>›</i></button>
          </div>

          <!-- 个人信息 -->
          <div v-else-if="setPage === 'profile'" class="s-page">
            <label class="field"><span class="f-label">账号</span>
              <input class="f-input" :value="user.user?.account || user.user?.name || ''" disabled /></label>
            <label class="field"><span class="f-label">昵称</span>
              <input class="f-input" v-model.trim="profile.nickname" placeholder="怎么称呼你" /></label>
            <span class="f-label">身份</span>
            <div class="seg">
              <button :class="{ on: profile.role === 'student' }" @click="profile.role = 'student'">学生</button>
              <button :class="{ on: profile.role === 'worker' }" @click="profile.role = 'worker'">职场人</button>
            </div>
            <button class="primary" :disabled="saving" @click="saveProfile">保存</button>
          </div>

          <!-- 版本信息 -->
          <div v-else-if="setPage === 'about'" class="s-page about">
            <div class="about-logo"><img src="/papertodo_logo.png?v=2" alt="纸上" /></div>
            <p class="about-name">纸上 · Paper Todo</p>
            <p class="about-ver">v1.0.0 · 全民公测</p>
            <p class="about-line">像写日记一样，记录每天的 todo</p>
            <div class="kv"><span>类型</span><span>Web / 移动端自适应</span></div>
            <div class="kv"><span>数据</span><span>云端存储</span></div>
            <div class="kv"><span>AI 助手</span><span>小纸 · DeepSeek</span></div>
            <div class="chg">
              <p class="chg-t">版本日志</p>
              <ul>
                <li><b>v1.0.0-beta</b> · 手机号验证码注册登录</li>
                <li>· 任务图片 + 卡片附件上传：统一缩略图、在线预览、删除、下载</li>
                <li>· 消息通知中心：管理员回复提醒、红点角标、一键已读（15s 热更新）</li>
                <li>· 反馈直达管理员并逐条回复</li>
                <li>· 导入任务：兼容多种日期格式，支持上一版本 / 下一版本</li>
                <li>· 代码级缩略图：恒定宽度、内容定位、点击直达；日历热力视图</li>
                <li>· AI 小纸：写周报 / 总结 / 统计 / 明日计划等技能，整段成稿输出</li>
                <li>· 每日一记：连续编辑、自动保存、iOS 式完成开关、删除二次确认</li>
                <li>· 公测提示：更新频繁期欢迎随时在「建议反馈」提交建议</li>
              </ul>
            </div>
          </div>

          <!-- 建议反馈 -->
          <div v-else-if="setPage === 'feedback'" class="s-page">
            <template v-if="isAdmin">
              <p class="fb-hint">管理员 · 全部用户反馈（{{ fbList.length }}）</p>
              <div v-if="fbLoading" class="fb-empty">加载中…</div>
              <div v-else class="fb-list">
                <div v-for="f in fbList" :key="f.id" class="fb-item">
                  <div class="fb-meta">{{ f.account }}<em>{{ f.nickname }}</em><i>{{ fmtTime(f.createdAt) }}</i></div>
                  <p class="fb-body">{{ f.text }}</p>
                  <div v-for="(r, ri) in f.replies" :key="ri" class="fb-reply"><b>你的回复：</b>{{ r.text }}<i>{{ fmtTime(r.at) }}</i></div>
                  <div class="fb-reply-row">
                    <input v-model.trim="replyMap[f.id]" class="fb-input" placeholder="回复该反馈…" @keydown.enter="replyTo(f)" />
                    <button class="primary sm" :disabled="!replyMap[f.id] || saving" @click="replyTo(f)">回复</button>
                  </div>
                </div>
                <div v-if="!fbList.length" class="fb-empty">暂无用户反馈</div>
              </div>
            </template>
            <template v-else>
              <p class="fb-hint">你的反馈：管理员会在此回复你（可多次提交）</p>
              <textarea v-model="feedback" class="fb-text" rows="5" placeholder="说说你的想法或遇到的问题…"></textarea>
              <button class="primary" :disabled="saving" @click="sendFeedback">提交反馈</button>
              <div class="fb-list">
                <div v-for="f in fbList" :key="f.id" class="fb-item">
                  <div class="fb-meta"><i>{{ fmtTime(f.createdAt) }}</i></div>
                  <p class="fb-body">{{ f.text }}</p>
                  <div v-for="(r, ri) in f.replies" :key="ri" class="fb-reply"><b>管理员：</b>{{ r.text }}<i>{{ fmtTime(r.at) }}</i></div>
                </div>
                <div v-if="!fbList.length" class="fb-empty">还没有反馈记录</div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </transition>

    <!-- 新建项目 -->
    <transition name="fade">
      <div v-if="showNewProj" class="center-mask" @click.self="showNewProj = false">
        <div class="center-card">
          <div class="c-head"><h3>新建{{ user.roleText === '学生' ? '学校' : user.roleText === '职场人' ? '企业' : '项目' }}</h3><button class="c-x" @click="showNewProj = false">×</button></div>
          <label class="field"><span class="f-label">名称</span><input class="f-input" v-model.trim="np.name" :placeholder="user.roleText === '学生' ? '如：中山大学' : '如：某某科技'" /></label>
          <label class="field"><span class="f-label">{{ user.roleText === '学生' ? '入学日期' : user.roleText === '职场人' ? '入职日期' : '开始日期' }}</span><input class="f-input" v-model="np.startDate" type="date" /></label>
          <button class="primary" :disabled="saving || !np.name.trim() || !np.startDate" @click="createProject">创建并进入</button>
        </div>
      </div>
    </transition>

    <!-- 主区 -->
    <div class="main">
      <header class="m-topbar" v-if="mobile">
        <button class="m-menu" @click="drawerOpen = !drawerOpen">☰</button>
        <div class="m-brand">纸上 - Paper Todo</div>
        <button class="m-theme" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </header>
      <router-view />
    </div>

    <!-- 移动端抽屉遮罩 -->
    <div v-if="mobile && drawerOpen" class="mask" @click="drawerOpen = false"></div>

    <!-- 积分 -->
    <transition name="fade">
      <div v-if="ptsOpen" class="center-mask" @click.self="ptsOpen = false">
        <div class="center-card">
          <div class="c-head"><h3>我的积分 <b class="pts-big">✦ {{ points }}</b></h3><button class="c-x" @click="ptsOpen = false">×</button></div>
          <p class="pts-tip">每日登录 +10、当天有完成的任务 +5（每天各一次）；删除当天记录会扣回，防止刷分。</p>
          <p class="pts-tip">扩容：1 积分 = 云盘 +1MB（永久）；AI 每天免费 30 次，超出每次消耗 1 积分。</p>
          <div class="pts-list">
            <div v-for="l in ptsLogs" :key="l.id" class="pts-item">
              <span class="pt-note">{{ l.note }}</span>
              <span class="pt-amt" :class="{ minus: l.amount < 0 }">{{ l.amount > 0 ? '+' : '' }}{{ l.amount }}</span>
              <span class="pt-time">{{ fmtPtsTime(l.createdAt) }}</span>
            </div>
            <div v-if="!ptsLogs.length" class="pts-empty">还没有积分记录，去记一条任务吧</div>
          </div>
        </div>
      </div>
    </transition>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'
import { feedbackApi } from '../api/feedback'
import { authApi } from '../api/auth'

const router = useRouter()
const route = useRoute()
const user = useUserStore()
const theme = useThemeStore()
const projects = ref([])
const mobile = ref(false)
const drawerOpen = ref(false)
const settingsOpen = ref(false)
const setPage = ref('menu')
const saving = ref(false)
const profile = ref({ nickname: user.user?.nickname || '', role: user.user?.role || 'student' })
const feedback = ref('')
const fbList = ref([])
const replyMap = reactive({})
const isAdmin = computed(() => ['admin', '13535747642'].includes(user.user?.account))
const fbLoading = ref(false)
const fbReadKey = 'dl_fb_read_' + (user.user?.account || '')
const fbReadAt = ref(Number(localStorage.getItem(fbReadKey) || 0))
const unreadReplies = computed(() => fbList.value.reduce((n, f) => n + (f.replies || []).filter(r => r.at > fbReadAt.value).length, 0))
const toastMsg = ref('')
const points = ref(0)
const ptsPop = ref(false)
const ptsOpen = ref(false)
const ptsLogs = ref([])
let toastTimer = null

const pageTitle = computed(() => ({ menu: '设置', profile: '个人信息', about: '版本信息', feedback: '建议反馈' }[setPage.value] || '设置'))
const showToast = m => { toastMsg.value = m; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastMsg.value = '', 2000) }
let ptsTimer = null
const fmtPtsTime = ts => { if (!ts) return ''; const d = new Date(ts); const p = n => String(n).padStart(2, '0'); return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
const lastPts = ref(0)
const loadPoints = async (animate = false) => { try { const res = await authApi.points(); const p = (res && res.points) != null ? Number(res.points) : points.value; if ((animate && p > points.value) || p > lastPts.value) { ptsPop.value = true; setTimeout(() => ptsPop.value = false, 900) } lastPts.value = p; points.value = p; ptsLogs.value = (res && res.logs) || [] } catch {} }
const onPtsChanged = () => loadPoints(true)
const openPts = () => { ptsOpen.value = true; loadPoints(true) }
const saveProfile = async () => {
  if (!profile.value.nickname.trim()) { showToast('昵称不能为空'); return }
  saving.value = true
  try {
    await user.updateProfile({ nickname: profile.value.nickname.trim(), role: profile.value.role })
    profile.value = { nickname: user.user?.nickname || '', role: user.user?.role || profile.value.role }
    showToast('已保存')
  } catch (e) { showToast(e?.error || '保存失败') } finally { saving.value = false }
}
const fmtTime = ts => { if (!ts) return ''; const d = new Date(ts); const p = n => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}` }
const loadFeedback = async () => {
  fbLoading.value = true
  try { const res = await feedbackApi.list(); fbList.value = Array.isArray(res) ? res : (res.list || []) }
  catch { fbList.value = [] } finally { fbLoading.value = false }
}
const sendFeedback = async () => {
  if (!feedback.value.trim()) { showToast('先写点什么吧'); return }
  saving.value = true
  try { await feedbackApi.create({ text: feedback.value.trim() }); feedback.value = ''; showToast('感谢反馈，已收到'); await loadFeedback() }
  catch (e) { showToast(e?.error || '提交失败') } finally { saving.value = false }
}
const replyTo = async f => {
  const t = (replyMap[f.id] || '').trim(); if (!t) return
  saving.value = true
  try { await feedbackApi.reply(f.id, { text: t }); delete replyMap[f.id]; showToast('已回复给 ' + f.account); await loadFeedback() }
  catch (e) { showToast(e?.error || '回复失败') } finally { saving.value = false }
}
watch(() => setPage.value, v => { if (v === 'feedback') { loadFeedback(); fbReadAt.value = Date.now(); localStorage.setItem(fbReadKey, String(fbReadAt.value)) } })

const showSidebar = computed(() => !mobile.value || drawerOpen.value)
const isActive = id => String(route.params.projectId) === String(id)
const onResize = () => { mobile.value = window.innerWidth <= 768; if (!mobile.value) drawerOpen.value = false }

const load = async () => {
  try { const res = await projectApi.list(); projects.value = Array.isArray(res) ? res : (res.projects || []) }
  catch { projects.value = [] }
}
const currentProjId = computed(() => (route.path.startsWith('/log/') ? String(route.params.projectId || '') : ''))
const pdOpen = ref(false)
const pdRef = ref(null)
const currentName = computed(() => { const p = projects.value.find(x => String(x.id) === currentProjId.value); return p ? p.name : '' })
const firstId = computed(() => projects.value.length ? String(projects.value[0].id) : '')
const goFiles = id => { if (!id) return; pdOpen.value = false; router.push('/files/' + id); if (mobile.value) drawerOpen.value = false }
const goReview = id => { if (!id) return; pdOpen.value = false; router.push('/review/' + id); if (mobile.value) drawerOpen.value = false }
const pickProj = id => { pdOpen.value = false; if (id) { router.push('/log/' + id); if (mobile.value) drawerOpen.value = false } }
const newProj = () => { pdOpen.value = false; showNewProj.value = true }
const onPdDown = e => { if (pdRef.value && pdOpen.value && !pdRef.value.contains(e.target)) pdOpen.value = false }
const showNewProj = ref(false)
const np = ref({ name: '', startDate: '' })
const createProject = async () => {
  if (!np.value.name.trim() || !np.value.startDate) return
  saving.value = true
  try {
    const res = await projectApi.create({ name: np.value.name.trim(), startDate: np.value.startDate })
    const id = res?.id || res?.project?.id
    showNewProj.value = false
    np.value = { name: '', startDate: '' }
    await load()
    if (id) router.push('/log/' + id)
  } catch (e) { showToast(e?.error || '创建失败') } finally { saving.value = false }
}
const openProject = id => { router.push('/log/' + id); if (mobile.value) drawerOpen.value = false }
const goHome = () => { const id = projects.value.length ? String(projects.value[0].id) : ''; if (id) { router.push('/log/' + id); if (mobile.value) drawerOpen.value = false } else { showNewProj.value = true } }
const goProjects = () => { router.push('/projects'); if (mobile.value) drawerOpen.value = false }
const logout = () => { user.logout(); router.push('/login') }

onMounted(() => {
  if (!user.isLoggedIn) { router.push('/login'); return }
  onResize()
  window.addEventListener('resize', onResize)
  document.addEventListener('mousedown', onPdDown)
  load()
})
let iv=null
let ptsIv=null
watch(() => route.fullPath, () => { load(); if (mobile.value) drawerOpen.value = false })
onMounted(()=>{ iv=setInterval(load,8000); loadPoints(); ptsIv=setInterval(() => loadPoints(), 20000); window.addEventListener('pts-changed', onPtsChanged) })
onBeforeUnmount(()=>{ clearInterval(iv); if (ptsIv) clearInterval(ptsIv); window.removeEventListener('pts-changed', onPtsChanged) })
onBeforeUnmount(() => { window.removeEventListener('resize', onResize); document.removeEventListener('mousedown', onPdDown) })
</script>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.sidebar { width: 250px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 18px 12px; position: sticky; top: 0; height: 100vh; z-index: 60; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 16px; cursor: pointer; }
.brand-mark { width: 34px; height: 34px; border-radius: 10px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.brand-mark img { width: 100%; height: 100%; object-fit: cover; }
.brand-name { font-size: 15px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.me { padding: 0 6px 14px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
.me-name { font-weight: 600; font-size: 15px; }
.me { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.me-id { min-width: 0; }
.pts-chip { display: inline-flex; align-items: center; gap: 4px; border: 1px solid rgba(255,190,0,.5); background: linear-gradient(135deg, rgba(255,214,10,.16), rgba(255,150,0,.12)); color: #d9a400; border-radius: 999px; padding: 3px 9px; font-size: 12px; cursor: pointer; flex-shrink: 0; }
.pts-chip i { font-style: normal; }
.pts-chip b { font-size: 13px; }
.pts-chip.pop { animation: ptsPop .6s ease; }
@keyframes ptsPop { 0% { transform: scale(1); } 40% { transform: scale(1.35); } 100% { transform: scale(1); } }
.pts-big { color: #d9a400; }
.pts-tip { color: var(--text-2); font-size: 12px; margin: 0; line-height: 1.6; }
.pts-list { max-height: 300px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.pts-item { display: flex; align-items: center; gap: 8px; padding: 7px 2px; border-bottom: 1px solid var(--border); font-size: 13px; }
.pt-note { flex: 1; color: var(--text); }
.pt-amt { color: var(--accent); font-weight: 700; }
.pt-amt.minus { color: var(--red); }
.pt-time { color: var(--text-2); font-size: 11px; }
.pts-empty { padding: 20px; text-align: center; color: var(--text-2); font-size: 13px; }
.proj-drop { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.pd-label { font-size: 11px; color: var(--text-2); padding: 0 6px; }
 .pd { position: relative; }
.pd-btn { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 9px 11px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 14px; cursor: pointer; }
.pd-btn:hover { border-color: var(--accent); }
.pd-cur { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pd-list { position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; box-shadow: 0 14px 40px rgba(0,0,0,.18); padding: 4px; max-height: 260px; overflow-y: auto; z-index: 30; }
.pd-item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; padding: 9px 10px; border: none; background: transparent; color: var(--text); font-size: 13px; border-radius: 7px; cursor: pointer; text-align: left; }
.pd-item:hover { background: var(--surface-2); }
.pd-item.cur { color: var(--accent); font-weight: 600; }
.pd-item.new { color: var(--accent); border-top: 1px solid var(--border); margin-top: 3px; }
.pd-ok { color: var(--accent); }
.pd-empty { text-align: center; color: var(--text-2); font-size: 12px; padding: 10px; }
.pd-hint { font-size: 12px; color: var(--text-2); padding: 0 6px; }
.ftabs { display: flex; flex-direction: column; gap: 4px; margin: 2px 0 10px; }
.ftab { display: flex; align-items: center; gap: 9px; padding: 9px 10px; border: none; background: transparent; color: var(--text-2); font-size: 13px; border-radius: 8px; cursor: pointer; text-align: left; }
.ftab svg { fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; flex-shrink: 0; }
.ftab:hover { background: var(--surface-2); color: var(--text); }
.ftab.on { background: var(--accent); color: #fff; }
.sec-title { font-size: 11px; color: var(--text-2); text-transform: uppercase; padding: 0 6px 8px; }
.proj-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; min-height: 0; }
.proj-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: none; background: transparent; color: var(--text); border-radius: 8px; cursor: pointer; font-size: 14px; text-align: left; }
.proj-item:hover { background: var(--surface-2); }
.proj-item.active { background: var(--accent); color: #fff; }
.pi-icon { width: 24px; height: 24px; border-radius: 7px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.proj-item.active .pi-icon { background: rgba(255,255,255,.2); }
.pi-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proj-empty { color: var(--text-2); font-size: 13px; padding: 8px; }
.add-proj { margin: 8px 0 10px; padding: 10px; border-radius: 8px; border: 1px dashed var(--border); background: transparent; color: var(--text-2); cursor: pointer; font-size: 13px; }
.add-proj:hover { border-color: var(--accent); color: var(--accent); }
.sb-foot { margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.sb-btn { display: flex; align-items: center; gap: 8px; padding: 8px 10px; border: none; background: transparent; color: var(--text-2); font-size: 13px; text-align: left; cursor: pointer; border-radius: 6px; }
.sb-btn:hover { background: var(--surface-2); color: var(--text); }
.brand-mark svg { display: block; }

.center-mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.center-card { width: 100%; max-width: 440px; max-height: 86vh; overflow-y: auto; background: var(--surface); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.25); padding: 20px; }
.c-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.c-head h3 { flex: 1; font-size: 17px; margin: 0; }
.c-back, .c-x { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 16px; cursor: pointer; }
.s-list { display: flex; flex-direction: column; gap: 4px; }
.s-row { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border: none; background: transparent; border-radius: 10px; color: var(--text); font-size: 14px; cursor: pointer; text-align: left; }
.s-row:hover { background: var(--surface-2); }
.s-ic { display: inline-flex; width: 20px; height: 20px; color: var(--text-2); flex-shrink: 0; }
.s-ic svg { width: 100%; height: 100%; display: block; }
.s-row i { margin-left: auto; color: var(--text-2); font-style: normal; }
.s-badge { min-width: 16px; height: 16px; padding: 0 5px; border-radius: 9px; background: var(--red); color: #fff; font-size: 11px; line-height: 16px; text-align: center; flex-shrink: 0; }
.s-page { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 11px 13px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; outline: none; }
.f-input:disabled { opacity: .55; }
.seg { display: flex; background: var(--surface-2); border-radius: 10px; padding: 4px; gap: 4px; }
.seg button { flex: 1; padding: 9px; border: none; background: transparent; border-radius: 8px; color: var(--text-2); font-size: 14px; cursor: pointer; }
.seg button.on { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: var(--shadow); }
.primary { padding: 12px; border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
.primary:disabled { opacity: .55; }
.fb-text { resize: vertical; min-height: 130px; padding: 11px 13px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 14px; outline: none; font-family: inherit; }
.fb-hint { font-size: 13px; color: var(--text-2); }
.fb-tip { font-size: 12px; color: var(--text-2); }
.fb-list { display: flex; flex-direction: column; gap: 12px; margin-top: 6px; }
.fb-item { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--bg); }
.fb-item .fb-meta { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-2); margin-bottom: 4px; }
.fb-item .fb-meta em { font-style: normal; color: var(--text); font-weight: 600; margin-left: 4px; }
.fb-item .fb-meta i { margin-left: auto; font-style: normal; }
.fb-body { margin: 0; font-size: 13px; color: var(--text); line-height: 1.6; word-break: break-word; }
.fb-reply { margin-top: 6px; font-size: 12px; color: var(--text); background: var(--surface-2); border-radius: 8px; padding: 6px 9px; line-height: 1.5; }
.fb-reply b { color: var(--accent); }
.fb-reply i { display: block; font-style: normal; color: var(--text-2); margin-top: 2px; }
.fb-reply-row { display: flex; gap: 8px; margin-top: 8px; }
.fb-reply-row .fb-input { flex: 1; padding: 7px 10px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 13px; outline: none; }
.fb-reply-row .primary.sm { padding: 7px 14px; font-size: 13px; }
.fb-empty { text-align: center; color: var(--text-2); font-size: 13px; padding: 14px; }

.about { text-align: center; align-items: center; }
.chg { width: 100%; text-align: left; margin-top: 6px; }
.chg-t { font-size: 12px; color: var(--text-2); margin: 0 0 6px; }
.chg ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.chg li { font-size: 12px; color: var(--text); line-height: 1.5; border-left: 2px solid var(--accent); padding-left: 8px; }
.chg li b { color: var(--accent); }
.about-logo { width: 58px; height: 58px; border-radius: 14px; overflow: hidden; display: flex; align-items: center; justify-content: center; margin-top: 6px; }
.about-logo img { width: 100%; height: 100%; object-fit: cover; }
.about-name { font-size: 17px; font-weight: 700; margin: 10px 0 2px; }
.about-ver { font-size: 13px; color: var(--text-2); margin: 0; }
.about-line { font-size: 13px; color: var(--text-2); margin: 4px 0 16px; }
.about .kv { display: flex; justify-content: space-between; width: 100%; padding: 10px 2px; border-top: 1px solid var(--border); font-size: 13px; color: var(--text); }
.about .kv span:last-child { color: var(--text-2); }
.toast { position: fixed; left: 50%; bottom: 44px; transform: translateX(-50%); background: var(--text); color: var(--bg); padding: 10px 22px; border-radius: 22px; font-size: 14px; z-index: 300; }
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}

.main { flex: 1; min-width: 0; background: var(--bg); height: 100vh; overflow: hidden; }
.m-topbar { display: none; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); z-index: 55; }

@media (max-width: 768px) {
  .shell { display: block; }
  .main { height: calc(100vh - 46px); }
  .sidebar { position: fixed; left: 0; top: 0; height: 100vh; width: 260px; z-index: 70; }
  .m-topbar { display: flex; align-items: center; gap: 10px; padding: 8px 14px; background: var(--surface); border-bottom: 1px solid var(--border); position: sticky; top: 0; z-index: 50; }
  .m-menu { border: none; background: none; font-size: 20px; color: var(--text); cursor: pointer; }
  .m-brand { font-weight: 700; flex: 1; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .m-theme { border: none; background: none; font-size: 18px; cursor: pointer; }
}
</style>
