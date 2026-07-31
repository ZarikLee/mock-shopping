import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '../api/auth'
import { getLevel } from '../data/achievements'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  // Fix: if userInfo exists but balance is undefined (old users from before currency change)
  if (userInfo.value && userInfo.value.balance === undefined) {
    userInfo.value.balance = 5000
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }
  const isLoggedIn = computed(() => !!token.value)
  const balance = computed(() => userInfo.value?.balance ?? 0)
  const experience = computed(() => userInfo.value?.experience ?? 0)
  const level = computed(() => getLevel(experience.value))
  const achievements = computed(() => userInfo.value?.achievements || [])

  // Auto-fetch user info on startup if token exists
  if (token.value && (!userInfo.value || userInfo.value.balance === undefined)) {
    // Fetch from server to get latest balance
    ;(async () => {
      try {
        const res = await authApi.getMe()
        userInfo.value = res.data || res
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
      } catch {
        token.value = ''
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
      }
    })()
  }

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

  const register = async (username, password, nickname, payPassword) => {
    const res = await authApi.register({ username, password, nickname, payPassword })
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

  const deductBalance = (amount) => {
    if (!userInfo.value) return
    userInfo.value.balance = (userInfo.value.balance || 0) - amount
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  const checkin = async () => {
    const res = await authApi.checkin()
    if (userInfo.value) {
      const amount = res.data?.balance || res?.balance || 0
      userInfo.value.balance = (userInfo.value.balance || 0) + amount
      localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
    }
    return res.data || res
  }

  return {
    token,
    userInfo,
    isLoggedIn,
    balance,
    experience,
    level,
    achievements,
    initDefaultUser,
    login,
    register,
    logout,
    fetchUserInfo,
    deductBalance,
    checkin
  }
})
