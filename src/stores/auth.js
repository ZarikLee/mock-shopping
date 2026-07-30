import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const showLogin = ref(false)
  const showRegister = ref(false)

  const openLogin = () => {
    showRegister.value = false
    showLogin.value = true
  }

  const openRegister = () => {
    showLogin.value = false
    showRegister.value = true
  }

  const closeAuth = () => {
    showLogin.value = false
    showRegister.value = false
  }

  return {
    showLogin,
    showRegister,
    openLogin,
    openRegister,
    closeAuth
  }
})
