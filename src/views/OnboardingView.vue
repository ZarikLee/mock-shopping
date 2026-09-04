<template>
  <div class="screen">
    <button class="theme-btn" @click="theme.toggle">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>

    <div class="content">
      <h1 class="head">选择你的身份</h1>
      <p class="sub">用于创建属于你的学校 / 企业项目</p>

      <div v-if="!chosen" class="role-grid">
        <button class="role-card" :class="{ on: role === 'student' }" @click="role = 'student'">
          <div class="role-icon">学</div>
          <span class="role-name">学生</span>
          <span class="role-desc">记录校园里的每天</span>
        </button>
        <button class="role-card" :class="{ on: role === 'worker' }" @click="role = 'worker'">
          <div class="role-icon work">职</div>
          <span class="role-name">职场人</span>
          <span class="role-desc">记录工作里的每天</span>
        </button>
      </div>

      <div v-else class="create-box">
        <div class="role-summary">{{ role === 'student' ? '学生' : '职场人' }}</div>
        <label class="field">
          <span class="f-label">{{ role === 'student' ? '学校名称' : '企业名称' }}</span>
          <input v-model.trim="name" class="f-input" :placeholder="role === 'student' ? '如：中山大学' : '如：某某科技'" />
        </label>
        <label class="field">
          <span class="f-label">{{ role === 'student' ? '入学日期' : '入职日期' }}</span>
          <input v-model="startDate" type="date" class="f-input" />
        </label>
        <div class="btns">
          <button class="ghost" @click="back">上一步</button>
          <button class="primary" :disabled="!canCreate" @click="finish">开始记录</button>
        </div>
        <p class="err" v-if="error">{{ error }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const role = ref('')
const chosen = ref(false)
const name = ref('')
const startDate = ref('')
const error = ref('')

const canCreate = computed(() => name.value.trim() && startDate.value)

const back = () => { chosen.value = false; role.value = '' }

const finish = async () => {
  error.value = ''
  try {
    await user.updateProfile({ role: role.value, nickname: user.user?.nickname })
    await projectApi.create({ name: name.value.trim(), startDate: startDate.value })
    router.push('/projects')
  } catch (e) {
    error.value = e?.error || '创建失败'
  }
}
</script>

<style scoped>
.screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; position: relative; }
.theme-btn { position: fixed; top: 18px; right: 18px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 18px; cursor: pointer; }
.content { width: 100%; max-width: 440px; text-align: center; }
.head { font-size: 26px; font-weight: 700; }
.sub { color: var(--text-2); font-size: 14px; margin: 8px 0 30px; }
.role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.role-card { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 30px 16px; border-radius: 16px; border: 2px solid var(--border); background: var(--surface); cursor: pointer; transition: all .2s; }
.role-card:hover { transform: translateY(-2px); }
.role-card.on { border-color: var(--accent); }
.role-icon { width: 52px; height: 52px; border-radius: 14px; background: #34c759; color: #fff; font-size: 24px; display: flex; align-items: center; justify-content: center; }
.role-icon.work { background: #007aff; }
.role-name { font-size: 17px; font-weight: 600; }
.role-desc { font-size: 12px; color: var(--text-2); }
.create-box { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 24px; text-align: left; display: flex; flex-direction: column; gap: 16px; }
.role-summary { align-self: center; background: var(--surface-2); padding: 4px 14px; border-radius: 20px; font-size: 13px; color: var(--text-2); }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; outline: none; }
.f-input:focus { border-color: var(--accent); }
.btns { display: flex; gap: 10px; margin-top: 4px; }
.btns button { flex: 1; padding: 13px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
.primary { background: var(--accent); border: none; color: #fff; }
.primary:disabled { opacity: .5; cursor: not-allowed; }
.err { color: var(--red); font-size: 13px; text-align: center; }
</style>
