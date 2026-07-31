import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('ui', () => {
  const menuCollapsed = ref(localStorage.getItem('taobao_menu_collapsed') === '1')
  const toggleMenu = () => {
    menuCollapsed.value = !menuCollapsed.value
    localStorage.setItem('taobao_menu_collapsed', menuCollapsed.value ? '1' : '0')
  }
  return { menuCollapsed, toggleMenu }
})
