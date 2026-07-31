<template>
  <el-dialog
    :model-value="visible"
    :close-on-click-modal="false"
    :show-close="false"
    width="480px"
    top="20vh"
    class="disclaimer-dialog"
  >
    <div class="disclaimer-body">
      <el-icon :size="48" color="#ff4400" class="disclaimer-icon"><ShoppingCart /></el-icon>
      <h2>欢迎来到淘大宝！</h2>
      <div class="disclaimer-content">
        <p>淘大宝是一个<strong>娱乐模拟购物网站</strong>，本站所有交易均为<strong>虚拟</strong>，不涉及真实购买。</p>
        <p>您可以在这里：</p>
        <ul>
          <li>浏览海量商品，享受买买买的乐趣</li>
          <li>每日签到、玩游戏赚取金币</li>
          <li>与全服玩家比拼财富排行榜</li>
          <li>体验完整的购物流程，无需担心花费真实金钱</li>
        </ul>
        <p class="disclaimer-note">本网站仅为娱乐目的，不构成任何真实交易。</p>
      </div>
      <div class="disclaimer-agree">
        <el-checkbox v-model="agreed">
          我已知晓并同意以上说明
        </el-checkbox>
      </div>
      <el-button 
        type="primary" 
        size="large" 
        class="disclaimer-btn"
        :disabled="!agreed"
        @click="confirm"
      >
        开始体验
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { ShoppingCart } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'

const emit = defineEmits(['close'])
const userStore = useUserStore()

const visible = ref(false)
const agreed = ref(false)

watch(() => userStore.isLoggedIn, (val) => {
  if (val) {
    const acknowledged = localStorage.getItem('taobao_disclaimer_acknowledged')
    if (!acknowledged) {
      setTimeout(() => { visible.value = true }, 300)
    }
  }
}, { immediate: true })

const confirm = () => {
  if (!agreed.value) return
  localStorage.setItem('taobao_disclaimer_acknowledged', 'true')
  visible.value = false
  emit('close')
}
</script>

<style scoped>
.disclaimer-body {
  text-align: center;
  padding: 10px 0;
}
.disclaimer-icon { display: flex; justify-content: center; margin-bottom: 10px; }
.disclaimer-body h2 { font-size: 22px; margin-bottom: 16px; color: #ff4400; }
.disclaimer-content { text-align: left; background: #f8f8f8; border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; }
.disclaimer-content p { font-size: 14px; color: #555; line-height: 1.7; margin-bottom: 10px; }
.disclaimer-content ul { padding-left: 4px; margin-bottom: 10px; }
.disclaimer-content li { font-size: 14px; color: #555; line-height: 1.8; list-style: none; }
.disclaimer-note { font-size: 12px !important; color: #999 !important; text-align: center; margin-bottom: 0 !important; }
.disclaimer-agree { margin-bottom: 16px; }
.disclaimer-btn { width: 100%; height: 44px; font-size: 16px; }
</style>
