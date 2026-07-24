<template>
  <div class="user-center-page">
    <div class="container">
      <div class="user-layout">
        <!-- 左侧菜单 -->
        <div class="user-sidebar">
          <!-- 用户信息卡片 -->
          <div class="user-card">
            <div class="avatar">
              <img :src="userStore.userInfo?.avatar" alt="头像" />
            </div>
            <div class="user-info">
              <span class="nickname">{{ userStore.userInfo?.nickname }}</span>
              <span class="phone">{{ userStore.userInfo?.phone }}</span>
            </div>
            <div class="user-stats">
              <div class="stat-item">
                <span class="value">¥{{ userStore.balance.toFixed(2) }}</span>
                <span class="label">余额</span>
              </div>
              <div class="stat-item">
                <span class="value">{{ userStore.points }}</span>
                <span class="label">积分</span>
              </div>
              <div class="stat-item">
                <span class="value">{{ userStore.userInfo?.coupons?.length || 0 }}</span>
                <span class="label">优惠券</span>
              </div>
            </div>
          </div>

          <!-- 菜单列表 -->
          <div class="menu-list">
            <div 
              v-for="menu in menuList" 
              :key="menu.value"
              class="menu-item"
              :class="{ active: currentMenu === menu.value }"
              @click="currentMenu = menu.value"
            >
              <el-icon><component :is="menu.icon" /></el-icon>
              <span>{{ menu.label }}</span>
            </div>
          </div>
        </div>

        <!-- 右侧内容 -->
        <div class="user-content">
          <!-- 快捷入口 -->
          <div class="quick-entry">
            <div class="entry-item" @click="router.push('/orders?status=0')">
              <el-icon :size="24" color="#ff4400"><Wallet /></el-icon>
              <span>待付款</span>
            </div>
            <div class="entry-item" @click="router.push('/orders?status=2')">
              <el-icon :size="24" color="#1890ff"><Van /></el-icon>
              <span>待发货</span>
            </div>
            <div class="entry-item" @click="router.push('/orders?status=3')">
              <el-icon :size="24" color="#722ed1"><Position /></el-icon>
              <span>待收货</span>
            </div>
            <div class="entry-item" @click="router.push('/orders?status=7')">
              <el-icon :size="24" color="#52c41a"><CircleCheck /></el-icon>
              <span>已完成</span>
            </div>
          </div>

          <!-- 个人信息 -->
          <div class="info-section" v-if="currentMenu === 'profile'">
            <h2 class="section-title">个人信息</h2>
            <el-form :model="profileForm" label-width="80px" class="profile-form">
              <el-form-item label="昵称">
                <el-input v-model="profileForm.nickname" />
              </el-form-item>
              <el-form-item label="手机号">
                <el-input v-model="profileForm.phone" disabled />
              </el-form-item>
              <el-form-item label="邮箱">
                <el-input v-model="profileForm.email" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveProfile">保存修改</el-button>
              </el-form-item>
            </el-form>
          </div>

          <!-- 地址管理 -->
          <div class="info-section" v-if="currentMenu === 'address'">
            <h2 class="section-title">
              收货地址
              <el-button type="primary" size="small" @click="showAddressDialog = true">
                新增地址
              </el-button>
            </h2>
            <div class="address-list">
              <div 
                v-for="addr in userStore.userInfo?.addresses" 
                :key="addr.id"
                class="address-card"
              >
                <div class="address-info">
                  <span class="name">{{ addr.name }}</span>
                  <span class="phone">{{ addr.phone }}</span>
                  <el-tag v-if="addr.isDefault" type="danger" size="small">默认</el-tag>
                </div>
                <p class="address-detail">
                  {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}
                </p>
                <div class="address-actions">
                  <el-button type="primary" link @click="editAddress(addr)">编辑</el-button>
                  <el-button type="danger" link @click="deleteAddress(addr.id)">删除</el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 优惠券 -->
          <div class="info-section" v-if="currentMenu === 'coupon'">
            <h2 class="section-title">我的优惠券</h2>
            <div class="coupon-list" v-if="userStore.userInfo?.coupons?.length > 0">
              <div 
                v-for="coupon in userStore.userInfo.coupons" 
                :key="coupon.id"
                class="coupon-card"
              >
                <div class="coupon-left">
                  <span class="amount">¥{{ coupon.amount }}</span>
                  <span class="condition">满{{ coupon.minConsume }}可用</span>
                </div>
                <div class="coupon-right">
                  <span class="name">{{ coupon.name }}</span>
                  <span class="expire">有效期至 {{ coupon.expireTime }}</span>
                </div>
              </div>
            </div>
            <div class="no-data" v-else>
              <p>暂无可用优惠券</p>
            </div>
          </div>

          <!-- 账户余额 -->
          <div class="info-section" v-if="currentMenu === 'balance'">
            <h2 class="section-title">账户余额</h2>
            <div class="balance-info">
              <div class="balance-card">
                <span class="label">可用余额</span>
                <span class="amount">¥{{ userStore.balance.toFixed(2) }}</span>
              </div>
              <div class="balance-card">
                <span class="label">积分</span>
                <span class="amount">{{ userStore.points }}</span>
              </div>
            </div>
            <p class="balance-tip">
              💡 余额和积分为模拟数据，购物时可使用余额支付，消费可获得积分奖励
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 地址编辑弹窗 -->
    <el-dialog 
      v-model="showAddressDialog" 
      :title="editingAddress ? '编辑地址' : '新增地址'"
      width="500px"
    >
      <el-form :model="addressForm" label-width="80px">
        <el-form-item label="收货人">
          <el-input v-model="addressForm.name" placeholder="请输入收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="addressForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="addressForm.province" placeholder="省份" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="addressForm.city" placeholder="城市" />
        </el-form-item>
        <el-form-item label="区县">
          <el-input v-model="addressForm.district" placeholder="区县" />
        </el-form-item>
        <el-form-item label="详细地址">
          <el-input v-model="addressForm.detail" placeholder="街道、楼栋、门牌号" />
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
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { User, Location, Ticket, Wallet, Van, Position, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const currentMenu = ref('profile')

const menuList = [
  { label: '个人信息', value: 'profile', icon: User },
  { label: '收货地址', value: 'address', icon: Location },
  { label: '我的优惠券', value: 'coupon', icon: Ticket },
  { label: '账户余额', value: 'balance', icon: Wallet }
]

// 个人信息表单
const profileForm = reactive({
  nickname: userStore.userInfo?.nickname || '',
  phone: userStore.userInfo?.phone || '',
  email: userStore.userInfo?.email || ''
})

const saveProfile = () => {
  userStore.userInfo.nickname = profileForm.nickname
  userStore.userInfo.email = profileForm.email
  localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  ElMessage.success('保存成功')
}

// 地址管理
const showAddressDialog = ref(false)
const editingAddress = ref(null)
const addressForm = reactive({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false
})

const editAddress = (addr) => {
  editingAddress.value = addr
  Object.assign(addressForm, {
    name: addr.name,
    phone: addr.phone,
    province: addr.province,
    city: addr.city,
    district: addr.district,
    detail: addr.detail,
    isDefault: addr.isDefault
  })
  showAddressDialog.value = true
}

const saveAddress = () => {
  if (editingAddress.value) {
    userStore.updateAddress({ ...editingAddress.value, ...addressForm })
  } else {
    userStore.addAddress({ ...addressForm })
  }
  showAddressDialog.value = false
  editingAddress.value = null
  Object.assign(addressForm, {
    name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false
  })
  ElMessage.success('保存成功')
}

const deleteAddress = (id) => {
  userStore.deleteAddress(id)
  ElMessage.success('已删除')
}

onMounted(() => {
  if (route.query.menu) {
    currentMenu.value = route.query.menu
  }
})
</script>

<style scoped>
.user-center-page {
  padding: 20px 0;
}

.user-layout {
  display: flex;
  gap: 20px;
}

.user-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.user-card {
  background: #fff;
  border-radius: 8px;
  padding: 25px;
  margin-bottom: 15px;
  text-align: center;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin: 0 auto 15px;
  border: 3px solid #ff4400;
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info .nickname {
  font-size: 18px;
  font-weight: bold;
  display: block;
  margin-bottom: 5px;
}

.user-info .phone {
  font-size: 13px;
  color: #999;
}

.user-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .value {
  font-size: 18px;
  font-weight: bold;
  color: #ff4400;
}

.stat-item .label {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.menu-list {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  cursor: pointer;
  transition: all 0.3s;
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

.user-content {
  flex: 1;
  min-width: 0;
}

.quick-entry {
  display: flex;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.entry-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 10px;
  border-radius: 8px;
  transition: all 0.3s;
}

.entry-item:hover {
  background: #f8f8f8;
}

.entry-item span {
  font-size: 13px;
  color: #666;
}

.info-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.profile-form {
  max-width: 400px;
}

.address-card {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
}

.address-card .address-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.address-card .name {
  font-weight: bold;
}

.address-card .phone {
  color: #666;
}

.address-card .address-detail {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.address-card .address-actions {
  display: flex;
  gap: 10px;
}

.coupon-card {
  display: flex;
  border: 1px solid #ff4400;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 15px;
}

.coupon-left {
  background: #ff4400;
  color: #fff;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 120px;
}

.coupon-left .amount {
  font-size: 24px;
  font-weight: bold;
}

.coupon-left .condition {
  font-size: 12px;
  margin-top: 5px;
}

.coupon-right {
  flex: 1;
  padding: 15px 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.coupon-right .name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 5px;
}

.coupon-right .expire {
  font-size: 12px;
  color: #999;
}

.balance-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.balance-card {
  flex: 1;
  background: #f8f8f8;
  border-radius: 8px;
  padding: 25px;
  text-align: center;
}

.balance-card .label {
  display: block;
  font-size: 14px;
  color: #999;
  margin-bottom: 10px;
}

.balance-card .amount {
  font-size: 28px;
  font-weight: bold;
  color: #ff4400;
}

.balance-tip {
  font-size: 13px;
  color: #999;
  background: #fff5f0;
  padding: 12px 15px;
  border-radius: 4px;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #999;
}

@media (max-width: 768px) {
  .user-layout {
    flex-direction: column;
  }
  
  .user-sidebar {
    width: 100%;
  }
  
  .user-stats {
    gap: 10px;
  }
  
  .quick-entry {
    flex-wrap: wrap;
  }
  
  .entry-item {
    width: 50%;
  }
  
  .balance-info {
    flex-direction: column;
  }
}
</style>
