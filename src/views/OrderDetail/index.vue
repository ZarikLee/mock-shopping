<template>
  <div class="order-detail-page" v-if="order">
    <div class="container">
      <div class="breadcrumb">
        <router-link to="/">首页</router-link>
        <span class="separator">/</span>
        <router-link to="/orders">我的订单</router-link>
        <span class="separator">/</span>
        <span>订单详情</span>
      </div>

      <!-- 订单状态头部 -->
      <div class="status-banner" :style="{ background: statusGradient }">
        <div class="status-info">
          <el-icon :size="40"><CircleCheck /></el-icon>
          <div class="status-text">
            <h2>{{ order.status.text }}</h2>
            <p v-if="order.status.code === 0">请尽快完成支付，超时订单将自动取消</p>
            <p v-else-if="order.status.code >= 3 && order.status.code <= 5">
              预计 {{ deliveryDate }} 送达
            </p>
            <p v-else-if="order.status.code >= 6">感谢您的购买，期待下次光临</p>
          </div>
        </div>
      </div>

      <!-- 物流信息 -->
      <div class="section logistics-section" v-if="order.logistics.status.length > 0">
        <h2 class="section-title">
          <el-icon><Van /></el-icon>
          物流信息
        </h2>
        <div class="logistics-info">
          <span class="company">{{ order.logistics.company }}</span>
          <span class="no">运单号：{{ order.logistics.no }}</span>
        </div>
        <el-timeline>
          <el-timeline-item 
            v-for="(log, index) in reversedLogs" 
            :key="index"
            :timestamp="formatTime(log.time)"
            :type="index === 0 ? 'primary' : ''"
            :hollow="index !== 0"
          >
            {{ log.status }}
            <span class="log-location">{{ log.location }}</span>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 收货信息 -->
      <div class="section">
        <h2 class="section-title">
          <el-icon><Location /></el-icon>
          收货信息
        </h2>
        <div class="address-info">
          <span class="name">{{ order.address.name }}</span>
          <span class="phone">{{ order.address.phone }}</span>
          <p class="detail">{{ order.address.province }}{{ order.address.city }}{{ order.address.district }}{{ order.address.detail }}</p>
        </div>
      </div>

      <!-- 商品信息 -->
      <div class="section">
        <h2 class="section-title">
          <el-icon><ShoppingBag /></el-icon>
          商品信息
        </h2>
        <div 
          v-for="item in order.items" 
          :key="item.id"
          class="order-item"
        >
          <img :src="item.image" :alt="item.name" class="item-image" />
          <div class="item-info">
            <span class="item-name">{{ item.name }}</span>
            <span class="item-spec">{{ item.selectedSpec }} {{ item.selectedColor }}</span>
          </div>
          <div class="item-price">
            <span class="price">¥{{ item.price }}</span>
            <span class="quantity">×{{ item.quantity }}</span>
          </div>
        </div>
      </div>

      <!-- 订单金额 -->
      <div class="section amount-section">
        <div class="amount-row">
          <span class="label">商品金额</span>
          <span class="value">¥{{ order.totalAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-row" v-if="order.discountAmount > 0">
          <span class="label">优惠</span>
          <span class="value discount">-¥{{ order.discountAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-row total">
          <span class="label">实付金额</span>
          <span class="total-price">¥{{ order.payAmount.toFixed(2) }}</span>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="section info-section">
        <div class="info-row">
          <span class="label">订单编号：</span>
          <span class="value">{{ order.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">创建时间：</span>
          <span class="value">{{ formatTime(order.createTime) }}</span>
        </div>
        <div class="info-row" v-if="order.payTime">
          <span class="label">支付时间：</span>
          <span class="value">{{ formatTime(order.payTime) }}</span>
        </div>
        <div class="info-row" v-if="order.shipTime">
          <span class="label">发货时间：</span>
          <span class="value">{{ formatTime(order.shipTime) }}</span>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="bottom-actions">
        <el-button v-if="order.status.code === 0" type="primary" @click="goToPayment">
          去支付
        </el-button>
        <el-button v-if="order.status.code === 0" @click="cancelOrder">取消订单</el-button>
        <el-button @click="router.push('/orders')">返回订单列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { CircleCheck, Van, Location, ShoppingBag } from '@element-plus/icons-vue'
import { useOrderStore } from '../../stores/order'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const route = useRoute()
const orderStore = useOrderStore()

const order = ref(null)

onMounted(() => {
  document.title = '订单详情 - 淘大宝'
})
onMounted(async () => {
  try {
    order.value = await orderStore.getOrder(Number(route.params.id))
  } catch {
    ElMessage.error('订单不存在')
  }
})

const reversedLogs = computed(() => {
  if (!order.value) return []
  return [...order.value.logistics.status].reverse()
})

const statusGradient = computed(() => {
  if (!order.value) return ''
  const color = order.value.status.color
  return `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`
})

const deliveryDate = computed(() => {
  const date = new Date()
  date.setDate(date.getDate() + 3)
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const goToPayment = () => {
  router.push(`/payment/${order.value.id}`)
}

const cancelOrder = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    orderStore.cancelOrder(order.value.id)
    ElMessage.success('订单已取消')
  } catch {}
}
</script>

<style scoped>
.order-detail-page {
  padding: 20px 0;
}

.breadcrumb {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.breadcrumb a {
  color: #666;
  transition: color 0.3s;
}

.breadcrumb a:hover {
  color: #ff4400;
}

.breadcrumb .separator {
  margin: 0 8px;
}

.status-banner {
  border-radius: 8px;
  padding: 40px;
  margin-bottom: 20px;
  color: #fff;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.status-text h2 {
  font-size: 24px;
  margin-bottom: 5px;
}

.status-text p {
  font-size: 14px;
  opacity: 0.9;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.section-title {
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.section-title .el-icon {
  color: #ff4400;
}

.logistics-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.logistics-info .company {
  background: #fff5f0;
  padding: 4px 12px;
  border-radius: 4px;
  color: #ff4400;
  font-weight: bold;
}

.log-location {
  font-size: 12px;
  color: #999;
  margin-left: 10px;
}

.address-info {
  font-size: 14px;
}

.address-info .name {
  font-weight: bold;
  margin-right: 15px;
}

.address-info .phone {
  color: #666;
}

.address-info .detail {
  margin-top: 8px;
  color: #666;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.order-item:last-child {
  border-bottom: none;
}

.item-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.item-spec {
  font-size: 12px;
  color: #999;
}

.item-price {
  text-align: right;
}

.item-price .price {
  font-size: 15px;
  font-weight: bold;
  display: block;
}

.item-price .quantity {
  font-size: 12px;
  color: #999;
}

.amount-section {
  text-align: right;
}

.amount-row {
  padding: 8px 0;
  font-size: 14px;
}

.amount-row .label {
  color: #999;
  margin-right: 20px;
}

.amount-row .discount {
  color: #ff4400;
}

.amount-row.total {
  border-top: 1px solid #f0f0f0;
  margin-top: 10px;
  padding-top: 15px;
}

.total-price {
  font-size: 20px;
  font-weight: bold;
  color: #ff4400;
}

.info-section {
  font-size: 14px;
}

.info-row {
  padding: 8px 0;
}

.info-row .label {
  color: #999;
}

.bottom-actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  padding: 20px 0;
}
</style>
