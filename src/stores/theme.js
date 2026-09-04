import { defineStore } from 'pinia'
import { ref } from 'vue'

const KEY = 'dl_theme'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref(localStorage.getItem(KEY) || (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))

  const apply = () => {
    document.documentElement.setAttribute('data-theme', theme.value)
  }

  const toggle = () => {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
    localStorage.setItem(KEY, theme.value)
    apply()
  }

  apply()

  return { theme, toggle, apply }
})
