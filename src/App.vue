<template>
  <div id="app" :class="{ 'is-mobile': isMobile }">
    <Header />
    <main class="main-content">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <Footer />
    <LoginDialog />
    <DisclaimerDialog />
  </div>
</template>

<script setup>
import Header from './components/Header/index.vue'
import Footer from './components/Footer/index.vue'
import LoginDialog from './components/LoginDialog/index.vue'
import DisclaimerDialog from './components/DisclaimerDialog/index.vue'
import { useDevice } from './utils/device.js'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'
import { useUserStore } from './stores/user'

const { isMobile } = useDevice()
const authStore = useAuthStore()
const userStore = useUserStore()

onMounted(() => {
  const hasVisited = localStorage.getItem('taobao_has_visited')
  if (!hasVisited) {
    localStorage.setItem('taobao_has_visited', 'true')
    if (!userStore.isLoggedIn) {
      setTimeout(() => authStore.openLogin(), 500)
    }
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  background-color: #f5f5f5;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  padding-top: 185px;
}

a {
  text-decoration: none;
  color: inherit;
}

.is-mobile .main-content {
  padding-top: 56px;
  padding-bottom: 60px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

ul, li {
  list-style: none;
}

img {
  max-width: 100%;
  display: block;
}
</style>
