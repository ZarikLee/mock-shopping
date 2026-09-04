import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('dl_token') || '')
  const user = ref(JSON.parse(localStorage.getItem('dl_user') || 'null'))
  const isLoggedIn = computed(() => !!token.value)
  const roleText = computed(() => user.value?.role === 'student' ? '学生' : user.value?.role === 'worker' ? '职场人' : '')

  const setSession = (t, u) => {
    token.value = t
    user.value = u
    localStorage.setItem('dl_token', t)
    localStorage.setItem('dl_user', JSON.stringify(u))
  }

  const login = async (account, password) => {
    const res = await authApi.login({ account, password })
    const data = res.data || res
    setSession(data.token, data.user)
    return data.user
  }

  const register = async (account, password, nickname) => {
    const res = await authApi.register({ account, password, nickname })
    const data = res.data || res
    setSession(data.token, data.user)
    return data.user
  }

  const updateProfile = async (payload) => {
    const res = await authApi.profile(payload)
    user.value = res.user || res.data || res
    localStorage.setItem('dl_user', JSON.stringify(user.value))
    return user.value
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('dl_token')
    localStorage.removeItem('dl_user')
  }

  return { token, user, isLoggedIn, roleText, login, register, updateProfile, logout }
})
