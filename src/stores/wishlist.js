import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(JSON.parse(localStorage.getItem('wishlistItems') || '[]'))

  const saveToStorage = () => {
    localStorage.setItem('wishlistItems', JSON.stringify(items.value))
  }

  const itemCount = computed(() => items.value.length)

  const isWished = (productId) => {
    return items.value.some(item => item.productId === productId)
  }

  const addToWishlist = (product) => {
    if (isWished(product.id)) return
    items.value.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      shop: product.shop,
      addedAt: Date.now()
    })
    saveToStorage()
  }

  const removeFromWishlist = (productId) => {
    const index = items.value.findIndex(item => item.productId === productId)
    if (index > -1) {
      items.value.splice(index, 1)
      saveToStorage()
    }
  }

  const toggleWish = (product) => {
    if (isWished(product.id)) {
      removeFromWishlist(product.id)
      return false
    } else {
      addToWishlist(product)
      return true
    }
  }

  const clearWishlist = () => {
    items.value = []
    saveToStorage()
  }

  return {
    items,
    itemCount,
    isWished,
    addToWishlist,
    removeFromWishlist,
    toggleWish,
    clearWishlist
  }
})
