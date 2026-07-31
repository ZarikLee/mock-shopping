<template>
  <div class="cart-page">
    <div class="container">
      <BackButton />

      <div class="cart-header">
        <h1>我的购物车</h1>
        <span class="total-count">共 <span class="count">{{ cartStore.itemCount }}</span> 件商品</span>
      </div>

      <SkeletonLoader v-if="loading" type="cart" :count="3" />

      <div class="cart-content" v-else-if="cartStore.items.length > 0">
        <PromotionBar :total-amount="cartStore.totalPrice" type="cart" />

        <div class="cart-table-header" v-if="!isMobile">
          <div class="col checkbox">
            <el-checkbox
              :model-value="cartStore.isSelectedAll"
              @change="cartStore.toggleSelectAll"
            >
              全选
            </el-checkbox>
          </div>
          <div class="col product">商品信息</div>
          <div class="col price">单价</div>
          <div class="col quantity">数量</div>
          <div class="col subtotal">小计</div>
          <div class="col action">操作</div>
        </div>

        <div class="cart-table-body">
          <div
            v-for="item in cartStore.items"
            :key="item.id"
            class="cart-item"
          >
            <div class="col checkbox">
              <el-checkbox
                :model-value="item.selected"
                @change="cartStore.toggleSelected(item.id)"
              />
            </div>
            <div class="col product">
              <router-link :to="`/product/${item.productId}`" class="item-image">
                <img :src="item.image" :alt="item.name" />
              </router-link>
              <div class="item-info">
                <router-link :to="`/product/${item.productId}`" class="item-name text-ellipsis-2">
                  {{ item.name }}
                </router-link>
                <div class="item-spec">
                  <span v-if="item.selectedSpec">{{ item.selectedSpec }}</span>
                  <span v-if="item.selectedColor"> / {{ item.selectedColor }}</span>
                </div>
                <div class="item-price-mobile" v-if="isMobile">
                  <span class="current-price">¥{{ item.price }}</span>
                  <span v-if="item.originalPrice > item.price" class="original-price">¥{{ item.originalPrice }}</span>
                </div>
              </div>
            </div>
            <div class="col price" v-if="!isMobile">
              <span class="current-price">¥{{ item.price }}</span>
              <span v-if="item.originalPrice > item.price" class="original-price">¥{{ item.originalPrice }}</span>
            </div>
            <div class="col quantity">
              <el-input-number
                :model-value="item.quantity"
                :min="1"
                :max="99"
                :size="isMobile ? 'small' : 'small'"
                controls-position="right"
                @change="(val) => cartStore.updateQuantity(item.id, val)"
              />
            </div>
            <div class="col subtotal" v-if="!isMobile">
              <span class="subtotal-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
            <div class="col action">
              <el-button type="danger" link size="small" @click="cartStore.removeFromCart(item.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <div class="cart-footer" :class="{ 'mobile-footer': isMobile }">
          <div class="footer-left">
            <el-checkbox
              :model-value="cartStore.isSelectedAll"
              @change="cartStore.toggleSelectAll"
            >
              全选
            </el-checkbox>
            <el-button v-if="!isMobile" type="danger" link @click="cartStore.removeSelected">
              删除选中商品
            </el-button>
            <el-button v-if="!isMobile" type="danger" link @click="cartStore.clearCart">
              清空购物车
            </el-button>
          </div>
          <div class="footer-right">
            <div class="summary" v-if="!isMobile">
              <span class="label">已选商品</span>
              <span class="count">{{ cartStore.selectedItems.length }} 件</span>
            </div>
            <div class="total">
              <span class="label">合计：</span>
              <span class="total-price">
                <span class="price-symbol">¥</span>
                <span class="price-value">{{ cartStore.totalPrice.toFixed(2) }}</span>
              </span>
            </div>
            <div v-if="cartStore.totalPrice > userStore.balance" class="insufficient-tip">
              <span>余额不足，还差 ¥{{ (cartStore.totalPrice - userStore.balance).toFixed(2) }}</span>
              <router-link to="/games" class="earn-link">去赚米中心赚钱 →</router-link>
            </div>
            <el-button
              type="primary"
              :size="isMobile ? 'default' : 'large'"
              class="btn-checkout"
              :class="{ 'btn-checkout-mobile': isMobile }"
              :disabled="cartStore.selectedItems.length === 0"
              @click="goToCheckout"
            >
              去结算{{ isMobile ? ` (${cartStore.selectedItems.length})` : '' }}
            </el-button>
          </div>
        </div>
      </div>

      <div class="cart-empty" v-else-if="!loading">
        <el-icon :size="80" color="#ccc"><ShoppingCart /></el-icon>
        <h2>购物车是空的</h2>
        <p>快去挑选心仪的商品吧</p>
        <el-button type="primary" @click="goToShopping">去逛逛</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ShoppingCart } from '@element-plus/icons-vue'
import { useCartStore } from '../../stores/cart'
import { useUserStore } from '../../stores/user'
import { useDevice } from '../../utils/device'
import BackButton from '../../components/BackButton/index.vue'
import PromotionBar from '../../components/PromotionBar/index.vue'
import SkeletonLoader from '../../components/SkeletonLoader/index.vue'

const { isMobile } = useDevice()
const router = useRouter()
const cartStore = useCartStore()
const userStore = useUserStore()
const loading = ref(true)

onMounted(() => {
  document.title = '购物车 - 淘大宝'
  setTimeout(() => {
    loading.value = false
  }, 300)
})

const goToCheckout = () => {
  router.push('/checkout')
}

const goToShopping = () => {
  router.push('/')
}
</script>

<style scoped>
.cart-page {
  padding: 20px 0;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.cart-header h1 {
  font-size: 24px;
  font-weight: bold;
}

.total-count {
  font-size: 14px;
  color: #999;
}

.total-count .count {
  color: #ff4400;
  font-weight: bold;
}

.cart-content {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.cart-table-header {
  display: flex;
  align-items: center;
  padding: 15px 20px;
  background: #f8f8f8;
  border-bottom: 1px solid #e8e8e8;
}

.col.checkbox { width: 80px; }
.col.product { flex: 1; }
.col.price { width: 120px; text-align: center; }
.col.quantity { width: 140px; text-align: center; }
.col.subtotal { width: 120px; text-align: center; }
.col.action { width: 80px; text-align: center; }

.cart-item {
  display: flex;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  transition: background 0.3s;
}

.cart-item:hover {
  background: #fafafa;
}

.cart-item .product {
  display: flex;
  gap: 15px;
}

.item-image {
  width: 100px;
  height: 100px;
  border-radius: 4px;
  overflow: hidden;
  flex-shrink: 0;
}

.item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  font-size: 14px;
  color: #333;
  line-height: 1.4;
  display: block;
  margin-bottom: 8px;
  transition: color 0.3s;
}

.item-name:hover {
  color: #ff4400;
}

.item-spec {
  font-size: 12px;
  color: #999;
}

.price .current-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff4400;
}

.price .original-price {
  font-size: 12px;
  color: #999;
  text-decoration: line-through;
  display: block;
}

.subtotal .subtotal-price {
  font-size: 16px;
  font-weight: bold;
  color: #ff4400;
}

.cart-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: #fff;
  border-top: 1px solid #e8e8e8;
  position: sticky;
  bottom: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.footer-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.footer-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.summary .count {
  color: #ff4400;
  font-weight: bold;
}

.total-price {
  color: #ff4400;
  font-weight: bold;
}

.total-price .price-symbol {
  font-size: 14px;
}

.total-price .price-value {
  font-size: 22px;
}

.btn-checkout {
  padding: 12px 40px;
  font-size: 16px;
}

.insufficient-tip {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: #ff4d4f;
  font-size: 12px;
}

.earn-link {
  color: #ff4400;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
  transition: color 0.3s;
}

.earn-link:hover {
  color: #e63e00;
  text-decoration: underline;
}

.cart-empty {
  background: #fff;
  border-radius: 8px;
  padding: 80px 20px;
  text-align: center;
}

.cart-empty h2 {
  font-size: 20px;
  color: #333;
  margin: 20px 0 10px;
}

.cart-empty p {
  font-size: 14px;
  color: #999;
  margin-bottom: 25px;
}

@media (max-width: 768px) {
  .cart-page {
    padding: 12px 0;
  }

  .cart-header {
    padding: 0 12px;
    margin-bottom: 12px;
  }

  .cart-header h1 {
    font-size: 18px;
  }

  .cart-table-header {
    display: none;
  }

  .cart-item {
    flex-wrap: wrap;
    gap: 12px;
    padding: 15px;
  }

  .col.checkbox {
    width: auto;
  }

  .col.product {
    width: calc(100% - 80px);
    order: 1;
  }

  .col.quantity {
    width: auto;
    order: 2;
    margin-left: 80px;
  }

  .col.action {
    width: auto;
    order: 3;
  }

  .item-image {
    width: 80px;
    height: 80px;
  }

  .item-price-mobile {
    margin-top: 8px;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .item-price-mobile .current-price {
    font-size: 15px;
    font-weight: bold;
    color: #ff4400;
  }

  .item-price-mobile .original-price {
    font-size: 12px;
    color: #999;
    text-decoration: line-through;
  }

  .col.quantity :deep(.el-input-number) {
    width: 100px;
  }

  .col.quantity :deep(.el-input-number .el-input__inner) {
    padding: 0 24px;
    height: 28px;
    font-size: 12px;
  }

  .col.quantity :deep(.el-input-number .el-input-number__decrease),
  .col.quantity :deep(.el-input-number .el-input-number__increase) {
    width: 22px;
  }

  .cart-footer.mobile-footer {
    flex-direction: row;
    padding: 12px 15px;
    padding-bottom: calc(12px + env(safe-area-inset-bottom, 0));
    position: sticky;
    bottom: 0;
  }

  .footer-left {
    gap: 8px;
  }

  .footer-left :deep(.el-checkbox) {
    font-size: 13px;
  }

  .footer-right {
    gap: 10px;
    flex: 1;
    justify-content: flex-end;
  }

  .total-price .price-value {
    font-size: 16px;
  }

  .btn-checkout-mobile {
    padding: 8px 16px;
    font-size: 13px;
    white-space: nowrap;
  }
}
</style>
