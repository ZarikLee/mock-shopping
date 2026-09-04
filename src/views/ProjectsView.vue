<template>
  <div class="screen">
    <header class="topbar">
      <div>
        <div class="greet">{{ user.user?.nickname || '你好' }}</div>
        <div class="role-chip">{{ user.roleText || '未设置身份' }}</div>
      </div>
      <div class="top-right">
        <button class="icon-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
        <button class="icon-btn" @click="logout" title="退出登录">退出</button>
      </div>
    </header>

    <div class="content">
      <h1 class="head">{{ user.roleText === '学生' ? '我的学校' : '我的企业' }}</h1>
      <p class="sub">点击进入记录每一天</p>

      <div v-if="loading" class="empty">加载中…</div>

      <div v-else class="proj-list">
        <button v-for="p in projects" :key="p.id" class="proj-card" @click="openLog(p)">
          <div class="proj-icon">{{ user.roleText === '学生' ? '学' : '企' }}</div>
          <div class="proj-info">
            <div class="proj-name">{{ p.name }}</div>
            <div class="proj-date">
              {{ p.type === 'school' ? '入学' : '入职' }}于 {{ formatDate(p.startDate) }}
              <template v-if="p.logCount"> · 已记 {{ p.logCount }} 天</template>
            </div>
          </div>
          <div class="proj-arrow">›</div>
        </button>

        <div v-if="!projects.length" class="empty">
          <p>还没有{{ user.roleText === '学生' ? '学校' : '企业' }}项目</p>
          <p class="hint">点下方按钮新建一个开始吧</p>
        </div>
      </div>

      <button class="add-btn" @click="showCreate = true">＋ 新建{{ user.roleText === '学生' ? '学校' : '企业' }}</button>
    </div>

    <div v-if="showCreate" class="mask" @click.self="showCreate = false">
      <div class="sheet">
        <h3>新建{{ user.roleText === '学生' ? '学校' : '企业' }}</h3>
        <label class="field"><span class="f-label">{{ user.roleText === '学生' ? '学校名称' : '企业名称' }}</span>
          <input v-model.trim="form.name" class="f-input" :placeholder="user.roleText === '学生' ? '如：中山大学' : '如：某某科技'" /></label>
        <label class="field"><span class="f-label">{{ user.roleText === '学生' ? '入学日期' : '入职日期' }}</span>
          <input v-model="form.startDate" type="date" class="f-input" /></label>
        <p class="err" v-if="error">{{ error }}</p>
        <div class="btns">
          <button class="ghost" @click="showCreate = false">取消</button>
          <button class="primary" :disabled="!form.name.trim() || !form.startDate" @click="create">创建</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const projects = ref([])
const loading = ref(true)
const showCreate = ref(false)
const error = ref('')
const form = ref({ name: '', startDate: '' })

const formatDate = d => (d || '').slice(0, 10)

const load = async () => {
  loading.value = true
  try {
    const res = await projectApi.list()
    projects.value = Array.isArray(res) ? res : (res.projects || [])
  } catch { projects.value = [] } finally { loading.value = false }
}

const openLog = p => router.push(`/log/${p.id}`)

const create = async () => {
  error.value = ''
  try {
    const p = await projectApi.create({ name: form.value.name.trim(), startDate: form.value.startDate })
    form.value = { name: '', startDate: '' }
    showCreate.value = false
    router.push(`/log/${p.id || p.project?.id}`)
  } catch (e) { error.value = e?.error || '创建失败' }
}

const logout = () => { user.logout(); router.push('/') }

onMounted(() => {
  if (!user.isLoggedIn) router.push('/')
  else load()
})
</script>

<style scoped>
.screen { min-height: 100vh; }
.topbar { max-width: 720px; margin: 0 auto; padding: 22px 20px 0; display: flex; justify-content: space-between; align-items: center; }
.greet { font-size: 20px; font-weight: 700; }
.role-chip { color: var(--text-2); font-size: 12px; margin-top: 3px; }
.top-right { display: flex; gap: 10px; }
.icon-btn { padding: 8px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 13px; cursor: pointer; }
.content { max-width: 720px; margin: 0 auto; padding: 30px 20px 60px; }
.head { font-size: 24px; font-weight: 700; }
.sub { color: var(--text-2); font-size: 14px; margin: 4px 0 24px; }
.proj-list { display: flex; flex-direction: column; gap: 12px; }
.proj-card { display: flex; align-items: center; gap: 14px; width: 100%; padding: 18px; border-radius: 14px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; text-align: left; transition: transform .15s, box-shadow .15s; }
.proj-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.proj-icon { width: 44px; height: 44px; border-radius: 11px; background: var(--accent); color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.proj-info { flex: 1; min-width: 0; }
.proj-name { font-size: 17px; font-weight: 600; }
.proj-date { font-size: 13px; color: var(--text-2); margin-top: 3px; }
.proj-arrow { font-size: 24px; color: var(--text-2); }
.empty { text-align: center; color: var(--text-2); padding: 50px 0; }
.hint { font-size: 13px; margin-top: 6px; }
.add-btn { width: 100%; margin-top: 20px; padding: 16px; border-radius: 14px; border: 2px dashed var(--border); background: transparent; color: var(--text-2); font-size: 15px; cursor: pointer; transition: all .2s; }
.add-btn:hover { border-color: var(--accent); color: var(--accent); }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.sheet { width: 100%; max-width: 520px; background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 30px; display: flex; flex-direction: column; gap: 16px; }
.sheet h3 { text-align: center; }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; outline: none; }
.btns { display: flex; gap: 10px; }
.btns button { flex: 1; padding: 13px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
.primary { background: var(--accent); border: none; color: #fff; }
.primary:disabled { opacity: .5; cursor: not-allowed; }
.err { color: var(--red); font-size: 13px; text-align: center; }
</style>
