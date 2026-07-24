<template>
  <div class="payment-page">
    <div class="container">
      <div class="payment-card" v-if="order">
        <div class="payment-status" v-if="!paymentSuccess">
          <div class="status-icon">
            <el-icon :size="60" color="#ff4400"><Timer /></el-icon>
          </div>
          <h2>订单提交成功，请尽快支付</h2>
          <p class="order-no">订单号：{{ order.orderNo }}</p>
          <p class="pay-amount">
            支付金额：<span class="amount">¥{{ order.payAmount.toFixed(2) }}</span>
          </p>

          <div class="payment-methods">
            <h3>选择支付方式</h3>
            <div class="method-list">
              <div class="method-item" :class="{ active: selectedMethod === 'balance' }" @click="selectedMethod = 'balance'">
                <span class="method-icon">💰</span>
                <div class="method-info">
                  <span class="method-name">余额支付</span>
                  <span class="method-desc">可用余额：¥{{ userStore.balance.toFixed(2) }}</span>
                </div>
                <el-icon v-if="selectedMethod === 'balance'" class="check-icon"><CircleCheck /></el-icon>
              </div>
              <div class="method-item" :class="{ active: selectedMethod === 'alipay' }" @click="selectedMethod = 'alipay'">
                <span class="method-icon">💳</span>
                <div class="method-info">
                  <span class="method-name">模拟支付宝</span>
                  <span class="method-desc">推荐支付宝用户使用</span>
                </div>
                <el-icon v-if="selectedMethod === 'alipay'" class="check-icon"><CircleCheck /></el-icon>
              </div>
              <div class="method-item" :class="{ active: selectedMethod === 'wechat' }" @click="selectedMethod = 'wechat'">
                <span class="method-icon">📱</span>
                <div class="method-info">
                  <span class="method-name">模拟微信支付</span>
                  <span class="method-desc">推荐微信用户使用</span>
                </div>
                <el-icon v-if="selectedMethod === 'wechat'" class="check-icon"><CircleCheck /></el-icon>
              </div>
            </div>
          </div>

          <div class="password-input" v-if="selectedMethod === 'balance'">
            <h3>请输入支付密码</h3>
            <el-input v-model="payPassword" type="password" placeholder="默认密码：123456" show-password size="large" />
          </div>

          <div class="countdown">
            请在 <span class="time">14:59</span> 内完成支付，超时订单将自动取消
          </div>

          <div class="payment-actions">
            <el-button type="primary" size="large" class="btn-pay" @click="handlePay" :loading="paying">确认支付</el-button>
            <el-button size="large" @click="cancelPayment">取消支付</el-button>
          </div>
        </div>

        <div class="payment-success" v-else>
          <div class="success-icon">
            <el-icon :size="80" color="#52c41a"><CircleCheck /></el-icon>
          </div>
          <h2>支付成功</h2>
          <p class="success-amount">支付金额：<span>¥{{ order.payAmount.toFixed(2) }}</span></p>
          <p class="success-tip">订单已进入处理流程，请耐心等待</p>
          <div class="success-actions">
            <el-button type="primary" @click="viewOrder">查看订单</el-button>
            <el-button @click="continueShopping">继续购物</el-button>
          </div>

          <div class="logistics-info" v-if="order.logistics.status.length > 0">
            <h3>物流信息</h3>
            <el-timeline>
              <el-timeline-item
                v-for="(log, index) in order.logistics.status"
                :key="index"
                :type="index === order.logistics.status.length - 1 ? 'primary' : ''"
                :hollow="index !== order.logistics.status.length - 1"
              >
                {{ log.status }}
                <br/><small style="color:#999">{{ log.location }}</small>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </div>

      <div class="payment-card" v-else>
        <el-empty description="订单不存在" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Timer, CircleCheck } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { useOrderStore } from '../../stores/order'
import { ElMessage } from 'element-plus'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()
const orderStore = useOrderStore()

const selectedMethod = ref('balance')
const payPassword = ref('')
const paying = ref(false)
const paymentSuccess = ref(false)

const order = computed(() => {
  return orderStore.getOrder(Number(route.params.orderId))
})

const handlePay = async () => {
  if (selectedMethod.value === 'balance') {
    if (payPassword.value !== '123456') {
      ElMessage.error('支付密码错误，默认密码为：123456')
      return
    }
    if (userStore.balance < order.value.payAmount) {
      ElMessage.error('余额不足')
      return
    }
    userStore.deductBalance(order.value.payAmount)
  }

  paying.value = true
  await new Promise(resolve => setTimeout(resolve, 1500))
  
  orderStore.payOrder(order.value.id)
  paymentSuccess.value = true
  paying.value = false
  ElMessage.success('支付成功')
}

const cancelPayment = () => {
  router.push('/orders')
}

const viewOrder = () => {
  router.push(`/order/${order.value.id}`)
}

const continueShopping = () => {
  router.push('/')
}
</script>

<style scoped>
.payment-page { padding: 40px 0; }
.payment-card { background: #fff; border-radius: 12px; padding: 40px; max-width: 600px; margin: 0 auto; text-align: center; }
.payment-status h2 { font-size: 22px; margin: 15px 0 10px; }
.order-no { color: #999; font-size: 14px; margin-bottom: 10px; }
.pay-amount { font-size: 16px; color: #333; margin-bottom: 30px; }
.amount { font-size: 28px; font-weight: bold; color: #ff4400; }

.payment-methods { text-align: left; margin-bottom: 25px; }
.payment-methods h3 { font-size: 16px; margin-bottom: 15px; }
.method-list { display: flex; flex-direction: column; gap: 10px; }
.method-item { display: flex; align-items: center; gap: 12px; padding: 15px; border: 2px solid #e8e8e8; border-radius: 8px; cursor: pointer; transition: all 0.3s; }
.method-item:hover { border-color: #ff4400; }
.method-item.active { border-color: #ff4400; background: #fff5f0; }
.method-icon { font-size: 24px; }
.method-info { flex: 1; }
.method-name { display: block; font-weight: bold; }
.method-desc { font-size: 12px; color: #999; }
.check-icon { color: #ff4400; font-size: 20px; }

.password-input { text-align: left; margin-bottom: 20px; }
.password-input h3 { font-size: 14px; margin-bottom: 10px; }

.countdown { color: #999; font-size: 13px; margin-bottom: 25px; }
.countdown .time { color: #ff4400; font-weight: bold; }

.payment-actions { display: flex; gap: 15px; justify-content: center; }
.btn-pay { padding: 12px 60px; font-size: 16px; }

.payment-success h2 { font-size: 24px; margin: 20px 0 10px; color: #52c41a; }
.success-amount { font-size: 16px; margin-bottom: 10px; }
.success-amount span { font-size: 24px; font-weight: bold; color: #ff4400; }
.success-tip { color: #999; margin-bottom: 25px; }
.success-actions { display: flex; gap: 15px; justify-content: center; margin-bottom: 30px; }
.logistics-info { text-align: left; border-top: 1px solid #f0f0f0; padding-top: 20px; }
.logistics-info h3 { font-size: 16px; margin-bottom: 15px; }
</style>
