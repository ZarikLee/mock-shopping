<template>
  <div class="auth-page">
    <div class="auth-card">
      <div class="auth-header">
        <img src="https://img.alicdn.com/tfs/TB1Zv0gXpY7gK0jSZKzXXaikpXa-520-280.png" alt="logo" class="auth-logo" />
        <h2>{{ isLogin ? '登录' : '注册' }}</h2>
      </div>

      <div class="auth-tabs">
        <span
          :class="{ active: isLogin }"
          @click="isLogin = true"
        >登录</span>
        <span
          :class="{ active: !isLogin }"
          @click="isLogin = false"
        >注册</span>
      </div>

      <el-form
        v-if="isLogin"
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        label-position="top"
        class="auth-form"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="auth-btn"
          :loading="loading"
          @click="handleLogin"
        >登录</el-button>
      </el-form>

      <el-form
        v-else
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        label-position="top"
        class="auth-form"
        @keyup.enter="handleRegister"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="registerForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="请输入昵称"
            :prefix-icon="EditPen"
            size="large"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="请输入密码（至少6位）"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="registerForm.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        <el-button
          type="primary"
          size="large"
          class="auth-btn"
          :loading="loading"
          @click="handleRegister"
        >注册</el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, EditPen } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'

const router = useRouter()
const userStore = useUserStore()

const isLogin = ref(true)
const loading = ref(false)
const loginFormRef = ref(null)
const registerFormRef = ref(null)

const loginForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerForm = reactive({
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  try {
    await loginFormRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await userStore.login(loginForm.username, loginForm.password)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (e) {
    ElMessage.error(e?.message || e?.msg || '登录失败，请检查用户名和密码')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!registerFormRef.value) return
  try {
    await registerFormRef.value.validate()
  } catch {
    return
  }
  loading.value = true
  try {
    await userStore.register(registerForm.username, registerForm.password, registerForm.nickname)
    ElMessage.success('注册成功，请登录')
    isLogin.value = true
    loginForm.username = registerForm.username
    loginForm.password = ''
  } catch (e) {
    ElMessage.error(e?.message || e?.msg || '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: calc(100vh - 130px);
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fff5f0 0%, #fff 50%, #fff5f0 100%);
  padding: 40px 20px;
}

.auth-card {
  width: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(255, 68, 0, 0.08);
  padding: 40px;
}

.auth-header {
  text-align: center;
  margin-bottom: 30px;
}

.auth-logo {
  height: 40px;
  margin-bottom: 16px;
}

.auth-header h2 {
  font-size: 24px;
  font-weight: 600;
  color: #333;
}

.auth-tabs {
  display: flex;
  border-bottom: 2px solid #f0f0f0;
  margin-bottom: 30px;
}

.auth-tabs span {
  flex: 1;
  text-align: center;
  padding: 12px 0;
  font-size: 16px;
  color: #999;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.auth-tabs span.active {
  color: #ff4400;
  font-weight: 600;
}

.auth-tabs span.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 60px;
  height: 2px;
  background: #ff4400;
  border-radius: 1px;
}

.auth-form :deep(.el-form-item__label) {
  font-size: 14px;
  color: #666;
  padding-bottom: 4px;
}

.auth-form :deep(.el-input__wrapper) {
  border-radius: 8px;
  box-shadow: 0 0 0 1px #e8e8e8 inset;
}

.auth-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #ff4400 inset;
}

.auth-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #ff4400 inset;
}

.auth-btn {
  width: 100%;
  margin-top: 8px;
  height: 48px;
  font-size: 16px;
  border-radius: 8px;
  background: #ff4400;
  border-color: #ff4400;
}

.auth-btn:hover {
  background: #ff6600;
  border-color: #ff6600;
}

@media (max-width: 768px) {
  .auth-page {
    min-height: calc(100vh - 90px);
    padding: 20px 12px;
  }

  .auth-card {
    padding: 24px 20px;
  }

  .auth-header h2 {
    font-size: 20px;
  }
}
</style>
