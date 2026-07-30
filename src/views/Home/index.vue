<template>
  <div class="home-page">
    <div class="container">
      <Banner />
      <CategoryNav />

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

      <section class="section promo-banner">
        <div class="promo-cards">
          <router-link to="/games" class="promo-card promo-games">
            <div class="promo-icon">
              <el-icon :size="28"><Trophy /></el-icon>
            </div>
            <div class="promo-content">
              <span class="promo-title">赚米中心</span>
              <span class="promo-desc">做任务玩游戏，赚取海量积分</span>
            </div>
            <div class="promo-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </router-link>
          <router-link to="/leaderboard" class="promo-card promo-leaderboard">
            <div class="promo-icon">
              <el-icon :size="28"><Trophy /></el-icon>
            </div>
            <div class="promo-content">
              <span class="promo-title">全服排行榜</span>
              <span class="promo-desc">与全服玩家一较高下</span>
            </div>
            <div class="promo-arrow">
              <el-icon><ArrowRight /></el-icon>
            </div>
          </router-link>
        </div>
      </section>

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
        <SkeletonLoader v-if="loading" type="product-card" :count="4" />
        <div class="product-grid" v-else>
          <ProductCard
            v-for="product in hotProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </section>

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
        <SkeletonLoader v-if="loading" type="product-card" :count="4" />
        <div class="product-grid" v-else>
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
import { Timer, TrendCharts, Star, ArrowRight, Trophy } from '@element-plus/icons-vue'
import { useDevice } from '../../utils/device'
import Banner from '../../components/Banner/index.vue'
import CategoryNav from '../../components/CategoryNav/index.vue'
import ProductCard from '../../components/ProductCard/index.vue'
import SkeletonLoader from '../../components/SkeletonLoader/index.vue'
import products from '../../data/products.json'

const { isMobile } = useDevice()
const router = useRouter()
const loading = ref(true)

onMounted(() => {
  startCountdown()
  setTimeout(() => {
    loading.value = false
  }, 500)
})

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

onUnmounted(() => {
  if (countdownTimer) {
    clearInterval(countdownTimer)
  }
})

const flashSaleItems = ref([
  { id: 1, name: 'iPhone 15', image: 'https://picsum.photos/200/200?random=201', price: 7999, originalPrice: 9999, sold: 856, total: 1000 },
  { id: 2, name: '华为Mate60', image: 'https://picsum.photos/200/200?random=202', price: 5999, originalPrice: 6999, sold: 623, total: 800 },
  { id: 3, name: '小米14', image: 'https://picsum.photos/200/200?random=203', price: 3999, originalPrice: 4999, sold: 456, total: 600 },
  { id: 4, name: 'MacBook Pro', image: 'https://picsum.photos/200/200?random=204', price: 12999, originalPrice: 14999, sold: 234, total: 400 },
  { id: 5, name: 'Sony耳机', image: 'https://picsum.photos/200/200?random=205', price: 1999, originalPrice: 2499, sold: 892, total: 1200 }
])

const hotProducts = ref(products.slice(0, 4))
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
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.flash-sale-list::-webkit-scrollbar {
  display: none;
}

.flash-sale-item {
  min-width: 180px;
  background: #fff;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  scroll-snap-align: start;
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

.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.promo-banner {
  background: transparent !important;
  padding: 0 !important;
}

.promo-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.promo-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  border-radius: 12px;
  text-decoration: none;
  transition: all 0.3s;
  cursor: pointer;
}

.promo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.promo-games {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.promo-leaderboard {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.promo-icon {
  flex-shrink: 0;
  display: flex;
}

.promo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.promo-title {
  font-size: 18px;
  font-weight: bold;
  color: #fff;
}

.promo-desc {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
}

.promo-arrow {
  color: rgba(255,255,255,0.6);
  font-size: 18px;
}

@media (max-width: 768px) {
  .promo-cards {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  .promo-card {
    padding: 14px 18px;
  }
  .promo-title {
    font-size: 15px;
  }
  .promo-desc {
    font-size: 12px;
  }
}

@media (max-width: 768px) {
  .home-page {
    padding: 12px 0;
  }

  .section {
    padding: 15px;
    margin-bottom: 12px;
    border-radius: 0;
  }

  .section-header h2 {
    font-size: 16px;
  }

  .countdown {
    font-size: 12px;
  }

  .countdown .time {
    padding: 3px 6px;
    font-size: 12px;
  }

  .flash-sale-list {
    gap: 10px;
  }

  .flash-sale-item {
    min-width: 140px;
    padding: 10px;
  }

  .current-price {
    font-size: 15px;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
