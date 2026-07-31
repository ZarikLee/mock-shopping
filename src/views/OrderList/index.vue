<template>
  <div class="order-list-page">
    <div class="container">
      <BackButton />

      <h1 class="page-title">我的订单</h1>

      <!-- 订单状态筛选 -->
      <div class="order-tabs">
        <div 
          v-for="tab in statusTabs" 
          :key="tab.value"
          class="tab-item"
          :class="{ active: currentTab === tab.value }"
          @click="currentTab = tab.value"
        >
          {{ tab.label }}
          <span class="count" v-if="getOrderCount(tab.value) > 0">
            {{ getOrderCount(tab.value) }}
          </span>
        </div>
      </div>

      <SkeletonLoader v-if="loading" type="order" :count="3" />

      <!-- 订单列表 -->
      <div class="order-list" v-else-if="filteredOrders.length > 0">
        <div 
          v-for="order in filteredOrders" 
          :key="order.id"
          class="order-card"
        >
          <div class="order-header">
            <span class="order-no">订单号：{{ order.orderNo }}</span>
            <span class="order-status" :style="{ color: order.status.color }">
              {{ order.status.text }}
            </span>
          </div>
          
          <div class="order-body">
            <div 
              v-for="item in order.items" 
              :key="item.id"
              class="order-item"
            >
              <img :src="item.image" :alt="item.name" class="item-image" />
              <div class="item-info">
                <span class="item-name text-ellipsis-2">{{ item.name }}</span>
                <span class="item-spec">{{ item.selectedSpec }} {{ item.selectedColor }}</span>
              </div>
              <div class="item-price">
                <span class="price">¥{{ item.price }}</span>
                <span class="quantity">×{{ item.quantity }}</span>
              </div>
            </div>
          </div>

          <div class="order-footer">
            <div class="order-summary">
              <span>共 {{ order.items.reduce((t, i) => t + i.quantity, 0) }} 件商品</span>
              <span class="total">
                实付：<span class="total-price">¥{{ order.payAmount.toFixed(2) }}</span>
              </span>
            </div>
            <div class="order-actions">
              <el-button v-if="order.status.code === 0" type="primary" size="small" @click="goToPayment(order.id)">
                去支付
              </el-button>
              <el-button v-if="order.status.code === 0" size="small" @click="cancelOrder(order.id)">
                取消订单
              </el-button>
              <el-button v-if="order.status.code >= 5" type="primary" size="small" @click="viewOrder(order.id)">
                查看物流
              </el-button>
              <el-button size="small" @click="viewOrder(order.id)">查看详情</el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 无订单 -->
      <div class="no-orders" v-else-if="!loading">
        <el-icon :size="60" color="#ccc"><Document /></el-icon>
        <p>暂无相关订单</p>
        <el-button type="primary" @click="router.push('/')">去购物</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Document } from '@element-plus/icons-vue'
import { useOrderStore } from '../../stores/order'
import BackButton from '../../components/BackButton/index.vue'
import SkeletonLoader from '../../components/SkeletonLoader/index.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const orderStore = useOrderStore()
const loading = ref(true)

onMounted(() => {
  document.title = '我的订单 - 淘大宝'
})
onMounted(async () => {
  loading.value = true
  try {
    await orderStore.getOrders()
  } catch (e) {
    console.error(e)
  }
  loading.value = false
})

const currentTab = ref(-1)

const statusTabs = [
  { label: '全部', value: -1 },
  { label: '待付款', value: 0 },
  { label: '待发货', value: 2 },
  { label: '待收货', value: 3 },
  { label: '已完成', value: 7 }
]

const filteredOrders = computed(() => {
  if (currentTab.value === -1) {
    return orderStore.orders
  }
  return orderStore.orders.filter(o => o.status.code === currentTab.value)
})

const getOrderCount = (status) => {
  if (status === -1) return orderStore.orders.length
  return orderStore.orders.filter(o => o.status.code === status).length
}

const goToPayment = (orderId) => {
  router.push(`/payment/${orderId}`)
}

const viewOrder = (orderId) => {
  router.push(`/order/${orderId}`)
}

const cancelOrder = async (orderId) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    orderStore.cancelOrder(orderId)
    ElMessage.success('订单已取消')
  } catch {}
}
</script>

<style scoped>
.order-list-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.order-tabs {
  display: flex;
  background: #fff;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.tab-item {
  flex: 1;
  padding: 18px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  font-size: 15px;
}

.tab-item:hover {
  color: #ff4400;
}

.tab-item.active {
  color: #ff4400;
  font-weight: bold;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: #ff4400;
  border-radius: 2px;
}

.tab-item .count {
  background: #ff4400;
  color: #fff;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 10px;
  margin-left: 5px;
}

.order-card {
  background: #fff;
  border-radius: 8px;
  margin-bottom: 15px;
  overflow: hidden;
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 13px;
  color: #999;
}

.order-status {
  font-size: 14px;
  font-weight: bold;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
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
  color: #333;
  display: block;
}

.item-price .quantity {
  font-size: 12px;
  color: #999;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.order-summary {
  font-size: 14px;
  color: #666;
}

.order-summary .total {
  margin-left: 20px;
}

.total-price {
  color: #ff4400;
  font-weight: bold;
  font-size: 16px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.no-orders {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

.no-orders p {
  color: #999;
  margin: 15px 0 20px;
}

@media (max-width: 768px) {
  .order-tabs {
    overflow-x: auto;
  }
  
  .tab-item {
    min-width: 80px;
    font-size: 13px;
    padding: 15px 10px;
  }
  
  .order-footer {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
