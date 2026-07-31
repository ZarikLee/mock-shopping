import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useShareStore = defineStore('share', () => {
  const showShare = ref(false)
  const shareUrl = ref('')

  const openShare = (url) => {
    shareUrl.value = url || window.location.origin
    showShare.value = true
  }

  const closeShare = () => {
    showShare.value = false
  }

  return { showShare, shareUrl, openShare, closeShare }
})
