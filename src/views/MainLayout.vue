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
          <button class="sb-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀ 日间' : '☾ 暗色' }}</button>
          <button class="sb-btn" @click="logout">退出登录</button>
        </div>
      </aside>
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
watch(() => route.path, () => { if (mobile.value) drawerOpen.value = false })
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
.proj-nav { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
.proj-item { display: flex; align-items: center; gap: 10px; padding: 9px 10px; border: none; background: transparent; color: var(--text); border-radius: 8px; cursor: pointer; font-size: 14px; text-align: left; }
.proj-item:hover { background: var(--surface-2); }
.proj-item.active { background: var(--accent); color: #fff; }
.pi-icon { width: 24px; height: 24px; border-radius: 7px; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.proj-item.active .pi-icon { background: rgba(255,255,255,.2); }
.pi-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.proj-empty { color: var(--text-2); font-size: 13px; padding: 8px; }
.add-proj { margin-top: 10px; padding: 10px; border-radius: 8px; border: 1px dashed var(--border); background: transparent; color: var(--text-2); cursor: pointer; font-size: 13px; }
.add-proj:hover { border-color: var(--accent); color: var(--accent); }
.sb-foot { padding-top: 10px; border-top: 1px solid var(--border); display: flex; flex-direction: column; gap: 4px; }
.sb-btn { padding: 8px 10px; border: none; background: transparent; color: var(--text-2); font-size: 13px; text-align: left; cursor: pointer; border-radius: 6px; }
.sb-btn:hover { background: var(--surface-2); color: var(--text); }

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
