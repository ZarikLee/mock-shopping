import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  // 购物车商品列表
  const items = ref(JSON.parse(localStorage.getItem('cartItems') || '[]'))

  // 计算属性
  const itemCount = computed(() => {
    return items.value.reduce((total, item) => total + item.quantity, 0)
  })

  const selectedItems = computed(() => {
    return items.value.filter(item => item.selected)
  })

  const totalPrice = computed(() => {
    return selectedItems.value.reduce((total, item) => {
      return total + item.price * item.quantity
    }, 0)
  })

  const totalOriginalPrice = computed(() => {
    return selectedItems.value.reduce((total, item) => {
      return total + (item.originalPrice || item.price) * item.quantity
    }, 0)
  })

  const totalDiscount = computed(() => {
    return totalOriginalPrice.value - totalPrice.value
  })

  const isSelectedAll = computed(() => {
    return items.value.length > 0 && items.value.every(item => item.selected)
  })

  // 保存到本地存储
  const saveToStorage = () => {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  // 添加商品到购物车
  const addToCart = (product, quantity = 1, selectedSpec = null, selectedColor = null) => {
    const existingItem = items.value.find(item => 
      item.productId === product.id && 
      item.selectedSpec === selectedSpec &&
      item.selectedColor === selectedColor
    )

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      items.value.push({
        id: Date.now(),
        productId: product.id,
        name: product.name,
        price: product.price,
        originalPrice: product.originalPrice,
        image: product.image,
        quantity,
        selectedSpec: selectedSpec || product.specs?.[0] || '',
        selectedColor: selectedColor || product.colors?.[0] || '',
        selected: true,
        shop: product.shop,
        shopId: product.shopId
      })
    }
    saveToStorage()
  }

  // 从购物车移除
  const removeFromCart = (itemId) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      items.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 批量删除选中的商品
  const removeSelected = () => {
    items.value = items.value.filter(item => !item.selected)
    saveToStorage()
  }

  // 清空购物车
  const clearCart = () => {
    items.value = []
    saveToStorage()
  }

  // 更新商品数量
  const updateQuantity = (itemId, quantity) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      saveToStorage()
    }
  }

  // 切换商品选中状态
  const toggleSelected = (itemId) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      item.selected = !item.selected
      saveToStorage()
    }
  }

  // 切换全选状态
  const toggleSelectAll = () => {
    const newState = !isSelectedAll.value
    items.value.forEach(item => {
      item.selected = newState
    })
    saveToStorage()
  }

  // 根据订单移除商品（支付成功后）
  const removeByOrder = (orderItems) => {
    orderItems.forEach(orderItem => {
      const index = items.value.findIndex(item => 
        item.productId === orderItem.productId &&
        item.selectedSpec === orderItem.selectedSpec &&
        item.selectedColor === orderItem.selectedColor
      )
      if (index > -1) {
        items.value.splice(index, 1)
      }
    })
    saveToStorage()
  }

  return {
    items,
    itemCount,
    selectedItems,
    totalPrice,
    totalOriginalPrice,
    totalDiscount,
    isSelectedAll,
    addToCart,
    removeFromCart,
    removeSelected,
    clearCart,
    updateQuantity,
    toggleSelected,
    toggleSelectAll,
    removeByOrder
  }
})
