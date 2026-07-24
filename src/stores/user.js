import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useUserStore = defineStore('user', () => {
  // 状态
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || 'null'))
  const isLoggedIn = computed(() => !!userInfo.value)
  const balance = computed(() => userInfo.value?.balance || 0)
  const points = computed(() => userInfo.value?.points || 0)

  // 初始化默认用户
  const initDefaultUser = () => {
    if (!userInfo.value) {
      userInfo.value = {
        id: 1,
        nickname: '模拟用户',
        avatar: 'https://picsum.photos/100/100?random=100',
        phone: '138****8888',
        email: 'user@example.com',
        balance: 10000,
        points: 5000,
        coupons: [
          { id: 1, name: '新人券', amount: 50, minConsume: 200, expireTime: '2026-12-31' },
          { id: 2, name: '满减券', amount: 100, minConsume: 500, expireTime: '2026-12-31' }
        ],
        addresses: [
          {
            id: 1,
            name: '张三',
            phone: '13888888888',
            province: '广东省',
            city: '深圳市',
            district: '南山区',
            detail: '科技园南路88号',
            isDefault: true
          },
          {
            id: 2,
            name: '李四',
            phone: '13999999999',
            province: '北京市',
            city: '北京市',
            district: '朝阳区',
            detail: '望京SOHO T1',
            isDefault: false
          }
        ]
      }
      saveUserInfo()
    }
  }

  // 保存用户信息到本地存储
  const saveUserInfo = () => {
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  // 登录（模拟）
  const login = (phone, code) => {
    // 模拟登录验证
    if (phone && code) {
      initDefaultUser()
      return { success: true, message: '登录成功' }
    }
    return { success: false, message: '请输入手机号和验证码' }
  }

  // 登出
  const logout = () => {
    userInfo.value = null
    localStorage.removeItem('userInfo')
  }

  // 扣除余额
  const deductBalance = (amount) => {
    if (userInfo.value && userInfo.value.balance >= amount) {
      userInfo.value.balance -= amount
      saveUserInfo()
      return true
    }
    return false
  }

  // 增加积分
  const addPoints = (amount) => {
    if (userInfo.value) {
      userInfo.value.points += amount
      saveUserInfo()
    }
  }

  // 使用优惠券
  const useCoupon = (couponId) => {
    if (userInfo.value) {
      const index = userInfo.value.coupons.findIndex(c => c.id === couponId)
      if (index > -1) {
        return userInfo.value.coupons.splice(index, 1)[0]
      }
    }
    return null
  }

  // 添加地址
  const addAddress = (address) => {
    if (userInfo.value) {
      address.id = Date.now()
      if (address.isDefault) {
        userInfo.value.addresses.forEach(a => a.isDefault = false)
      }
      userInfo.value.addresses.push(address)
      saveUserInfo()
      return address
    }
    return null
  }

  // 更新地址
  const updateAddress = (address) => {
    if (userInfo.value) {
      const index = userInfo.value.addresses.findIndex(a => a.id === address.id)
      if (index > -1) {
        if (address.isDefault) {
          userInfo.value.addresses.forEach(a => a.isDefault = false)
        }
        userInfo.value.addresses[index] = address
        saveUserInfo()
        return true
      }
    }
    return false
  }

  // 删除地址
  const deleteAddress = (addressId) => {
    if (userInfo.value) {
      const index = userInfo.value.addresses.findIndex(a => a.id === addressId)
      if (index > -1) {
        userInfo.value.addresses.splice(index, 1)
        saveUserInfo()
        return true
      }
    }
    return false
  }

  // 初始化
  initDefaultUser()

  return {
    userInfo,
    isLoggedIn,
    balance,
    points,
    login,
    logout,
    deductBalance,
    addPoints,
    useCoupon,
    addAddress,
    updateAddress,
    deleteAddress
  }
})
