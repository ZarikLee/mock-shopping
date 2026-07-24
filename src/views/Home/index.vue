<template>
  <div class="home-page">
    <div class="container">
      <!-- 轮播图 -->
      <Banner />
      
      <!-- 分类导航 -->
      <CategoryNav />
      
      <!-- 秒杀专区 -->
      <section class="section flash-sale">
        <div class="section-header">
          <h2>
            <el-icon><Timer /></el-icon>
            限时秒杀
          </h2>
          <div class="countdown">
            <span>距结束</span>
            <span class="time">{{ hours }}</span>
            <span class="separator">:</span>
            <span class="time">{{ minutes }}</span>
            <span class="separator">:</span>
            <span class="time">{{ seconds }}</span>
          </div>
        </div>
        <div class="flash-sale-list">
          <div 
            v-for="item in flashSaleItems" 
            :key="item.id"
            class="flash-sale-item"
            @click="goToProduct(item.id)"
          >
            <div class="item-image">
              <img :src="item.image" :alt="item.name" />
              <div class="discount-badge">
                {{ Math.round((item.price / item.originalPrice) * 10) }}折
              </div>
            </div>
            <div class="item-info">
              <span class="current-price">¥{{ item.price }}</span>
              <span class="original-price">¥{{ item.originalPrice }}</span>
            </div>
            <el-progress 
              :percentage="Math.round((item.sold / item.total) * 100)" 
              :stroke-width="8"
              color="#ff4400"
            />
          </div>
        </div>
      </section>

      <!-- 热门推荐 -->
      <section class="section hot-recommend">
        <div class="section-header">
          <h2>
            <el-icon><TrendCharts /></el-icon>
            热门推荐
          </h2>
          <router-link to="/products" class="more">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </div>
        <div class="product-grid">
          <ProductCard 
            v-for="product in hotProducts" 
            :key="product.id" 
            :product="product" 
          />
        </div>
      </section>

      <!-- 新品上市 -->
      <section class="section new-arrivals">
        <div class="section-header">
          <h2>
            <el-icon><Star /></el-icon>
            新品上市
          </h2>
          <router-link to="/products" class="more">
            查看更多
            <el-icon><ArrowRight /></el-icon>
          </router-link>
        </div>
        <div class="product-grid">
          <ProductCard 
            v-for="product in newArrivals" 
            :key="product.id" 
            :product="product" 
          />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Timer, TrendCharts, Star, ArrowRight } from '@element-plus/icons-vue'
import Banner from '../../components/Banner/index.vue'
import CategoryNav from '../../components/CategoryNav/index.vue'
import ProductCard from '../../components/ProductCard/index.vue'
import products from '../../data/products.json'

const router = useRouter()

// 倒计时
const hours = ref('02')
const minutes = ref('30')
const seconds = ref('00')
let countdownTimer = null

const startCountdown = () => {
  let totalSeconds = 2 * 3600 + 30 * 60
  
  countdownTimer = setInterval(() => {
    if (totalSeconds > 0) {
      totalSeconds--
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      hours.value = String(h).padStart(2, '0')
      minutes.value = String(m).padStart(2, '0')
      seconds.value = String(s).padStart(2, '0')
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

onMounted(() => {
  startCountdown()
})

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

// 秒杀商品
const flashSaleItems = ref([
  { id: 1, name: 'iPhone 15', image: 'https://picsum.photos/200/200?random=201', price: 7999, originalPrice: 9999, sold: 856, total: 1000 },
  { id: 2, name: '华为Mate60', image: 'https://picsum.photos/200/200?random=202', price: 5999, originalPrice: 6999, sold: 623, total: 800 },
  { id: 3, name: '小米14', image: 'https://picsum.photos/200/200?random=203', price: 3999, originalPrice: 4999, sold: 456, total: 600 },
  { id: 4, name: 'MacBook Pro', image: 'https://picsum.photos/200/200?random=204', price: 12999, originalPrice: 14999, sold: 234, total: 400 },
  { id: 5, name: 'Sony耳机', image: 'https://picsum.photos/200/200?random=205', price: 1999, originalPrice: 2499, sold: 892, total: 1200 }
])

// 热门推荐
const hotProducts = ref(products.slice(0, 4))

// 新品上市
const newArrivals = ref(products.slice(4, 8))

const goToProduct = (id) => {
  router.push(`/product/${id}`)
}
</script>

<style scoped>
.home-page {
  padding: 20px 0;
}

.section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  font-size: 20px;
  font-weight: bold;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-header h2 .el-icon {
  color: #ff4400;
}

.more {
  font-size: 14px;
  color: #999;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: color 0.3s;
}

.more:hover {
  color: #ff4400;
}

/* 秒杀专区 */
.flash-sale {
  background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
}

.countdown {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 14px;
  color: #666;
}

.countdown .time {
  background: #333;
  color: #fff;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.countdown .separator {
  font-weight: bold;
  color: #333;
}

.flash-sale-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
}

.flash-sale-item {
  min-width: 180px;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
}

.flash-sale-item:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.item-image {
  position: relative;
  margin-bottom: 10px;
}

.item-image img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: 8px;
}

.discount-badge {
  position: absolute;
  top: 0;
  right: 0;
  background: #ff4400;
  color: #fff;
  padding: 4px 8px;
  border-radius: 0 8px 0 8px;
  font-size: 12px;
  font-weight: bold;
}

.item-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 10px;
}

.current-price {
  font-size: 18px;
  font-weight: bold;
  color: #ff4400;
}

.original-price {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
}

/* 产品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .flash-sale-list {
    gap: 10px;
  }
  
  .flash-sale-item {
    min-width: 140px;
  }
}
</style>
