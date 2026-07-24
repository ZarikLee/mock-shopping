<template>
  <div class="cart-page">
    <div class="container">
      <div class="cart-header">
        <h1>我的购物车</h1>
        <span class="total-count">共 <span class="count">{{ cartStore.itemCount }}</span> 件商品</span>
      </div>

      <!-- 购物车有商品 -->
      <div class="cart-content" v-if="cartStore.items.length > 0">
        <!-- 表头 -->
        <div class="cart-table-header">
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

        <!-- 商品列表 -->
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
              </div>
            </div>
            <div class="col price">
              <span class="current-price">¥{{ item.price }}</span>
              <span v-if="item.originalPrice > item.price" class="original-price">¥{{ item.originalPrice }}</span>
            </div>
            <div class="col quantity">
              <el-input-number 
                :model-value="item.quantity" 
                :min="1" 
                :max="99"
                size="small"
                @change="(val) => cartStore.updateQuantity(item.id, val)"
              />
            </div>
            <div class="col subtotal">
              <span class="subtotal-price">¥{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
            <div class="col action">
              <el-button type="danger" link @click="cartStore.removeFromCart(item.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>

        <!-- 结算栏 -->
        <div class="cart-footer">
          <div class="footer-left">
            <el-checkbox 
              :model-value="cartStore.isSelectedAll" 
              @change="cartStore.toggleSelectAll"
            >
              全选
            </el-checkbox>
            <el-button type="danger" link @click="cartStore.removeSelected">
              删除选中商品
            </el-button>
            <el-button type="danger" link @click="cartStore.clearCart">
              清空购物车
            </el-button>
          </div>
          <div class="footer-right">
            <div class="summary">
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
            <el-button 
              type="primary" 
              size="large" 
              class="btn-checkout"
              :disabled="cartStore.selectedItems.length === 0"
              @click="goToCheckout"
            >
              去结算
            </el-button>
          </div>
        </div>
      </div>

      <!-- 购物车为空 -->
      <div class="cart-empty" v-else>
        <el-icon :size="80" color="#ccc"><ShoppingCart /></el-icon>
        <h2>购物车是空的</h2>
        <p>快去挑选心仪的商品吧</p>
        <el-button type="primary" @click="goToShopping">去逛逛</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { ShoppingCart } from '@element-plus/icons-vue'
import { useCartStore } from '../../stores/cart'

const router = useRouter()
const cartStore = useCartStore()

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
  .cart-table-header {
    display: none;
  }
  
  .cart-item {
    flex-wrap: wrap;
    gap: 15px;
  }
  
  .col.checkbox { width: auto; }
  .col.product { width: 100%; order: 1; }
  .col.price { width: auto; order: 2; }
  .col.quantity { width: auto; order: 3; }
  .col.subtotal { width: auto; order: 4; flex: 1; text-align: right; }
  .col.action { width: auto; order: 5; }
  
  .cart-footer {
    flex-direction: column;
    gap: 15px;
  }
  
  .footer-right {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
