<template>
  <div class="product-detail-page" v-if="product">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>{{ product.category }}</el-breadcrumb-item>
      <el-breadcrumb-item>{{ product.name }}</el-breadcrumb-item>
    </el-breadcrumb>

    <div class="product-main">
      <div class="product-gallery">
        <div class="main-image-container">
          <img :src="currentImage" :alt="product.name" class="main-image" />
        </div>
        <div class="thumbnail-list">
          <div
            v-for="(img, index) in product.images"
            :key="index"
            class="thumbnail-item"
            :class="{ active: currentImageIndex === index }"
            @mouseenter="currentImageIndex = index"
          >
            <img :src="img" :alt="`${product.name} - ${index + 1}`" />
          </div>
        </div>
      </div>

      <div class="product-info">
        <h1 class="product-name">{{ product.name }}</h1>
        <div class="product-subtitle">{{ product.subtitle }}</div>

        <div class="price-section">
          <div class="current-price">
            <span class="price-label">价格</span>
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ product.price }}</span>
          </div>
          <div class="original-price" v-if="product.originalPrice">
            <span class="price-label">原价</span>
            <span class="price-original">¥{{ product.originalPrice }}</span>
            <span class="discount-tag" v-if="discountPercent">{{ discountPercent }}折</span>
          </div>
        </div>

        <div class="product-stats">
          <span class="stat-item">
            <span class="stat-label">销量</span>
            <span class="stat-value">{{ product.sales }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">评分</span>
            <span class="stat-value">{{ product.rating }}</span>
          </span>
          <span class="stat-item">
            <span class="stat-label">评价</span>
            <span class="stat-value">{{ product.reviews }}</span>
          </span>
        </div>

        <div class="spec-section">
          <div class="spec-group" v-if="product.specs && product.specs.length">
            <span class="spec-label">规格</span>
            <div class="spec-options">
              <div
                v-for="spec in product.specs"
                :key="spec"
                class="spec-option"
                :class="{ active: selectedSpec === spec }"
                @click="selectedSpec = spec"
              >
                {{ spec }}
              </div>
            </div>
          </div>

          <div class="spec-group" v-if="product.colors && product.colors.length">
            <span class="spec-label">颜色</span>
            <div class="spec-options">
              <div
                v-for="color in product.colors"
                :key="color"
                class="spec-option"
                :class="{ active: selectedColor === color }"
                @click="selectedColor = color"
              >
                {{ color }}
              </div>
            </div>
          </div>
        </div>

        <div class="quantity-section">
          <span class="quantity-label">数量</span>
          <el-input-number
            v-model="quantity"
            :min="1"
            :max="product.库存 || 99"
            size="large"
          />
          <span class="stock-info">库存 {{ product.库存 || 99 }} 件</span>
        </div>

        <div class="action-buttons">
          <el-button
            type="primary"
            size="large"
            class="add-to-cart-btn"
            @click="handleAddToCart"
          >
            <el-icon><ShoppingCart /></el-icon>
            加入购物车
          </el-button>
          <el-button
            type="danger"
            size="large"
            class="buy-now-btn"
            @click="handleBuyNow"
          >
            立即购买
          </el-button>
        </div>

        <div class="service-bar">
          <div class="service-item">
            <el-icon><CircleCheck /></el-icon>
            <span>正品保障</span>
          </div>
          <div class="service-item">
            <el-icon><Timer /></el-icon>
            <span>极速发货</span>
          </div>
          <div class="service-item">
            <el-icon><RefreshRight /></el-icon>
            <span>七天退换</span>
          </div>
        </div>
      </div>
    </div>

    <div class="product-tabs">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="商品详情" name="detail">
          <div class="detail-content">
            <div class="detail-images">
              <img
                v-for="(img, index) in product.images"
                :key="index"
                :src="img"
                :alt="`${product.name} 详情图 - ${index + 1}`"
              />
            </div>
            <div class="detail-text">
              <p>{{ product.description || '暂无详细描述' }}</p>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="规格参数" name="specs">
          <div class="specs-table">
            <table>
              <tbody>
                <tr>
                  <td class="spec-name">品牌</td>
                  <td class="spec-value">{{ product.brand || '未知品牌' }}</td>
                </tr>
                <tr>
                  <td class="spec-name">型号</td>
                  <td class="spec-value">{{ product.model || product.name }}</td>
                </tr>
                <tr v-if="product.specs">
                  <td class="spec-name">规格</td>
                  <td class="spec-value">{{ product.specs.join(' / ') }}</td>
                </tr>
                <tr v-if="product.colors">
                  <td class="spec-name">颜色</td>
                  <td class="spec-value">{{ product.colors.join(' / ') }}</td>
                </tr>
                <tr>
                  <td class="spec-name">产地</td>
                  <td class="spec-value">中国</td>
                </tr>
              </tbody>
            </table>
          </div>
        </el-tab-pane>

        <el-tab-pane label="用户评价" name="reviews">
          <div class="reviews-section">
            <div class="review-summary">
              <div class="review-score">
                <span class="score-number">{{ product.rating }}</span>
                <span class="score-label">综合评分</span>
              </div>
              <div class="review-tags">
                <el-tag type="success">好评 ({{ Math.floor(product.reviews * 0.85) }})</el-tag>
                <el-tag type="warning">中评 ({{ Math.floor(product.reviews * 0.1) }})</el-tag>
                <el-tag type="danger">差评 ({{ Math.floor(product.reviews * 0.05) }})</el-tag>
              </div>
            </div>
            <div class="review-list">
              <div
                v-for="review in mockReviews"
                :key="review.id"
                class="review-item"
              >
                <div class="review-header">
                  <el-avatar :size="40">{{ review.avatar }}</el-avatar>
                  <div class="review-user-info">
                    <span class="review-username">{{ review.username }}</span>
                    <el-rate
                      v-model="review.rating"
                      disabled
                      show-score
                      score-template="{value}"
                    />
                  </div>
                  <span class="review-date">{{ review.date }}</span>
                </div>
                <div class="review-content">
                  <p>{{ review.content }}</p>
                </div>
                <div class="review-specs" v-if="review.spec">
                  <el-tag size="small">{{ review.spec }}</el-tag>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </div>
  </div>

  <div class="product-not-found" v-else>
    <el-empty description="商品不存在或已下架" />
    <el-button type="primary" @click="$router.push('/')">返回首页</el-button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ShoppingCart, CircleCheck, Timer, RefreshRight } from '@element-plus/icons-vue'
import { useCartStore } from '@/stores/cart'
import products from '@/data/products.json'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()

const productId = computed(() => Number(route.params.id))
const product = computed(() =>
  products.find(p => p.id === productId.value)
)

const currentImageIndex = ref(0)
const currentImage = computed(() =>
  product.value?.images?.[currentImageIndex.value] || ''
)

const selectedSpec = ref('')
const selectedColor = ref('')
const quantity = ref(1)
const activeTab = ref('detail')

const discountPercent = computed(() => {
  if (product.value?.originalPrice) {
    return Math.round(product.value.price / product.value.originalPrice * 10) / 10
  }
  return null
})

const mockReviews = computed(() => [
  {
    id: 1,
    username: '用户***8',
    avatar: '张',
    rating: 5,
    date: '2026-07-20',
    content: '非常满意！质量很好，物流也很快，包装很仔细。客服态度也很好，有问题及时解答。下次还会回购！',
    spec: product.value?.specs?.[0] || '默认规格'
  },
  {
    id: 2,
    username: '用户***2',
    avatar: '李',
    rating: 4,
    date: '2026-07-18',
    content: '整体还不错，做工精细，颜色跟图片一致。就是发货稍微慢了点，总体满意。',
    spec: product.value?.specs?.[0] || '默认规格'
  },
  {
    id: 3,
    username: '用户***5',
    avatar: '王',
    rating: 5,
    date: '2026-07-15',
    content: '第二次购买了，品质一如既往的好，推荐给朋友们了。性价比很高，值得入手！',
    spec: product.value?.specs?.[0] || '默认规格'
  },
  {
    id: 4,
    username: '用户***1',
    avatar: '赵',
    rating: 4,
    date: '2026-07-12',
    content: '宝贝收到了，质量不错，手感很好。就是价格稍微有点贵，不过一分钱一分货吧。',
    spec: product.value?.specs?.[0] || '默认规格'
  }
])

onMounted(() => {
  if (product.value?.specs?.length) {
    selectedSpec.value = product.value.specs[0]
  }
  if (product.value?.colors?.length) {
    selectedColor.value = product.value.colors[0]
  }
})

const handleAddToCart = () => {
  if (!product.value) return
  cartStore.addToCart({
    id: product.value.id,
    name: product.value.name,
    price: product.value.price,
    image: product.value.images?.[0],
    spec: selectedSpec.value,
    color: selectedColor.value,
    quantity: quantity.value
  })
  ElMessage.success('已加入购物车')
}

const handleBuyNow = () => {
  if (!product.value) return
  cartStore.addToCart({
    id: product.value.id,
    name: product.value.name,
    price: product.value.price,
    image: product.value.images?.[0],
    spec: selectedSpec.value,
    color: selectedColor.value,
    quantity: quantity.value
  })
  router.push('/checkout')
}
</script>

<style scoped>
.product-detail-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.product-main {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.product-gallery {
  flex: 0 0 450px;
}

.main-image-container {
  width: 450px;
  height: 450px;
  border: 1px solid #eee;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 10px;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.thumbnail-list {
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.thumbnail-item {
  flex: 0 0 60px;
  height: 60px;
  border: 2px solid #eee;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 0.3s;
}

.thumbnail-item:hover,
.thumbnail-item.active {
  border-color: #ff4400;
}

.thumbnail-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-info {
  flex: 1;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 0 0 10px;
  line-height: 1.4;
}

.product-subtitle {
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.price-section {
  background: #fff5f0;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.current-price {
  display: flex;
  align-items: baseline;
  margin-bottom: 10px;
}

.price-label {
  color: #666;
  margin-right: 10px;
}

.price-symbol {
  color: #ff4400;
  font-size: 18px;
  font-weight: bold;
}

.price-value {
  color: #ff4400;
  font-size: 32px;
  font-weight: bold;
}

.original-price {
  display: flex;
  align-items: center;
  gap: 10px;
}

.price-original {
  color: #999;
  text-decoration: line-through;
}

.discount-tag {
  background: #ff4400;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.product-stats {
  display: flex;
  gap: 40px;
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-label {
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}

.stat-value {
  color: #333;
  font-size: 18px;
  font-weight: bold;
}

.spec-section {
  margin-bottom: 20px;
}

.spec-group {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15px;
}

.spec-label {
  color: #666;
  margin-right: 20px;
  min-width: 50px;
  padding-top: 8px;
}

.spec-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.spec-option {
  padding: 8px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.spec-option:hover {
  border-color: #ff4400;
  color: #ff4400;
}

.spec-option.active {
  border-color: #ff4400;
  color: #ff4400;
  background: #fff5f0;
}

.quantity-section {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
}

.quantity-label {
  color: #666;
}

.stock-info {
  color: #999;
  font-size: 12px;
}

.action-buttons {
  display: flex;
  gap: 15px;
  margin-bottom: 25px;
}

.add-to-cart-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
  background: #ff4400;
  border-color: #ff4400;
}

.add-to-cart-btn:hover {
  background: #ff6633;
  border-color: #ff6633;
}

.buy-now-btn {
  flex: 1;
  height: 50px;
  font-size: 16px;
}

.service-bar {
  display: flex;
  gap: 30px;
  padding: 15px;
  background: #f8f8f8;
  border-radius: 8px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.service-item .el-icon {
  color: #ff4400;
}

.product-tabs {
  margin-top: 40px;
}

.detail-content {
  padding: 20px 0;
}

.detail-images {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.detail-images img {
  max-width: 100%;
  margin-bottom: 20px;
}

.detail-text {
  color: #666;
  line-height: 1.8;
}

.specs-table {
  padding: 20px 0;
}

.specs-table table {
  width: 100%;
  border-collapse: collapse;
}

.specs-table td {
  padding: 12px 20px;
  border: 1px solid #eee;
}

.specs-table .spec-name {
  background: #f8f8f8;
  width: 120px;
  color: #666;
}

.specs-table .spec-value {
  color: #333;
}

.reviews-section {
  padding: 20px 0;
}

.review-summary {
  display: flex;
  align-items: center;
  gap: 40px;
  padding: 20px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 30px;
}

.review-score {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  color: #ff4400;
}

.score-label {
  color: #666;
  margin-top: 5px;
}

.review-tags {
  display: flex;
  gap: 10px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.review-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.review-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
}

.review-user-info {
  flex: 1;
}

.review-username {
  display: block;
  color: #333;
  font-weight: bold;
  margin-bottom: 5px;
}

.review-date {
  color: #999;
  font-size: 12px;
}

.review-content {
  color: #666;
  line-height: 1.6;
}

.review-specs {
  margin-top: 10px;
}

.product-not-found {
  text-align: center;
  padding: 100px 20px;
}

.product-not-found .el-button {
  margin-top: 20px;
}

@media (max-width: 768px) {
  .product-main {
    flex-direction: column;
    gap: 20px;
  }

  .product-gallery {
    flex: none;
    width: 100%;
  }

  .main-image-container {
    width: 100%;
    height: 300px;
  }

  .product-name {
    font-size: 18px;
  }

  .price-value {
    font-size: 24px;
  }

  .product-stats {
    gap: 20px;
  }

  .stat-item {
    flex: 1;
  }

  .spec-group {
    flex-direction: column;
    gap: 10px;
  }

  .spec-label {
    margin-right: 0;
  }

  .action-buttons {
    flex-direction: column;
  }

  .service-bar {
    flex-direction: column;
    gap: 15px;
  }

  .review-summary {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
