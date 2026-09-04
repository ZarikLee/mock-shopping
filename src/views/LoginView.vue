<template>
  <div class="auth-screen">
    <button class="theme-btn" @click="theme.toggle" :title="theme.theme === 'dark' ? '切换到日间' : '切换到暗色'">
      {{ theme.theme === 'dark' ? '☀' : '☾' }}
    </button>

    <div class="auth-card">
      <div class="logo-mark">记</div>
      <h1 class="title">每日记录</h1>
      <p class="subtitle">像写日记一样，记录每天的 todo</p>

      <div class="tabs">
        <button :class="['tab', { active: mode === 'login' }]" @click="mode = 'login'">登录</button>
        <button :class="['tab', { active: mode === 'register' }]" @click="mode = 'register'">注册</button>
      </div>

      <form @submit.prevent="submit" class="form">
        <label class="field">
          <span class="f-label">账号</span>
          <input v-model.trim="form.account" class="f-input" placeholder="输入账号" autocomplete="username" />
        </label>
        <label v-if="mode === 'register'" class="field">
          <span class="f-label">昵称</span>
          <input v-model.trim="form.nickname" class="f-input" placeholder="怎么称呼你" />
        </label>
        <label class="field">
          <span class="f-label">密码</span>
          <input v-model="form.password" type="password" class="f-input" placeholder="输入密码" autocomplete="current-password" />
        </label>
        <button class="submit-btn" :disabled="loading" :class="{ loading }">
          {{ mode === 'login' ? '登录' : '注册' }}
        </button>
      </form>
      <p class="err" v-if="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const form = reactive({ account: '', nickname: '', password: '' })

const submit = async () => {
  error.value = ''
  if (!form.account || !form.password) { error.value = '请输入账号和密码'; return }
  loading.value = true
  try {
    const u = mode.value === 'login'
      ? await user.login(form.account, form.password)
      : await user.register(form.account, form.password, form.nickname || form.account)
    router.push(u.role ? '/projects' : '/onboarding')
  } catch (e) {
    error.value = e?.error || (mode.value === 'login' ? '登录失败' : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; padding: 20px; }
.theme-btn { position: fixed; top: 18px; right: 18px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 18px; cursor: pointer; transition: all .2s; }
.auth-card { width: 100%; max-width: 360px; text-align: center; }
.logo-mark { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 16px; background: var(--accent); color: #fff; font-size: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,122,255,.3); }
.title { font-size: 26px; font-weight: 700; letter-spacing: .5px; }
.subtitle { color: var(--text-2); font-size: 14px; margin: 6px 0 30px; }
.tabs { display: flex; background: var(--surface-2); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
.tab { flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-2); font-size: 14px; border-radius: 8px; cursor: pointer; transition: all .2s; }
.tab.active { background: var(--surface); color: var(--text); font-weight: 600; box-shadow: var(--shadow); }
.form { text-align: left; display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; outline: none; transition: border .2s; }
.f-input:focus { border-color: var(--accent); }
.submit-btn { margin-top: 6px; padding: 14px; border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
.submit-btn:hover { opacity: .9; }
.submit-btn.loading { opacity: .6; }
.err { color: var(--red); font-size: 13px; margin-top: 12px; text-align: center; }
</style>
