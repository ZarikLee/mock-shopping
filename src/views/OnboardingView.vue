<template>
  <div class="onb-screen">
    <header class="bar">
      <div class="bar-l">
        <button v-if="step === 'detail'" class="back" @click="step = 'role'">‹ 返回</button>
        <button v-else class="back ghost" @click="logout">退出登录</button>
      </div>
      <div class="bar-title">设置你的身份</div>
      <div class="bar-r">
        <button class="ghost-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      </div>
    </header>

    <div class="body">
      <!-- 第 1 步：选身份 -->
      <div v-if="step === 'role'">
        <h1 class="h1">你是？</h1>
        <p class="sub">将决定创建的每个项目是「学校」还是「企业」</p>
        <div class="role-grid">
          <button class="role-card" :class="{ on: role === 'student' }" @click="pick('student')">
            <span class="ricon s">学</span><span class="rn">学生</span><span class="rd">记录校园的每天</span>
          </button>
          <button class="role-card" :class="{ on: role === 'worker' }" @click="pick('worker')">
            <span class="ricon w">职</span><span class="rn">职场人</span><span class="rd">记录工作的每天</span>
          </button>
        </div>
      </div>

      <!-- 第 2 步：建首个项目 -->
      <div v-else class="card">
        <div class="pill">{{ roleText }}</div>
        <h2 class="h2">创建你的第一个{{ roleText === '学生' ? '学校' : '企业' }}</h2>
        <label class="field"><span class="fl">名称</span>
          <input v-model.trim="form.name" class="fi" :placeholder="roleText === '学生' ? '如：中山大学' : '如：某某科技'" />
        </label>
        <label class="field"><span class="fl">{{ roleText === '学生' ? '入学日期' : '入职日期' }}</span>
          <input v-model="form.startDate" type="date" class="fi" />
        </label>
        <p class="err" v-if="error">{{ error }}</p>
        <div class="row">
          <button class="btn primary" :disabled="!form.name.trim() || !form.startDate" @click="finish">
            创建并开始记录
          </button>
        </div>
        <p class="skip" v-if="hasProjects">
          <button class="linkbtn" @click="router.push('/projects')">已有 {{ hasProjects }} 个项目，先不创建 →</button>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const step = ref('role')
const role = ref(user.user?.role || '')
const form = ref({ name: '', startDate: '' })
const error = ref('')
const hasProjects = ref(0)

const roleText = computed(() => (role.value === 'student' ? '学生' : role.value === 'worker' ? '职场人' : ''))

function pick(r) {
  role.value = r
  step.value = 'detail'
}
async function finish() {
  error.value = ''
  try {
    await user.updateProfile({ role: role.value, nickname: user.user?.nickname || '用户' })
    const res = await projectApi.create({ name: form.value.name.trim(), startDate: form.value.startDate })
    router.push('/log/' + (res?.id || res?.project?.id))
  } catch (e) { error.value = e?.error || '创建失败' }
}
const logout = () => { user.logout(); router.push('/login') }

onMounted(async () => {
  if (!user.isLoggedIn) { router.push('/login'); return }
  if (user.user?.role) role.value = user.user.role
  try { const r = await projectApi.list(); const arr = Array.isArray(r) ? r : (r.projects || []); hasProjects.value = arr.length } catch {}
})
</script>

<style scoped>
.onb-screen { min-height: 100vh; background: var(--bg); }
.bar { height: 54px; display: flex; align-items: center; justify-content: space-between; padding: 0 16px; background: var(--surface); border-bottom: 1px solid var(--border); }
.bar-l { width: 120px; }
.back { border: none; background: none; color: var(--accent); font-size: 15px; cursor: pointer; padding: 6px 0; }
.back.ghost { color: var(--text-2); }
.bar-title { font-weight: 700; }
.bar-r { width: 120px; text-align: right; }
.ghost-btn { border: 1px solid var(--border); background: var(--surface); color: var(--text); width: 32px; height: 32px; border-radius: 50%; cursor: pointer; }
.body { max-width: 460px; margin: 0 auto; padding: 40px 20px; }
.h1 { font-size: 26px; }
.sub { color: var(--text-2); font-size: 14px; margin: 6px 0 26px; }
.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.role-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 14px; border-radius: 16px; border: 2px solid var(--border); background: var(--surface); cursor: pointer; }
.role-card.on { border-color: var(--accent); }
.ricon { width: 52px; height: 52px; border-radius: 14px; color: #fff; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.ricon.s { background: #34c759; }
.ricon.w { background: #007aff; }
.rn { font-weight: 600; font-size: 17px; }
.rd { color: var(--text-2); font-size: 12px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.pill { align-self: center; background: var(--surface-2); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--text-2); }
.h2 { font-size: 19px; text-align: center; }
.field { display: flex; flex-direction: column; gap: 6px; }
.fl { font-size: 13px; color: var(--text-2); }
.fi { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; outline: none; }
.err { color: var(--red); font-size: 13px; text-align: center; }
.row { display: flex; }
.btn { flex: 1; padding: 13px; border-radius: 10px; border: none; background: var(--accent); color: #fff; font-size: 15px; cursor: pointer; }
.btn:disabled { opacity: .5; }
.skip { text-align: center; margin-top: 6px; }
.linkbtn { border: none; background: none; color: var(--text-2); font-size: 13px; cursor: pointer; text-decoration: underline; }
</style>
