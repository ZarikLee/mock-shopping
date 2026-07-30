import { defineStore } from 'pinia'
import { ref } from 'vue'
import { orderApi } from '../api/orders'

export const useOrderStore = defineStore('order', () => {
  const currentOrder = ref(null)

  const ORDER_STATUS = {
    PENDING_PAYMENT: { code: 0, text: '待付款', color: '#ff4400' },
    PAID: { code: 1, text: '已付款', color: '#52c41a' },
    PENDING_SHIP: { code: 2, text: '待发货', color: '#1890ff' },
    SHIPPED: { code: 3, text: '已发货', color: '#722ed1' },
    IN_TRANSIT: { code: 4, text: '运输中', color: '#13c2c2' },
    DELIVERING: { code: 5, text: '派送中', color: '#faad14' },
    DELIVERED: { code: 6, text: '已签收', color: '#52c41a' },
    COMPLETED: { code: 7, text: '已完成', color: '#999999' },
    CANCELLED: { code: 8, text: '已取消', color: '#999999' }
  }

  const createOrder = async (orderData) => {
    const res = await orderApi.create(orderData)
    currentOrder.value = res.data || res
    return currentOrder.value
  }

  const payOrder = async (orderId) => {
    const res = await orderApi.pay(orderId)
    return res.data || res
  }

  const cancelOrder = async (orderId) => {
    const res = await orderApi.cancel(orderId)
    return res.data || res
  }

  const completeOrder = async (orderId) => {
    const res = await orderApi.complete(orderId)
    return res.data || res
  }

  const getOrder = async (orderId) => {
    const res = await orderApi.detail(orderId)
    currentOrder.value = res.data || res
    return currentOrder.value
  }

  const getOrders = async (params = {}) => {
    const res = await orderApi.list(params)
    return res.data || res
  }

  return {
    currentOrder,
    ORDER_STATUS,
    createOrder,
    payOrder,
    cancelOrder,
    completeOrder,
    getOrder,
    getOrders
  }
})
