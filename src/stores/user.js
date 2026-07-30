import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const isLoggedIn = computed(() => !!token.value)
  const balance = computed(() => userInfo.value?.balance || 0)
  const points = computed(() => userInfo.value?.points || 0)

  const initDefaultUser = async () => {
    if (!token.value) return
    try {
      const res = await authApi.getMe()
      userInfo.value = res.data || res
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    } catch {
      token.value = ''
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
    }
  }

  const login = async (username, password) => {
    const res = await authApi.login({ username, password })
    const data = res.data || res
    token.value = data.token
    userInfo.value = data.user
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.user))
    return data
  }

  const register = async (username, password, nickname) => {
    const res = await authApi.register({ username, password, nickname })
    return res.data || res
  }

  const logout = () => {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  const fetchUserInfo = async () => {
    const res = await authApi.getMe()
    userInfo.value = res.data || res
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  const checkin = async () => {
    const res = await authApi.checkin()
    if (userInfo.value) {
      userInfo.value.points = (res.data?.points || res?.points || userInfo.value.points)
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
    return res.data || res
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    balance,
    points,
    initDefaultUser,
    login,
    register,
    logout,
    fetchUserInfo,
    checkin
  }
})
