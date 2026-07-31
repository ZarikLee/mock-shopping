<template>
  <div class="user-center-page">
    <div class="user-back">
      <BackButton />
    </div>
    <div class="user-layout">
      <aside class="user-sidebar">
        <div class="profile-card">
          <div class="avatar-wrapper" @click="cycleAvatar">
            <img :src="userStore.userInfo?.avatar || defaultAvatar" alt="avatar" />
            <div class="avatar-overlay"><el-icon :size="20"><Camera /></el-icon></div>
          </div>
          <div class="profile-header-info">
            <div class="nickname-row">
              <span class="nickname">{{ userStore.userInfo?.nickname || '未登录' }}</span>
              <el-tag :type="levelType" size="small" effect="dark" class="level-badge">{{ levelName }}</el-tag>
              <span class="exp-badge">Lv.{{ userStore.level }}</span>
            </div>
            <div class="profile-uid">
              <el-icon><User /></el-icon>
              <span>ID: {{ userStore.userInfo?.id || '——' }}</span>
            </div>
            <div class="exp-progress-block">
              <div class="exp-progress-info">
                <span>经验值 {{ userStore.experience }} / {{ nextThreshold }}</span>
                <span class="achievements-count" @click="goAchievements">
                  <el-icon><Trophy /></el-icon> {{ unlockedCount }}/{{ totalCount }} 成就
                </span>
              </div>
              <el-progress
                :percentage="levelProgress"
                :stroke-width="8"
                color="#ff4400"
                :show-text="false"
              />
            </div>
          </div>
          <div class="profile-stats">
            <div class="stat-item" @click="switchMenu('balance')">
              <span class="stat-value">¥{{ userStore.balance.toFixed(2) }}</span>
              <span class="stat-label">余额</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-value">{{ userStore.userInfo?.coupons?.length || 0 }}</span>
              <span class="stat-label">优惠券</span>
            </div>
          </div>
          <el-button class="edit-profile-btn" text @click="showEditDialog = true">
            <el-icon><Edit /></el-icon> 编辑资料
          </el-button>
        </div>

        <div class="menu-list">
          <div
            v-for="item in menuList"
            :key="item.key"
            class="menu-item"
            :class="{ active: currentMenu === item.key }"
            @click="handleMenuClick(item)"
          >
            <el-icon class="menu-icon"><component :is="item.icon" /></el-icon>
            <span class="menu-label">{{ item.label }}</span>
            <el-icon class="menu-arrow"><ArrowRight /></el-icon>
          </div>
        </div>
      </aside>

      <main class="user-content">
        <div class="order-quick-access">
          <div class="order-header">
            <span class="order-title">我的订单</span>
            <span class="order-all" @click="goOrders()">全部订单 <el-icon><ArrowRight /></el-icon></span>
          </div>
          <div class="order-status-row">
            <div class="status-item" v-for="s in orderStatuses" :key="s.key" @click="goOrders(s.status)">
              <el-badge :value="s.count" :hidden="!s.count" :max="99" class="status-badge">
                <div class="status-icon-wrap" :style="{ background: s.bg }">
                  <el-icon :size="22" color="#fff"><component :is="s.icon" /></el-icon>
                </div>
              </el-badge>
              <span class="status-label">{{ s.label }}</span>
            </div>
          </div>
        </div>

        <div class="dynamic-section">
          <div v-if="currentMenu === 'balance'" class="section-card balance-section">
            <h3 class="section-title">账户余额</h3>
            <div class="balance-hero">
              <div class="balance-amount">
                <span class="balance-label">可用余额</span>
                <span class="balance-number"><small>¥</small>{{ userStore.balance.toFixed(2).split('.')[0] }}<small>.{{ userStore.balance.toFixed(2).split('.')[1] }}</small></span>
              </div>

            </div>
            <el-divider />
            <h4 class="sub-title">交易记录</h4>
            <div class="transaction-list">
              <div v-for="(t, i) in transactions" :key="i" class="transaction-item">
                <div class="tx-left">
                  <span class="tx-desc">{{ t.desc }}</span>
                  <span class="tx-time">{{ t.time }}</span>
                </div>
                <span class="tx-amount" :class="t.type">{{ t.type === 'income' ? '+' : '-' }}¥{{ t.amount.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div v-if="currentMenu === 'profile'" class="section-card">
            <h3 class="section-title">个人信息</h3>
            <el-form :model="profileForm" label-width="80px" class="profile-form">
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" disabled />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" placeholder="请输入邮箱" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <div v-if="currentMenu === 'address'" class="section-card">
            <h3 class="section-title">
              收货地址
              <el-button type="primary" size="small" @click="openAddressDialog(null)">+ 新增地址</el-button>
            </h3>
            <div v-if="addresses.length" class="address-list">
              <div v-for="addr in addresses" :key="addr.id" class="address-card">
                <div class="address-top">
                  <div class="address-name">
                    <span class="name">{{ addr.name }}</span>
                    <span class="phone">{{ addr.phone }}</span>
                    <el-tag v-if="addr.isDefault" type="danger" size="small" effect="dark">默认</el-tag>
                  </div>
                </div>
                <p class="address-detail">{{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}</p>
                <div class="address-actions">
                  <el-button type="primary" link @click="openAddressDialog(addr)">编辑</el-button>
                  <el-button type="danger" link @click="deleteAddress(addr.id)">删除</el-button>
                  <el-button v-if="!addr.isDefault" type="warning" link @click="setDefaultAddress(addr.id)">设为默认</el-button>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon :size="48"><Location /></el-icon>
              <p>暂无地址，请添加</p>
            </div>
          </div>

          <div v-if="currentMenu === 'coupon'" class="section-card">
            <h3 class="section-title">我的优惠券</h3>
            <div v-if="coupons.length" class="coupon-list">
              <div v-for="c in coupons" :key="c.id" class="coupon-card">
                <div class="coupon-left">
                  <span class="coupon-amount">¥{{ c.amount }}</span>
                  <span class="coupon-condition">满{{ c.minConsume }}可用</span>
                </div>
                <div class="coupon-right">
                  <span class="coupon-name">{{ c.name }}</span>
                  <span class="coupon-expire">有效期至 {{ c.expireTime }}</span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon :size="48"><Ticket /></el-icon>
              <p>暂无可用优惠券</p>
            </div>
          </div>

          <div v-if="currentMenu === 'wishlist'" class="section-card">
            <h3 class="section-title">我的收藏</h3>
            <div v-if="wishlistStore.items.length" class="wishlist-grid">
              <div v-for="item in wishlistStore.items" :key="item.productId" class="wishlist-item">
                <img :src="item.image" :alt="item.name" class="wishlist-image" />
                <div class="wishlist-info">
                  <span class="wishlist-name">{{ item.name }}</span>
                  <span class="wishlist-price">¥{{ item.price }}</span>
                </div>
                <el-button type="danger" size="small" circle @click="wishlistStore.removeFromWishlist(item.productId)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon :size="48"><Star /></el-icon>
              <p>暂无收藏商品</p>
            </div>
          </div>

          <div v-if="currentMenu === 'purchased'" class="section-card">
            <h3 class="section-title">我的已购商品</h3>
            <div v-if="purchasedProducts.length" class="purchased-grid">
              <div
                v-for="p in purchasedProducts"
                :key="p.productId + '-' + p.purchaseTime"
                class="purchased-item"
                @click="goProduct(p.productId)"
              >
                <img :src="p.image" :alt="p.name" class="purchased-image" />
                <div class="purchased-info">
                  <span class="purchased-name">{{ p.name }}</span>
                  <span class="purchased-date">购买日期：{{ formatDate(p.purchaseTime) }}</span>
                  <span class="purchased-price">¥{{ p.price }}<small> ×{{ p.quantity }}</small></span>
                </div>
              </div>
            </div>
            <div v-else class="empty-state">
              <el-icon :size="48"><ShoppingBag /></el-icon>
              <p>暂无已购商品</p>
            </div>
          </div>

          <div v-if="currentMenu === 'checkin'" class="section-card checkin-section">
            <h3 class="section-title">每日签到</h3>
            <div class="checkin-content">
              <div class="checkin-circle" :class="{ checked: checkedIn }" @click="doCheckin">
                <el-icon v-if="checkedIn" :size="36"><CircleCheck /></el-icon>
                <span v-else class="checkin-text">签到<br/><small>+金币</small></span>
              </div>
              <p class="checkin-tip">{{ checkedIn ? '今日已签到' : '点击签到获取金币' }}</p>
            </div>
          </div>
        </div>
      </main>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑资料" width="520px" :close-on-click-modal="false" destroy-on-close>
      <div class="edit-avatar-row">
        <div class="edit-avatar" @click="cycleAvatar">
          <img :src="userStore.userInfo?.avatar || defaultAvatar" alt="avatar" />
          <div class="edit-avatar-overlay"><el-icon :size="20"><Camera /></el-icon></div>
        </div>
        <span class="edit-avatar-hint">点击头像切换</span>
      </div>
      <el-form :model="editForm" label-width="80px" class="edit-form">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="editForm.gender">
            <el-radio value="male">男</el-radio>
            <el-radio value="female">女</el-radio>
            <el-radio value="">保密</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="editForm.birthday" type="date" placeholder="选择日期" style="width:100%" value-format="YYYY-MM-DD" />
        </el-form-item>
        <el-form-item label="家乡">
          <el-input v-model="editForm.homeCity" placeholder="请输入家乡城市" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" placeholder="介绍一下自己吧" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEditProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddressDialog" :title="editingAddress ? '编辑地址' : '新增地址'" width="520px" destroy-on-close>
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所在地区">
          <AddressPicker :model-value="addressForm" @update:model-value="onAddressChange" />
        </el-form-item>
        <el-form-item label="默认地址">
          <el-switch v-model="addressForm.isDefault" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddressDialog = false">取消</el-button>
        <el-button type="primary" @click="saveAddress">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  User, Edit, ArrowRight, Camera, CircleCheck,
  Wallet, Van, Position, ChatLineSquare, Box,
  List, Location, Ticket, Star, Check, Delete, ShoppingBag, Medal
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import BackButton from '../../components/BackButton/index.vue'
import AddressPicker from '../../components/AddressPicker/index.vue'
import { useUserStore } from '../../stores/user'
import { useOrderStore } from '../../stores/order'
import { useWishlistStore } from '../../stores/wishlist'
import api from '../../api'
import { addressApi } from '../../api/addresses'
import { authApi } from '../../api/auth'
import { ACHIEVEMENTS, getLevelProgress } from '../../data/achievements'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const orderStore = useOrderStore()
const wishlistStore = useWishlistStore()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'
const avatarList = [
  'https://picsum.photos/id/1/200',
  'https://picsum.photos/id/20/200',
  'https://picsum.photos/id/30/200',
  'https://picsum.photos/id/40/200',
  'https://picsum.photos/id/50/200',
  'https://picsum.photos/id/60/200',
]
let avatarIndex = 0

const cycleAvatar = () => {
  avatarIndex = (avatarIndex + 1) % avatarList.length
  if (userStore.userInfo) {
    userStore.userInfo.avatar = avatarList[avatarIndex]
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
}

const levelConfig = [
  { min: 0, name: '普通会员', type: 'info' },
  { min: 100, name: '银牌会员', type: 'success' },
  { min: 500, name: '金牌会员', type: 'warning' },
  { min: 2000, name: '钻石会员', type: 'danger' },
]
const levelName = computed(() => {
  const pts = userStore.balance
  let name = '普通会员'
  for (const l of levelConfig) {
    if (pts >= l.min) name = l.name
  }
  return name
})
const levelType = computed(() => {
  const pts = userStore.balance
  let t = 'info'
  for (const l of levelConfig) {
    if (pts >= l.min) t = l.type
  }
  return t
})

const levelProgress = computed(() => {
  return getLevelProgress(userStore.experience).progress
})

const nextThreshold = computed(() => {
  return getLevelProgress(userStore.experience).nextThreshold
})

const unlockedCount = computed(() => {
  return ACHIEVEMENTS.filter((a) => userStore.achievements.includes(a.id)).length
})

const totalCount = ACHIEVEMENTS.length

const goAchievements = () => {
  router.push('/achievements')
}

const currentMenu = ref('profile')

const menuList = [
  { key: 'profile', label: '个人信息', icon: User },
  { key: 'orders', label: '我的订单', icon: List, link: '/orders' },
  { key: 'purchased', label: '我的已购商品', icon: ShoppingBag },
  { key: 'achievements', label: '我的成就', icon: Medal, link: '/achievements' },
  { key: 'address', label: '收货地址', icon: Location },
  { key: 'coupon', label: '我的优惠券', icon: Ticket },
  { key: 'wishlist', label: '我的收藏', icon: Star },
  { key: 'balance', label: '账户余额', icon: Wallet },
  { key: 'checkin', label: '每日签到', icon: Check },
]

const handleMenuClick = (item) => {
  if (item.link) {
    router.push(item.link)
    return
  }
  if (item.key === 'checkin') {
    doCheckin()
    return
  }
  currentMenu.value = item.key
}

const goOrders = (status) => {
  const query = status !== undefined ? { status } : {}
  router.push({ path: '/orders', query })
}

const orderStatuses = computed(() => {
  const orders = orderStore.orders || []
  const count = (code) => orders.filter(o => o.status === code).length
  return [
    { key: 'pay', label: '待付款', status: 0, icon: Wallet, bg: '#ff4400', count: count(0) },
    { key: 'ship', label: '待发货', status: 2, icon: Van, bg: '#1890ff', count: count(2) },
    { key: 'receive', label: '待收货', status: 3, icon: Position, bg: '#722ed1', count: count(3) },
    { key: 'review', label: '待评价', status: 7, icon: ChatLineSquare, bg: '#52c41a', count: count(7) },
    { key: 'refund', label: '退款/售后', status: 8, icon: Box, bg: '#fa8c16', count: count(8) },
  ]
})

const showEditDialog = ref(false)
const editForm = reactive({
  nickname: '',
  phone: '',
  email: '',
  gender: '',
  birthday: '',
  bio: '',
  homeCity: '',
})

const openEditDialog = () => {
  const u = userStore.userInfo || {}
  editForm.nickname = u.nickname || ''
  editForm.phone = u.phone || ''
  editForm.email = u.email || ''
  editForm.gender = u.gender || ''
  editForm.birthday = u.birthday || ''
  editForm.bio = u.bio || ''
  editForm.homeCity = u.homeCity || ''
  showEditDialog.value = true
}

const saveEditProfile = async () => {
  if (!userStore.userInfo) return
  Object.assign(userStore.userInfo, {
    nickname: editForm.nickname,
    phone: editForm.phone,
    email: editForm.email,
    gender: editForm.gender,
    birthday: editForm.birthday,
    bio: editForm.bio,
    homeCity: editForm.homeCity,
  })
  localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  try {
    await api.put('/auth/profile', {
      nickname: editForm.nickname,
      phone: editForm.phone,
      email: editForm.email,
      gender: editForm.gender,
      birthday: editForm.birthday,
      bio: editForm.bio,
      homeCity: editForm.homeCity,
    })
  } catch {
    // server may not have this endpoint; local update is enough
  }
  showEditDialog.value = false
  ElMessage.success('保存成功')
}

const profileForm = reactive({
  nickname: '',
  phone: '',
  email: '',
})
const saveProfile = () => {
  if (!userStore.userInfo) return
  userStore.userInfo.nickname = profileForm.nickname
  userStore.userInfo.email = profileForm.email
  localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  try {
    api.put('/auth/profile', { nickname: profileForm.nickname, email: profileForm.email })
  } catch { /* ok */ }
  ElMessage.success('保存成功')
}

const addresses = computed(() => userStore.userInfo?.addresses || [])
const coupons = computed(() => userStore.userInfo?.coupons || [])

const purchasedProducts = computed(() => {
  const orders = orderStore.orders || []
  const products = []
  orders
    .filter(o => o.status && o.status.code >= 1 && o.status.code < 8)
    .forEach(o => {
      (o.items || []).forEach(item => {
        products.push({
          productId: item.productId,
          image: item.image,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          purchaseTime: o.payTime || o.createTime,
        })
      })
    })
  return products
})

const formatDate = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const goProduct = (productId) => {
  router.push(`/product/${productId}`)
}
const showAddressDialog = ref(false)
const editingAddress = ref(null)
const addressForm = reactive({ name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false })

const openAddressDialog = (addr) => {
  editingAddress.value = addr
  if (addr) {
    Object.assign(addressForm, {
      name: addr.name, phone: addr.phone, province: addr.province,
      city: addr.city, district: addr.district, detail: addr.detail, isDefault: addr.isDefault,
    })
  } else {
    Object.assign(addressForm, { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false })
  }
  showAddressDialog.value = true
}

const onAddressChange = (val) => {
  Object.assign(addressForm, val)
}

const saveAddress = async () => {
  try {
    const isEdit = !!editingAddress.value
    if (isEdit) {
      await addressApi.update(editingAddress.value.id, { ...addressForm })
    } else {
      await addressApi.create({ ...addressForm })
    }
    showAddressDialog.value = false
    editingAddress.value = null
    await userStore.fetchUserInfo()
    ElMessage.success(isEdit ? '地址更新成功' : '地址添加成功')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const deleteAddress = async (id) => {
  try {
    await addressApi.delete(id)
    await userStore.fetchUserInfo()
    ElMessage.success('已删除')
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

const setDefaultAddress = async (id) => {
  try {
    await addressApi.setDefault(id)
    await userStore.fetchUserInfo()
    ElMessage.success('已设为默认')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const checkedIn = ref(false)
const doCheckin = async () => {
  if (checkedIn.value) {
    ElMessage.info('今日已签到')
    return
  }
  try {
    const res = await userStore.checkin()
    checkedIn.value = true
    const pts = res.balance || 0
    ElMessage.success(pts ? `签到成功！获得 ${pts} 金币` : '签到成功！获得金币')
  } catch (e) {
    const err = e?.error || e?.message || ''
    if (String(err).toLowerCase().includes('already')) {
      checkedIn.value = true
      ElMessage.info('今日已签到')
    } else {
      ElMessage.error('签到失败，请稍后再试')
    }
  }
}

const loadCheckinStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await authApi.getCheckinStatus()
    checkedIn.value = res.checkedIn
  } catch {}
}

const transactions = [
  { desc: '购买商品 - 华为 MatePad 11', time: '2026-07-28 14:32', amount: 3299.00, type: 'expense' },
  { desc: '余额充值', time: '2026-07-25 09:15', amount: 5000.00, type: 'income' },
  { desc: '购买商品 - 罗技 MX Master 3', time: '2026-07-20 16:48', amount: 699.00, type: 'expense' },
  { desc: '订单退款 - 商品已取消', time: '2026-07-18 11:20', amount: 199.00, type: 'income' },
  { desc: '签到奖励金币', time: '2026-07-15 08:00', amount: 0, type: 'income', pointsText: '+10金币' },
  { desc: '购买商品 - Apple AirPods Pro', time: '2026-07-12 20:05', amount: 1799.00, type: 'expense' },
  { desc: '余额充值', time: '2026-07-01 10:30', amount: 2000.00, type: 'income' },
]

const switchMenu = (key) => { currentMenu.value = key }

const fetchOrders = async () => {
  try {
    await orderStore.getOrders()
  } catch { /* ok */ }
}

onMounted(() => {
  document.title = '个人中心 - 淘大宝'
  if (userStore.userInfo) {
    profileForm.nickname = userStore.userInfo.nickname || ''
    profileForm.phone = userStore.userInfo.phone || ''
    profileForm.email = userStore.userInfo.email || ''
  }
  if (route.query.menu) {
    currentMenu.value = route.query.menu
  }
  loadCheckinStatus()
  fetchOrders()
})
</script>

<style scoped>
.user-center-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px 0;
}

.user-back {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.user-layout {
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.user-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 28px 24px 20px;
  margin-bottom: 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.avatar-wrapper {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto 14px;
  cursor: pointer;
  border-radius: 50%;
  border: 3px solid #ff4400;
  overflow: hidden;
}

.avatar-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
  color: #fff;
}

.avatar-wrapper:hover .avatar-overlay {
  opacity: 1;
}

.profile-header-info {
  margin-bottom: 16px;
}

.nickname-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 4px;
}

.nickname {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a1a;
}

.level-badge {
  flex-shrink: 0;
  border-radius: 10px;
  padding: 0 8px;
}

.exp-badge {
  background: linear-gradient(135deg, #ff4400, #ff6600);
  color: #fff;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.exp-progress-block {
  margin-top: 12px;
  text-align: left;
}

.exp-progress-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 6px;
}

.achievements-count {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: #ff4400;
  cursor: pointer;
  font-weight: 600;
}

.achievements-count:hover {
  opacity: 0.8;
}

.profile-uid {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: #999;
}

.profile-stats {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 14px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
}

.stat-item {
  flex: 1;
  cursor: pointer;
  transition: transform 0.2s;
}

.stat-item:hover {
  transform: scale(1.05);
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #ff4d4f;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #eee;
}

.edit-profile-btn {
  color: #ff4400 !important;
  font-size: 13px;
}

.menu-list {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.menu-item:hover {
  background: #fafafa;
}

.menu-item.active {
  color: #ff4400;
  background: #fff5f0;
  border-left-color: #ff4400;
}

.menu-icon {
  font-size: 18px;
  color: #666;
  margin-right: 12px;
}

.menu-item.active .menu-icon {
  color: #ff4400;
}

.menu-label {
  flex: 1;
  font-size: 14px;
}

.menu-arrow {
  font-size: 14px;
  color: #ccc;
}

.user-content {
  flex: 1;
  min-width: 0;
}

.order-quick-access {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px 16px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f5f5f5;
}

.order-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.order-all {
  font-size: 13px;
  color: #999;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 2px;
  transition: color 0.2s;
}

.order-all:hover {
  color: #ff4400;
}

.order-status-row {
  display: flex;
  justify-content: space-around;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 8px;
  transition: background 0.2s;
}

.status-item:hover {
  background: #f8f8f8;
}

.status-badge {
  margin-bottom: 2px;
}

.status-badge :deep(.el-badge__content) {
  border: none;
  font-size: 11px;
  height: 18px;
  line-height: 18px;
  padding: 0 5px;
}

.status-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-label {
  font-size: 12px;
  color: #666;
  white-space: nowrap;
}

.dynamic-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-card {
  min-height: 200px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.sub-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
}

.balance-hero {
  text-align: center;
  padding: 20px 0 12px;
}

.balance-amount {
  margin-bottom: 8px;
}

.balance-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-bottom: 8px;
}

.balance-number {
  font-size: 42px;
  font-weight: 700;
  color: #ff4d4f;
  line-height: 1;
}

.balance-number small {
  font-size: 24px;
  font-weight: 400;
}

.balance-points {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: #666;
  background: #fff5f0;
  padding: 4px 16px;
  border-radius: 20px;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.transaction-item:last-child {
  border-bottom: none;
}

.tx-left {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tx-desc {
  font-size: 14px;
  color: #333;
}

.tx-time {
  font-size: 12px;
  color: #999;
}

.tx-amount {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.tx-amount.income {
  color: #ff4d4f;
}

.tx-amount.expense {
  color: #00b578;
}

.profile-form {
  max-width: 400px;
}

.address-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.address-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px;
  transition: border-color 0.2s;
}

.address-card:hover {
  border-color: #ff4400;
}

.address-top {
  margin-bottom: 6px;
}

.address-name {
  display: flex;
  align-items: center;
  gap: 10px;
}

.address-name .name {
  font-weight: 600;
  font-size: 14px;
}

.address-name .phone {
  color: #666;
  font-size: 13px;
}

.address-detail {
  font-size: 13px;
  color: #888;
  margin: 6px 0 12px;
  line-height: 1.5;
}

.address-actions {
  display: flex;
  gap: 8px;
}

.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.coupon-card {
  display: flex;
  border: 1px solid #ff4400;
  border-radius: 10px;
  overflow: hidden;
}

.coupon-left {
  background: #ff4400;
  color: #fff;
  padding: 18px 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 110px;
}

.coupon-amount {
  font-size: 24px;
  font-weight: 700;
}

.coupon-condition {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.9;
}

.coupon-right {
  flex: 1;
  padding: 14px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background: #fff5f0;
}

.coupon-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.coupon-expire {
  font-size: 12px;
  color: #999;
}

.purchased-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.purchased-item {
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  padding: 12px;
  cursor: pointer;
  transition: border-color 0.2s, transform 0.2s;
}

.purchased-item:hover {
  border-color: #ff4400;
  transform: translateY(-2px);
}

.purchased-image {
  width: 100%;
  height: 140px;
  object-fit: contain;
  border-radius: 6px;
  background: #fafafa;
}

.purchased-info {
  margin-top: 10px;
}

.purchased-name {
  display: block;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}

.purchased-date {
  display: block;
  font-size: 12px;
  color: #999;
  margin-bottom: 4px;
}

.purchased-price {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #ff4400;
}

.purchased-price small {
  font-size: 12px;
  color: #999;
  font-weight: 400;
}

.wishlist-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.wishlist-item {
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  position: relative;
  transition: border-color 0.2s;
}

.wishlist-item:hover {
  border-color: #ff4400;
}

.wishlist-image {
  width: 100%;
  height: 140px;
  object-fit: contain;
  border-radius: 6px;
  background: #fafafa;
}

.wishlist-info {
  text-align: center;
}

.wishlist-name {
  display: block;
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.wishlist-price {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: #ff4400;
  margin-top: 4px;
}

.wishlist-item .el-button {
  position: absolute;
  top: 8px;
  right: 8px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #bbb;
}

.empty-state p {
  margin-top: 12px;
  font-size: 14px;
}

.checkin-section {
  text-align: center;
}

.checkin-content {
  padding: 30px 0;
}

.checkin-circle {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, #ff4400, #ff6a00);
  color: #fff;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(255, 68, 0, 0.35);
}

.checkin-circle.checked {
  background: #ccc;
  box-shadow: none;
  cursor: default;
}

.checkin-text {
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
}

.checkin-text small {
  font-size: 12px;
  font-weight: 400;
}

.checkin-tip {
  font-size: 14px;
  color: #999;
}

.edit-avatar-row {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.edit-avatar {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  border: 3px solid #ff4400;
  margin-bottom: 6px;
}

.edit-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.edit-avatar-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s;
  color: #fff;
}

.edit-avatar:hover .edit-avatar-overlay {
  opacity: 1;
}

.edit-avatar-hint {
  font-size: 12px;
  color: #999;
}

.edit-form {
  max-width: 400px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .user-layout {
    flex-direction: column;
  }

  .user-sidebar {
    width: 100%;
  }

  .profile-card {
    margin-bottom: 12px;
  }

  .order-quick-access {
    padding: 16px;
  }

  .order-status-row {
    gap: 4px;
    justify-content: space-between;
  }

  .status-item {
    padding: 4px 6px;
  }

  .status-icon-wrap {
    width: 38px;
    height: 38px;
  }

  .dynamic-section {
    padding: 16px;
  }

  .balance-number {
    font-size: 32px;
  }

  .wishlist-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .purchased-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
