<template>
  <div class="shell">
    <!-- 侧边栏（桌面常显，移动端抽屉） -->
    <transition name="drawer">
      <aside class="sidebar" v-show="showSidebar">
        <div class="brand" @click="goProjects">
          <div class="brand-mark">纸</div>
          <div class="brand-name">纸上</div>
        </div>
        <div class="me">
          <div class="me-name">{{ user.user?.nickname }}</div>
          <div class="me-role">{{ user.roleText || '未设置身份' }}</div>
        </div>
        <div class="sec-title">项目</div>
        <div class="proj-nav">
          <button v-for="p in projects" :key="p.id" class="proj-item"
            :class="{ active: isActive(p.id) }" @click="openProject(p.id)">
            <span class="pi-icon">{{ p.type === 'school' ? '学' : '企' }}</span>
            <span class="pi-name">{{ p.name }}</span>
          </button>
          <div v-if="!projects.length" class="proj-empty">还没有项目</div>
        </div>
        <button class="add-proj" @click="goProjects">＋ 新建项目</button>
        <div class="sb-foot">
          <button class="sb-btn" @click="settingsOpen = true">⚙ 设置</button>
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
            <button class="s-row" @click="setPage = 'profile'"><span class="s-ic">👤</span><span>个人信息</span><i>›</i></button>
            <button class="s-row" @click="setPage = 'about'"><span class="s-ic">ℹ️</span><span>版本信息</span><i>›</i></button>
            <button class="s-row" @click="setPage = 'feedback'"><span class="s-ic">💬</span><span>建议反馈</span><i>›</i></button>
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
            <div class="about-logo">纸</div>
            <p class="about-name">纸上 · Paper Todo</p>
            <p class="about-ver">版本 v0.9.0</p>
            <p class="about-line">像写日记一样，记录每天的 todo</p>
            <div class="kv"><span>类型</span><span>Web / 移动端自适应</span></div>
            <div class="kv"><span>数据</span><span>云端存储</span></div>
            <div class="kv"><span>AI 助手</span><span>小纸 · DeepSeek</span></div>
          </div>

          <!-- 建议反馈 -->
          <div v-else-if="setPage === 'feedback'" class="s-page">
            <textarea v-model="feedback" class="fb-text" rows="6" placeholder="说说你的想法或遇到的问题…"></textarea>
            <button class="primary" :disabled="saving" @click="sendFeedback">提交反馈</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 主区 -->
    <div class="main">
      <header class="m-topbar" v-if="mobile">
        <button class="m-menu" @click="drawerOpen = !drawerOpen">☰</button>
        <div class="m-brand">纸上</div>
        <button class="m-theme" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </header>
      <router-view />
    </div>

    <!-- 移动端抽屉遮罩 -->
    <div v-if="mobile && drawerOpen" class="mask" @click="drawerOpen = false"></div>

    <transition name="fade"><div v-if="toastMsg" class="toast">{{ toastMsg }}</div></transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

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
const toastMsg = ref('')
let toastTimer = null

const pageTitle = computed(() => ({ menu: '设置', profile: '个人信息', about: '版本信息', feedback: '建议反馈' }[setPage.value] || '设置'))
const showToast = m => { toastMsg.value = m; clearTimeout(toastTimer); toastTimer = setTimeout(() => toastMsg.value = '', 2000) }
const saveProfile = async () => {
  if (!profile.value.nickname.trim()) { showToast('昵称不能为空'); return }
  saving.value = true
  try {
    await user.updateProfile({ nickname: profile.value.nickname.trim(), role: profile.value.role })
    profile.value = { nickname: user.user?.nickname || '', role: user.user?.role || profile.value.role }
    showToast('已保存')
  } catch (e) { showToast(e?.error || '保存失败') } finally { saving.value = false }
}
const sendFeedback = async () => {
  if (!feedback.value.trim()) { showToast('先写点什么吧'); return }
  saving.value = true
  try {
    const list = JSON.parse(localStorage.getItem('dl_feedback') || '[]')
    list.unshift({ t: new Date().toISOString(), text: feedback.value.trim(), account: user.user?.account || '' })
    localStorage.setItem('dl_feedback', JSON.stringify(list))
    feedback.value = ''
    showToast('感谢反馈，已收到')
  } finally { saving.value = false }
}

const showSidebar = computed(() => !mobile.value || drawerOpen.value)
const isActive = id => String(route.params.projectId) === String(id)
const onResize = () => { mobile.value = window.innerWidth <= 768; if (!mobile.value) drawerOpen.value = false }

const load = async () => {
  try { const res = await projectApi.list(); projects.value = Array.isArray(res) ? res : (res.projects || []) }
  catch { projects.value = [] }
}
const openProject = id => { router.push('/log/' + id); if (mobile.value) drawerOpen.value = false }
const goProjects = () => { router.push('/projects'); if (mobile.value) drawerOpen.value = false }
const logout = () => { user.logout(); router.push('/login') }

onMounted(() => {
  if (!user.isLoggedIn) { router.push('/login'); return }
  onResize()
  window.addEventListener('resize', onResize)
  load()
})
let iv=null
watch(() => route.fullPath, () => { load(); if (mobile.value) drawerOpen.value = false })
onMounted(()=>{ iv=setInterval(load,8000) })
onBeforeUnmount(()=>clearInterval(iv))
onBeforeUnmount(() => window.removeEventListener('resize', onResize))
</script>

<style scoped>
.shell { display: flex; min-height: 100vh; }
.sidebar { width: 250px; flex-shrink: 0; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; padding: 18px 12px; position: sticky; top: 0; height: 100vh; z-index: 60; }
.brand { display: flex; align-items: center; gap: 10px; padding: 0 6px 16px; cursor: pointer; }
.brand-mark { width: 34px; height: 34px; border-radius: 10px; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; }
.brand-name { font-size: 17px; font-weight: 700; }
.me { padding: 0 6px 14px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
.me-name { font-weight: 600; font-size: 15px; }
.me-role { font-size: 12px; color: var(--text-2); }
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
.sb-foot { padding-top: 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.sb-btn { padding: 8px 10px; border: none; background: transparent; color: var(--text-2); font-size: 13px; text-align: left; cursor: pointer; border-radius: 6px; }
.sb-btn:hover { background: var(--surface-2); color: var(--text); }

.center-mask { position: fixed; inset: 0; background: rgba(0,0,0,.35); display: flex; align-items: center; justify-content: center; z-index: 200; padding: 20px; }
.center-card { width: 100%; max-width: 440px; max-height: 86vh; overflow-y: auto; background: var(--surface); border-radius: 16px; box-shadow: 0 24px 60px rgba(0,0,0,.25); padding: 20px; }
.c-head { display: flex; align-items: center; gap: 8px; margin-bottom: 16px; }
.c-head h3 { flex: 1; font-size: 17px; margin: 0; }
.c-back, .c-x { width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 16px; cursor: pointer; }
.s-list { display: flex; flex-direction: column; gap: 4px; }
.s-row { display: flex; align-items: center; gap: 12px; padding: 13px 12px; border: none; background: transparent; border-radius: 10px; color: var(--text); font-size: 14px; cursor: pointer; text-align: left; }
.s-row:hover { background: var(--surface-2); }
.s-ic { font-size: 17px; }
.s-row i { margin-left: auto; color: var(--text-2); font-style: normal; }
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
.about { text-align: center; align-items: center; }
.about-logo { width: 58px; height: 58px; border-radius: 14px; background: var(--accent); color: #fff; font-size: 28px; display: flex; align-items: center; justify-content: center; margin-top: 6px; }
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
  .m-brand { font-weight: 700; flex: 1; }
  .m-theme { border: none; background: none; font-size: 18px; cursor: pointer; }
}
</style>
