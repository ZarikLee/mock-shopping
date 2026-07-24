import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useOrderStore = defineStore('order', () => {
  // 订单列表
  const orders = ref(JSON.parse(localStorage.getItem('orders') || '[]'))

  // 订单状态枚举
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

  // 生成订单号
  const generateOrderNo = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    return `${year}${month}${day}${hours}${minutes}${seconds}${random}`
  }

  // 保存到本地存储
  const saveToStorage = () => {
    localStorage.setItem('orders', JSON.stringify(orders.value))
  }

  // 创建订单
  const createOrder = (orderData) => {
    const order = {
      id: Date.now(),
      orderNo: generateOrderNo(),
      status: ORDER_STATUS.PENDING_PAYMENT,
      items: orderData.items,
      totalAmount: orderData.totalAmount,
      discountAmount: orderData.discountAmount || 0,
      payAmount: orderData.payAmount,
      address: orderData.address,
      coupon: orderData.coupon || null,
      createTime: new Date().toISOString(),
      payTime: null,
      shipTime: null,
      deliverTime: null,
      completeTime: null,
      logistics: {
        company: '顺丰速运',
        no: 'SF' + generateOrderNo(),
        status: [],
        currentLocation: ''
      }
    }

    orders.value.unshift(order)
    saveToStorage()
    return order
  }

  // 支付订单
  const payOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.PAID
      order.payTime = new Date().toISOString()
      order.logistics.status.push({
        time: order.payTime,
        status: '订单已支付',
        location: '系统'
      })

      // 模拟发货（3秒后）
      setTimeout(() => {
        shipOrder(orderId)
      }, 3000)

      saveToStorage()
      return true
    }
    return false
  }

  // 发货
  const shipOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.SHIPPED
      order.shipTime = new Date().toISOString()
      order.logistics.status.push({
        time: order.shipTime,
        status: '商家已发货',
        location: order.address.province + order.address.city
      })
      order.logistics.currentLocation = order.address.province + order.address.city

      // 模拟运输（5秒后）
      setTimeout(() => {
        transitOrder(orderId)
      }, 5000)

      saveToStorage()
    }
  }

  // 运输中
  const transitOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.IN_TRANSIT
      order.logistics.status.push({
        time: new Date().toISOString(),
        status: '快件已到达【深圳转运中心】',
        location: '深圳'
      })
      order.logistics.currentLocation = '深圳转运中心'

      // 模拟派送（5秒后）
      setTimeout(() => {
        deliveringOrder(orderId)
      }, 5000)

      saveToStorage()
    }
  }

  // 派送中
  const deliveringOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.DELIVERING
      order.logistics.status.push({
        time: new Date().toISOString(),
        status: '快件正在派送中',
        location: order.address.city + order.address.district
      })
      order.logistics.currentLocation = order.address.city + order.address.district

      // 模拟签收（5秒后）
      setTimeout(() => {
        deliverOrder(orderId)
      }, 5000)

      saveToStorage()
    }
  }

  // 签收
  const deliverOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.DELIVERED
      order.deliverTime = new Date().toISOString()
      order.logistics.status.push({
        time: order.deliverTime,
        status: '快件已签收，签收人：本人',
        location: order.address.province + order.address.city + order.address.district
      })
      order.logistics.currentLocation = '已签收'

      saveToStorage()
    }
  }

  // 完成订单（评价后）
  const completeOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order) {
      order.status = ORDER_STATUS.COMPLETED
      order.completeTime = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  // 取消订单
  const cancelOrder = (orderId) => {
    const order = orders.value.find(o => o.id === orderId)
    if (order && order.status.code <= 1) {
      order.status = ORDER_STATUS.CANCELLED
      saveToStorage()
      return true
    }
    return false
  }

  // 获取订单
  const getOrder = (orderId) => {
    return orders.value.find(o => o.id === orderId)
  }

  // 获取订单列表（按状态筛选）
  const getOrders = (status = null) => {
    if (status === null) {
      return orders.value
    }
    return orders.value.filter(o => o.status.code === status)
  }

  return {
    orders,
    ORDER_STATUS,
    createOrder,
    payOrder,
    shipOrder,
    cancelOrder,
    completeOrder,
    getOrder,
    getOrders
  }
})
