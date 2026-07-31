<template>
  <header class="header">
    <div class="header-top" v-if="!isMobile">
      <div class="container">
        <div class="top-left">
          <span>欢迎来到淘大宝！</span>
        </div>
        <div class="top-right">
          <template v-if="userStore.isLoggedIn">
            <span class="user-name">{{ userStore.userInfo.nickname }}</span>
            <span class="level-badge" v-if="userStore.isLoggedIn">Lv.{{ userStore.level }}</span>
            <span class="separator">|</span>
            <span class="balance">余额：¥{{ userStore.balance.toFixed(2) }}</span>
            <span class="separator">|</span>
            <router-link to="/user" class="link">个人中心</router-link>
            <span class="separator">|</span>
            <router-link to="/messages" class="link msg-link">
              消息
              <span v-if="unreadCount > 0" class="msg-dot">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </router-link>
            <span class="separator">|</span>
            <span class="link logout" @click="handleLogout">退出</span>
          </template>
          <template v-else>
            <span class="link" @click="authStore.openLogin()">请登录</span>
            <span class="separator">|</span>
            <span class="link" @click="authStore.openRegister()">免费注册</span>
          </template>
        </div>
      </div>
    </div>

    <div class="header-main">
      <div class="container">
        <div class="logo" v-if="!isMobile" @click="goHome" style="cursor:pointer">
          <span class="logo-text">淘大宝</span>
          <span class="logo-slogan">— 快乐购物，应有尽有 —</span>
        </div>

        <div class="mobile-header-left" v-if="isMobile">
          <el-icon :size="24" @click="showMobileNav = !showMobileNav" class="menu-icon">
            <Menu />
          </el-icon>
          <span class="mobile-logo" @click="goHome" style="cursor:pointer">淘大宝</span>
        </div>

        <div class="search-wrapper" :class="{ 'mobile-expanded': isMobile && showMobileSearch }" v-show="!isMobile || !showMobileSearch">
          <div class="search-box">
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索商品"
              @keyup.enter="handleSearch"
              @focus="showSuggestions = true"
              @blur="handleBlur"
            />
            <button class="search-btn" @click="handleSearch">
              <el-icon><Search /></el-icon>
            </button>
          </div>
          <SearchSuggestions
            :keyword="searchKeyword"
            :visible="showSuggestions"
            @select="closeSuggestions"
            @close="closeSuggestions"
          />
        </div>

        <div class="header-actions" v-if="isMobile">
          <el-icon :size="22" class="action-icon" @click="toggleMobileSearch">
            <Search />
          </el-icon>
          <router-link to="/messages" class="mobile-msg-icon">
            <el-icon :size="22" class="action-icon"><ChatDotRound /></el-icon>
            <span v-if="unreadCount > 0" class="msg-dot">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
          </router-link>
          <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0" class="cart-badge-mobile">
            <el-icon :size="22" class="action-icon" @click="goToCart">
              <ShoppingCart />
            </el-icon>
          </el-badge>
        </div>

        <!-- 顶部统一操作按钮（购物车+常驻入口） -->
        <div class="header-actions-bar" v-if="!isMobile">
          <div class="action-btn cart-action" @click="goToCart">
            <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
              <el-icon :size="16"><ShoppingCart /></el-icon>
            </el-badge>
            <span>购物车</span>
          </div>
          <router-link to="/games" class="action-btn" :class="{ active: isActiveNav({ path: '/games' }) }">
            <el-icon :size="16"><Trophy /></el-icon>
            <span>赚米中心</span>
          </router-link>
          <router-link to="/leaderboard" class="action-btn" :class="{ active: isActiveNav({ path: '/leaderboard' }) }">
            <el-icon :size="16"><TrendCharts /></el-icon>
            <span>全服排行榜</span>
          </router-link>
          <router-link to="/activities" class="action-btn" :class="{ active: isActiveNav({ path: '/activities' }) }">
            <el-icon :size="16"><Lightning /></el-icon>
            <span>限时活动</span>
          </router-link>
        </div>
      </div>
    </div>

    <div class="main-nav-bar" v-if="!isMobile" :class="{ collapsed: uiStore.menuCollapsed }">
      <div class="container">
        <div class="nav-bar-inner" :class="{ collapsed: uiStore.menuCollapsed }">
          <div class="nav-left" :class="{ 'hide-on-collapse': uiStore.menuCollapsed }">
            <el-dropdown trigger="click" @command="switchCategory">
              <span class="market-switcher-btn">
                <span class="switcher-text">{{ currentCategoryLabel }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item v-for="cat in categories" :key="cat.id" :command="cat.id">
                    <span class="dropdown-item-content">
                      <span class="dropdown-label">{{ cat.label }}</span>
                      <span class="dropdown-desc">{{ cat.desc }}</span>
                    </span>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
          <div class="nav-center" :class="{ 'hide-on-collapse': uiStore.menuCollapsed }">
            <router-link v-for="item in currentNavItems" :key="item.label" :to="item.path" class="nav-item" :class="{ active: isActiveNav(item) }">
              {{ item.label }}<span v-if="item.badge" class="nav-item-badge">{{ item.badge }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <!-- 悬浮在屏幕最右侧的收起/展开按钮（始终可见） -->
    <div class="nav-toggle-float" v-if="!isMobile" @click="uiStore.toggleMenu()">
      <el-icon v-if="!uiStore.menuCollapsed"><ArrowUp /></el-icon>
      <el-icon v-else><ArrowDown /></el-icon>
    </div>

    <transition name="slide-down">
      <div class="mobile-search-bar" v-if="isMobile && showMobileSearch">
        <div class="mobile-search-inner">
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索商品"
            @keyup.enter="handleSearch"
            class="mobile-input"
          />
          <button class="mobile-search-btn" @click="handleSearch">搜索</button>
          <button class="mobile-search-cancel" @click="showMobileSearch = false">取消</button>
        </div>
      </div>
    </transition>

    <LoginDialog />

    <transition name="slide-left">
      <div class="mobile-nav-overlay" v-if="isMobile && showMobileNav" @click="showMobileNav = false">
        <div class="mobile-nav-drawer" @click.stop>
          <div class="drawer-header">
            <span class="drawer-title">商品分类</span>
            <el-icon :size="20" @click="showMobileNav = false" class="close-icon">
              <Close />
            </el-icon>
          </div>
          <div class="drawer-list">
            <router-link to="/" class="drawer-item" @click="showMobileNav = false">首页</router-link>
            <router-link to="/products" class="drawer-item" @click="showMobileNav = false">全部商品</router-link>
            <router-link to="/products?categoryId=1" class="drawer-item" @click="showMobileNav = false">手机数码</router-link>
            <router-link to="/products?categoryId=2" class="drawer-item" @click="showMobileNav = false">电脑办公</router-link>
            <router-link to="/products?categoryId=5" class="drawer-item" @click="showMobileNav = false">服饰鞋包</router-link>
            <router-link to="/products?categoryId=6" class="drawer-item" @click="showMobileNav = false">美妆个护</router-link>
            <router-link to="/products?categoryId=4" class="drawer-item" @click="showMobileNav = false">家用电器</router-link>
            <router-link to="/games" class="drawer-item" @click="showMobileNav = false">赚米中心</router-link>
            <router-link to="/activities" class="drawer-item" @click="showMobileNav = false">限时活动</router-link>
            <router-link to="/stocks" class="drawer-item" @click="showMobileNav = false">股票交易</router-link>
          </div>
          <div class="drawer-footer">
            <router-link to="/user" class="drawer-user-link" @click="showMobileNav = false">个人中心</router-link>
          </div>
        </div>
      </div>
    </transition>

    <nav class="mobile-bottom-nav" v-if="isMobile">
      <router-link to="/" class="bottom-nav-item" :class="{ active: route.path === '/' }" @click="goHome">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="nav-label">首页</span>
      </router-link>
      <router-link to="/products" class="bottom-nav-item" :class="{ active: route.path.startsWith('/products') }">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
        <span class="nav-label">分类</span>
      </router-link>
      <router-link to="/cart" class="bottom-nav-item" :class="{ active: route.path === '/cart' }">
        <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
        </el-badge>
        <span class="nav-label">购物车</span>
      </router-link>
      <router-link to="/games" class="bottom-nav-item" :class="{ active: route.path === '/games' || route.path === '/leaderboard' }">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
        <span class="nav-label">赚米排行</span>
      </router-link>
      <router-link to="/user" class="bottom-nav-item" :class="{ active: route.path === '/user' }">
        <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span class="nav-label">我的</span>
      </router-link>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Search, ShoppingCart, ArrowDown, ArrowUp, Menu, Close, Trophy, TrendCharts, Lightning, ChatDotRound } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { useCartStore } from '../../stores/cart'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'
import { useDevice } from '../../utils/device'
import SearchSuggestions from '../SearchSuggestions/index.vue'
import LoginDialog from '../LoginDialog/index.vue'
import { messageApi } from '../../api/messages'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const cartStore = useCartStore()
const authStore = useAuthStore()
const uiStore = useUiStore()
const { isMobile } = useDevice()

const searchKeyword = ref('')
const showSuggestions = ref(false)
const showMobileSearch = ref(false)
const showMobileNav = ref(false)
const unreadCount = ref(0)

// 轮询未读消息数
let unreadTimer = null
const loadUnread = async () => {
  if (!userStore.isLoggedIn) { unreadCount.value = 0; return }
  try {
    const res = await messageApi.conversations()
    const list = Array.isArray(res) ? res : (res.conversations || [])
    unreadCount.value = list.reduce((s, c) => s + (c.unread || 0), 0)
  } catch { /* ignore */ }
}

onMounted(() => {
  loadUnread()
  unreadTimer = setInterval(loadUnread, 10000)
  window.addEventListener('focus', loadUnread)
})

onUnmounted(() => {
  if (unreadTimer) clearInterval(unreadTimer)
  window.removeEventListener('focus', loadUnread)
})

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    showSuggestions.value = false
    showMobileSearch.value = false
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

const closeSuggestions = () => {
  showSuggestions.value = false
}

const handleBlur = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const handleDocumentClick = (e) => {
  const wrapper = document.querySelector('.search-wrapper')
  if (wrapper && !wrapper.contains(e.target)) {
    showSuggestions.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
})

const goToCart = () => {
  router.push('/cart')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}

const toggleMobileSearch = () => {
  showMobileSearch.value = !showMobileSearch.value
  if (showMobileSearch.value) {
    setTimeout(() => {
      document.querySelector('.mobile-input')?.focus()
    }, 100)
  }
}

const currentCategory = ref('shop')
const currentCategoryLabel = ref('电商购物')
const currentCategoryDesc = ref('服装、数码、家电等商品')

const categories = [
  { id: 'shop', label: '电商购物', desc: '服装、数码、家电等商品' },
  { id: 'house', label: '房产投资', desc: '全国房源模拟交易' },
  { id: 'car', label: '汽车世界', desc: '新车二手车模拟交易' },
  { id: 'invest', label: '金融投资', desc: '基金理财模拟投资' }
]

const marketNavItems = {
  shop: [
    { label: '全部商品', path: '/products' },
    { label: '手机数码', path: '/products?categoryId=1' },
    { label: '电脑办公', path: '/products?categoryId=2' },
    { label: '服饰鞋包', path: '/products?categoryId=5' },
    { label: '美妆个护', path: '/products?categoryId=6' },
    { label: '家用电器', path: '/products?categoryId=4' },
  ],
  house: [ { label: '全部房源', path: '/products?market=house' } ],
  car: [ { label: '全部车型', path: '/products?market=car' } ],
  invest: [ { label: '股票交易', path: '/stocks', badge: '24小时' } ]
}

const currentNavItems = computed(() => marketNavItems[currentCategory.value] || marketNavItems.shop)

const isActiveNav = (item) => {
  const [path, queryStr] = item.path.split('?')
  let active = route.path === path
  if (queryStr) {
    const params = new URLSearchParams(queryStr)
    params.forEach((value, key) => {
      if (route.query[key] !== value) active = false
    })
  }
  return active
}

const switchCategory = (id) => {
  const cat = categories.find(c => c.id === id)
  if (cat) {
    currentCategory.value = cat.id
    currentCategoryLabel.value = cat.label
    currentCategoryDesc.value = cat.desc
    localStorage.setItem('taobao_category', id)
    if (id === 'shop') {
      router.push('/')
    } else if (id === 'invest') {
      router.push('/stocks')
    } else {
      router.push({ path: '/products', query: { market: id } })
    }
  }
}

// 点击 logo/首页：重置为电商大盘并回主页
const goHome = () => {
  currentCategory.value = 'shop'
  currentCategoryLabel.value = '电商购物'
  currentCategoryDesc.value = '服装、数码、家电等商品'
  localStorage.setItem('taobao_category', 'shop')
  router.push('/')
}

// 根据路由自动同步大盘状态
const syncCategoryFromRoute = () => {
  const path = route.path
  const market = route.query.market

  if (path === '/' || (path === '/products' && !market)) {
    currentCategory.value = 'shop'
    currentCategoryLabel.value = '电商购物'
    currentCategoryDesc.value = '服装、数码、家电等商品'
  } else if (path === '/stocks') {
    currentCategory.value = 'invest'
    currentCategoryLabel.value = '金融投资'
    currentCategoryDesc.value = '基金理财模拟投资'
  } else if (market && categories.find(c => c.id === market)) {
    const cat = categories.find(c => c.id === market)
    currentCategory.value = cat.id
    currentCategoryLabel.value = cat.label
    currentCategoryDesc.value = cat.desc
  }
}

// 路由变化时同步（首次加载也执行）
watch(() => route.path, syncCategoryFromRoute, { immediate: true })
watch(() => route.query.market, syncCategoryFromRoute)
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.header-top {
  background: #333;
  color: #fff;
  font-size: 12px;
  height: 32px;
  line-height: 32px;
}

.header-top .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.top-right .link {
  color: #fff;
  cursor: pointer;
}

.top-right .link:hover {
  color: #ff4400;
}

.top-right .separator {
  margin: 0 8px;
  color: #666;
}

.top-right .balance {
  color: #ff4400;
}

.msg-link {
  position: relative;
}

.msg-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ff4d4f;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 10px;
  margin-left: 3px;
  vertical-align: middle;
  line-height: 16px;
}

.mobile-msg-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.mobile-msg-icon .msg-dot {
  position: absolute;
  top: -4px;
  right: -6px;
  margin-left: 0;
}

.level-badge {
  background: linear-gradient(135deg, #ff4400, #ff6600);
  color: #fff;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  margin-left: 6px;
}

.header-main {
  padding: 15px 0;
}

.header-main .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo a {
  display: flex;
  flex-direction: column;
}

.logo-text {
  font-family: 'ZCOOL KuaiLe', 'PingFang SC', sans-serif;
  font-size: 28px;
  font-weight: 400;
  color: #ff4400;
  line-height: 1.2;
  letter-spacing: 2px;
}

.logo-slogan {
  font-size: 12px;
  color: #999;
}

.search-wrapper {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
  position: relative;
}

.search-box {
  display: flex;
  border: 2px solid #ff4400;
  border-radius: 4px;
  overflow: hidden;
}

.search-box input {
  flex: 1;
  border: none;
  padding: 10px 15px;
  font-size: 14px;
  outline: none;
}

.search-btn {
  background: #ff4400;
  color: #fff;
  border: none;
  padding: 0 20px;
  cursor: pointer;
  transition: background 0.3s;
}

.search-btn:hover {
  background: #ff6600;
}

.header-actions-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: 20px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  font-size: 13px;
  color: #333;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
  line-height: 1;
}

.action-btn:hover {
  border-color: #ff4400;
  color: #ff4400;
}

.action-btn.active {
  border-color: #ff4400;
  color: #ff4400;
  background: #fff5f0;
}

.action-btn .el-badge {
  line-height: 1;
}

.main-nav-bar {
  background: #fff;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
  transition:
    max-height 0.75s cubic-bezier(0.4, 0, 0.2, 1),
    border-width 0.75s ease;
  overflow: hidden;
  max-height: 100px;
  will-change: max-height;
}

.main-nav-bar.collapsed {
  max-height: 0;
  border-top-width: 0;
  border-bottom-width: 0;
}

.nav-left,
.nav-center {
  transition: opacity 0.4s ease;
}

.main-nav-bar .container {
  display: flex;
  align-items: center;
}

.nav-bar-inner {
  display: flex;
  align-items: center;
  height: 44px;
}

.nav-left {
  display: flex;
  align-items: center;
  min-width: 150px;
  flex-shrink: 0;
}

.nav-center {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
  min-width: 0;
}

.hide-on-collapse {
  display: none;
}

.nav-toggle-float {
  position: fixed;
  right: 0;
  top: 108px;
  width: 26px;
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ff4400;
  color: #fff;
  border-radius: 6px 0 0 6px;
  cursor: pointer;
  z-index: 1001;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.15);
  transition: all 0.2s;
}

.nav-toggle-float:hover {
  width: 32px;
}

.market-switcher-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #ff4400;
  font-size: 14px;
  font-weight: 600;
  padding: 0 20px;
}

.market-switcher-btn:hover {
  opacity: 0.8;
}

.switcher-text {
  white-space: nowrap;
}

.dropdown-item-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.dropdown-label {
  font-weight: 600;
  font-size: 14px;
}

.dropdown-desc {
  font-size: 11px;
  color: #999;
}

.nav-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  transition: all 0.3s;
}

.nav-item:hover {
  color: #ff4400;
  background: #fff5f0;
}

.nav-item.active {
  color: #ff4400;
  font-weight: 600;
}

.nav-item-badge {
  display: inline-block;
  background: #ff4400;
  color: #fff;
  font-size: 10px;
  padding: 0 5px;
  border-radius: 3px;
  margin-left: 4px;
  vertical-align: middle;
  line-height: 16px;
}

.mobile-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.menu-icon {
  cursor: pointer;
  color: #333;
}

.mobile-logo {
  font-family: 'ZCOOL KuaiLe', 'PingFang SC', sans-serif;
  font-size: 20px;
  font-weight: 400;
  color: #ff4400;
  white-space: nowrap;
  letter-spacing: 1px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 16px;
}

.action-icon {
  cursor: pointer;
  color: #333;
}

.cart-badge-mobile :deep(.el-badge__content) {
  background-color: #ff4400;
}

.mobile-search-bar {
  padding: 10px 15px;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.mobile-search-inner {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mobile-search-inner input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  outline: none;
}

.mobile-search-inner input:focus {
  border-color: #ff4400;
}

.mobile-search-btn {
  background: #ff4400;
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
}

.mobile-search-cancel {
  background: none;
  border: none;
  color: #999;
  font-size: 14px;
  cursor: pointer;
  padding: 10px 4px;
}

.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
  opacity: 0;
  overflow: hidden;
}

.mobile-nav-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1001;
}

.mobile-nav-drawer {
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  width: 280px;
  background: #fff;
  display: flex;
  flex-direction: column;
  z-index: 1002;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.drawer-title {
  font-size: 18px;
  font-weight: bold;
}

.close-icon {
  cursor: pointer;
  color: #999;
}

.drawer-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px 0;
}

.drawer-item {
  display: block;
  padding: 14px 20px;
  font-size: 15px;
  color: #333;
  transition: background 0.2s;
}

.drawer-item:hover {
  background: #fff5f0;
  color: #ff4400;
}

.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.drawer-user-link {
  display: block;
  text-align: center;
  padding: 10px;
  color: #ff4400;
  font-size: 15px;
  background: #fff5f0;
  border-radius: 6px;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.25s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  background: #fff;
  border-top: 1px solid #f0f0f0;
  padding: 6px 0;
  padding-bottom: calc(6px + env(safe-area-inset-bottom, 0));
}

.bottom-nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 4px 0;
  color: #999;
  text-decoration: none;
  font-size: 10px;
  transition: color 0.2s;
}

.bottom-nav-item.active {
  color: #ff4400;
}

.bottom-nav-item .el-badge {
  line-height: 1;
}

.nav-icon {
  width: 22px;
  height: 22px;
}

.nav-label {
  font-size: 10px;
  line-height: 1;
}

@media (max-width: 768px) {
  .header-main {
    padding: 10px 15px;
  }

  .search-wrapper {
    margin: 0 12px;
    max-width: none;
  }

  .search-box input {
    padding: 8px 12px;
    font-size: 13px;
  }

  .search-btn {
    padding: 0 14px;
  }
}
</style>
