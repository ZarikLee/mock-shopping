<template>
  <header class="header">
    <!-- 顶部通知栏 -->
    <div class="header-top">
      <div class="container">
        <div class="top-left">
          <span>欢迎来到模拟商城！</span>
        </div>
        <div class="top-right">
          <template v-if="userStore.isLoggedIn">
            <span class="user-name">{{ userStore.userInfo.nickname }}</span>
            <span class="separator">|</span>
            <span class="balance">余额：¥{{ userStore.balance.toFixed(2) }}</span>
            <span class="separator">|</span>
            <span class="points">积分：{{ userStore.points }}</span>
            <span class="separator">|</span>
            <router-link to="/user" class="link">个人中心</router-link>
            <span class="separator">|</span>
            <span class="link logout" @click="handleLogout">退出</span>
          </template>
          <template v-else>
            <router-link to="/user" class="link">请登录</router-link>
            <span class="separator">|</span>
            <span class="link">免费注册</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 主导航栏 -->
    <div class="header-main">
      <div class="container">
        <div class="logo">
          <router-link to="/">
            <span class="logo-text">模拟商城</span>
            <span class="logo-slogan">— 模拟购物，真实体验 —</span>
          </router-link>
        </div>
        
        <!-- 搜索框 -->
        <div class="search-box">
          <input 
            v-model="searchKeyword"
            type="text" 
            placeholder="搜索商品"
            @keyup.enter="handleSearch"
          />
          <button class="search-btn" @click="handleSearch">
            <el-icon><Search /></el-icon>
          </button>
        </div>

        <!-- 购物车 -->
        <div class="cart-box" @click="goToCart">
          <el-badge :value="cartStore.itemCount" :hidden="cartStore.itemCount === 0">
            <div class="cart-icon">
              <el-icon :size="24"><ShoppingCart /></el-icon>
              <span>我的购物车</span>
            </div>
          </el-badge>
        </div>
      </div>
    </div>

    <!-- 分类导航 -->
    <div class="header-nav">
      <div class="container">
        <div class="nav-all">
          <span>全部商品分类</span>
          <el-icon><ArrowDown /></el-icon>
        </div>
        <div class="nav-list">
          <router-link to="/" class="nav-item">首页</router-link>
          <router-link to="/products" class="nav-item">全部商品</router-link>
          <router-link to="/products?categoryId=1" class="nav-item">手机数码</router-link>
          <router-link to="/products?categoryId=2" class="nav-item">电脑办公</router-link>
          <router-link to="/products?categoryId=5" class="nav-item">服饰鞋包</router-link>
          <router-link to="/products?categoryId=6" class="nav-item">美妆个护</router-link>
          <router-link to="/products?categoryId=4" class="nav-item">家用电器</router-link>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Search, ShoppingCart, ArrowDown } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()

const searchKeyword = ref('')

const handleSearch = () => {
  if (searchKeyword.value.trim()) {
    router.push({
      path: '/products',
      query: { keyword: searchKeyword.value.trim() }
    })
  }
}

const goToCart = () => {
  router.push('/cart')
}

const handleLogout = () => {
  userStore.logout()
  router.push('/')
}
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

.top-right .balance,
.top-right .points {
  color: #ff4400;
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
  font-size: 28px;
  font-weight: bold;
  color: #ff4400;
  line-height: 1.2;
}

.logo-slogan {
  font-size: 12px;
  color: #999;
}

.search-box {
  flex: 1;
  max-width: 500px;
  margin: 0 40px;
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

.cart-box {
  cursor: pointer;
}

.cart-icon {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  transition: all 0.3s;
}

.cart-icon:hover {
  border-color: #ff4400;
  color: #ff4400;
}

.header-nav {
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.header-nav .container {
  display: flex;
  align-items: center;
}

.nav-all {
  background: #333;
  color: #fff;
  padding: 12px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  width: 200px;
}

.nav-list {
  display: flex;
  flex: 1;
}

.nav-item {
  padding: 12px 20px;
  font-size: 14px;
  color: #333;
  transition: all 0.3s;
}

.nav-item:hover {
  color: #ff4400;
  background: #fff5f0;
}

@media (max-width: 768px) {
  .header-top {
    display: none;
  }
  
  .logo-slogan {
    display: none;
  }
  
  .search-box {
    margin: 0 15px;
  }
  
  .cart-box {
    display: none;
  }
  
  .nav-all {
    width: auto;
    padding: 12px 15px;
  }
  
  .nav-list {
    overflow-x: auto;
  }
  
  .nav-item {
    padding: 12px 15px;
    white-space: nowrap;
  }
}
</style>
