<template>
  <div id="app" :class="{ 'is-mobile': isMobile }">
    <Header />
    <main class="main-content">
      <router-view />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/Header/index.vue'
import Footer from './components/Footer/index.vue'
import { useDevice } from './utils/device.js'

const { isMobile } = useDevice()
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
  padding-top: 130px;
}

a {
  text-decoration: none;
  color: inherit;
}

.is-mobile .main-content {
  padding-top: 90px;
  padding-bottom: 60px;
}

ul, li {
  list-style: none;
}

img {
  max-width: 100%;
  display: block;
}
</style>
