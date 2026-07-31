<template>
  <div class="back-button" @click="goBack">
    <el-icon><ArrowLeft /></el-icon>
    <span>返回</span>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}
</script>

<style scoped>
.back-button {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  color: #666;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
  margin-bottom: 12px;
}
.back-button:hover {
  color: #ff4400;
  background: #fff5f0;
}
</style>
