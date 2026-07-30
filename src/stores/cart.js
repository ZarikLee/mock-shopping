import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { orderApi } from '../api/orders'

export const useCartStore = defineStore('cart', () => {
  const items = ref(JSON.parse(localStorage.getItem('cartItems') || '[]'))

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

  const saveToStorage = () => {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

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

  const removeFromCart = (itemId) => {
    const index = items.value.findIndex(item => item.id === itemId)
    if (index > -1) {
      items.value.splice(index, 1)
      saveToStorage()
    }
  }

  const removeSelected = () => {
    items.value = items.value.filter(item => !item.selected)
    saveToStorage()
  }

  const clearCart = () => {
    items.value = []
    saveToStorage()
  }

  const updateQuantity = (itemId, quantity) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      item.quantity = Math.max(1, quantity)
      saveToStorage()
    }
  }

  const toggleSelected = (itemId) => {
    const item = items.value.find(item => item.id === itemId)
    if (item) {
      item.selected = !item.selected
      saveToStorage()
    }
  }

  const toggleSelectAll = () => {
    const newState = !isSelectedAll.value
    items.value.forEach(item => {
      item.selected = newState
    })
    saveToStorage()
  }

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

  const buyNow = async (product, quantity, selectedSpec, selectedColor) => {
    const orderData = {
      items: [{
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
        selectedSpec: selectedSpec || '',
        selectedColor: selectedColor || '',
        shop: product.shop,
        shopId: product.shopId
      }],
      totalAmount: product.price * quantity,
      discountAmount: 0,
      payAmount: product.price * quantity
    }
    const res = await orderApi.create(orderData)
    return res.data || res
  }

  const checkout = async (address, coupon) => {
    const orderData = {
      items: selectedItems.value.map(item => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        selectedSpec: item.selectedSpec,
        selectedColor: item.selectedColor,
        shop: item.shop,
        shopId: item.shopId
      })),
      address,
      coupon: coupon || null,
      totalAmount: totalOriginalPrice.value,
      discountAmount: totalDiscount.value + (coupon?.amount || 0),
      payAmount: totalPrice.value - (coupon?.amount || 0)
    }
    const res = await orderApi.create(orderData)
    return res.data || res
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
    removeByOrder,
    buyNow,
    checkout
  }
})
