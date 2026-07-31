<template>
  <div class="product-card" @click="goToDetail">
    <WishlistButton :product="product" />
    <div class="product-image">
      <img :src="product.image" :alt="product.name" />
      <div class="product-tags">
        <span v-if="product.originalPrice > product.price" class="tag discount">
          {{ Math.round((product.price / product.originalPrice) * 10) }}折
        </span>
        <span v-if="product.sales > 10000" class="tag hot">热销</span>
      </div>
    </div>
    <div class="product-info">
      <h3 class="product-name text-ellipsis-2">{{ product.name }}</h3>
      <div class="product-price">
        <span class="price">
          <span class="price-symbol">¥</span>
          <span class="price-value">{{ product.price }}</span>
        </span>
        <span v-if="product.originalPrice > product.price" class="original-price">
          ¥{{ product.originalPrice }}
        </span>
      </div>
      <div class="product-meta">
        <span class="sales">已售 {{ formatSales(product.sales) }}</span>
        <span class="rating">{{ product.rating }}分</span>
      </div>
      <div class="product-shop">{{ product.shop }}</div>
    </div>
    <div class="product-action" @click.stop="addToCart">
      <el-button type="primary" size="small">
        <el-icon><ShoppingCart /></el-icon>
        加入购物车
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ShoppingCart } from '@element-plus/icons-vue'
import WishlistButton from '../../components/WishlistButton/index.vue'
import { useCartStore } from '../../stores/cart'
import { ElMessage } from 'element-plus'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const router = useRouter()
const cartStore = useCartStore()

const goToDetail = () => {
  router.push(`/product/${props.product.id}`)
}

const addToCart = () => {
  cartStore.addToCart(props.product)
  ElMessage.success('已加入购物车')
}

const formatSales = (sales) => {
  if (sales >= 10000) {
    return (sales / 10000).toFixed(1) + '万'
  }
  return sales
}
</script>

<style scoped>
.product-card {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s;
  cursor: pointer;
  position: relative;
  max-width: 100%;
  min-width: 0;
}

.product-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  transform: translateY(-4px);
}

.product-image {
  position: relative;
  padding-top: 100%;
  overflow: hidden;
}

.product-image img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

.product-tags {
  position: absolute;
  top: 10px;
  left: 10px;
  display: flex;
  gap: 5px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
}

.tag.discount {
  background: #ff4400;
  color: #fff;
}

.tag.hot {
  background: #ff6600;
  color: #fff;
}

.product-info {
  padding: 15px;
  min-width: 0;
}

.product-name {
  font-size: 14px;
  font-weight: normal;
  color: #333;
  line-height: 1.4;
  height: 40px;
  margin-bottom: 10px;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.product-price {
  margin-bottom: 8px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
}

.price {
  color: #ff4400;
  font-weight: bold;
  min-width: 0;
}

.price-symbol {
  font-size: 12px;
}

.price-value {
  font-size: 20px;
}

.original-price {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
  max-width: 100%;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.product-meta {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
  gap: 8px;
  min-width: 0;
}

.product-shop {
  font-size: 12px;
  color: #666;
  padding: 4px 8px;
  background: #f8f8f8;
  border-radius: 4px;
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-action {
  padding: 0 15px 15px;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.3s;
}

.product-card:hover .product-action {
  opacity: 1;
  transform: translateY(0);
}

.product-action .el-button {
  width: 100%;
}

@media (hover: none) {
  .product-action {
    opacity: 1;
    transform: none;
  }
}

@media (max-width: 768px) {
  .product-info {
    padding: 12px;
  }

  .product-name {
    font-size: 13px;
    height: 36px;
    margin-bottom: 8px;
  }

  .price-value {
    font-size: 17px;
  }

  .original-price {
    font-size: 12px;
    margin-left: 6px;
  }

  .product-action {
    padding: 0 12px 12px;
  }

  .product-action .el-button {
    padding: 8px 12px;
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .product-name {
    font-size: 12px;
  }

  .price-value {
    font-size: 15px;
  }

  .product-meta {
    font-size: 11px;
  }

  .product-shop {
    font-size: 11px;
  }
}
</style>
