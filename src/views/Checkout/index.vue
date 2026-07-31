<template>
  <div class="checkout-page">
    <div class="container">
      <BackButton />

      <h1 class="page-title">确认订单</h1>

      <!-- 收货地址 -->
      <div class="section address-section">
        <h2 class="section-title">
          <el-icon><Location /></el-icon>
          收货地址
        </h2>
        <div class="address-list">
          <div 
            v-for="addr in userStore.userInfo?.addresses" 
            :key="addr.id"
            class="address-item"
            :class="{ active: selectedAddressId === addr.id }"
            @click="selectedAddressId = addr.id"
          >
            <div class="address-info">
              <span class="name">{{ addr.name }}</span>
              <span class="phone">{{ addr.phone }}</span>
              <el-tag v-if="addr.isDefault" type="danger" size="small">默认</el-tag>
            </div>
            <div class="address-detail">
              {{ addr.province }}{{ addr.city }}{{ addr.district }}{{ addr.detail }}
            </div>
            <div class="address-actions">
              <el-button type="primary" link size="small" @click.stop="editAddress(addr)">编辑</el-button>
              <el-button type="danger" link size="small" @click.stop="deleteAddress(addr.id)">删除</el-button>
            </div>
          </div>
          <div class="add-address-btn" @click="showAddressDialog = true">
            <el-icon><Plus /></el-icon>
            <span>新增收货地址</span>
          </div>
        </div>
      </div>

      <el-dialog v-model="showAddressDialog" :title="editingAddress ? '编辑地址' : '新增地址'" width="500px">
        <el-form :model="addressForm" label-width="80px">
          <el-form-item label="收货人"><el-input v-model="addressForm.name" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="addressForm.phone" /></el-form-item>
          <el-form-item label="省份"><el-input v-model="addressForm.province" /></el-form-item>
          <el-form-item label="城市"><el-input v-model="addressForm.city" /></el-form-item>
          <el-form-item label="区县"><el-input v-model="addressForm.district" /></el-form-item>
          <el-form-item label="详细地址"><el-input v-model="addressForm.detail" /></el-form-item>
          <el-form-item label="默认地址"><el-switch v-model="addressForm.isDefault" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showAddressDialog = false">取消</el-button>
          <el-button type="primary" @click="saveAddress">保存</el-button>
        </template>
      </el-dialog>

      <!-- 商品清单 -->
      <div class="section goods-section">
        <h2 class="section-title">
          <el-icon><ShoppingBag /></el-icon>
          商品清单
        </h2>
        <div class="goods-list">
          <div 
            v-for="item in cartStore.selectedItems" 
            :key="item.id"
            class="goods-item"
          >
            <img :src="item.image" :alt="item.name" class="goods-image" />
            <div class="goods-info">
              <span class="goods-name text-ellipsis-2">{{ item.name }}</span>
              <span class="goods-spec">{{ item.selectedSpec }} {{ item.selectedColor }}</span>
            </div>
            <div class="goods-price">
              <span class="price">¥{{ item.price }}</span>
              <span class="quantity">×{{ item.quantity }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 配送方式 -->
      <div class="section delivery-section">
        <h2 class="section-title">
          <el-icon><Van /></el-icon>
          配送方式
        </h2>
        <div class="delivery-options">
          <el-radio-group v-model="deliveryType">
            <el-radio :value="1">
              <span class="delivery-option">
                <span>顺丰速运</span>
                <span class="delivery-time">预计3-5天送达</span>
                <span class="delivery-price">免运费</span>
              </span>
            </el-radio>
            <el-radio :value="2">
              <span class="delivery-option">
                <span>京东物流</span>
                <span class="delivery-time">预计1-3天送达</span>
                <span class="delivery-price">¥10.00</span>
              </span>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 支付方式 -->
      <div class="section payment-section">
        <h2 class="section-title">
          <el-icon><CreditCard /></el-icon>
          支付方式
        </h2>
        <div class="payment-options">
          <el-radio-group v-model="paymentType">
            <el-radio :value="1">
              <span class="payment-option">
                <el-icon class="payment-icon"><Coin /></el-icon>
                <span>余额支付</span>
                <span class="balance">(可用余额: ¥{{ userStore.balance.toFixed(2) }})</span>
              </span>
            </el-radio>
            <el-radio :value="2">
              <span class="payment-option">
                <el-icon class="payment-icon"><CreditCard /></el-icon>
                <span>模拟支付宝</span>
              </span>
            </el-radio>
            <el-radio :value="3">
              <span class="payment-option">
                <el-icon class="payment-icon"><Phone /></el-icon>
                <span>模拟微信支付</span>
              </span>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 优惠券 -->
      <div class="section coupon-section">
        <h2 class="section-title">
          <el-icon><Ticket /></el-icon>
          使用优惠券
        </h2>
        <div class="coupon-list">
          <el-radio-group v-model="selectedCouponId">
            <el-radio :value="0">不使用优惠券</el-radio>
            <el-radio 
              v-for="coupon in userStore.userInfo?.coupons" 
              :key="coupon.id"
              :value="coupon.id"
            >
              <span class="coupon-item">
                <span class="coupon-amount">¥{{ coupon.amount }}</span>
                <span class="coupon-condition">满{{ coupon.minConsume }}可用</span>
                <span class="coupon-name">{{ coupon.name }}</span>
              </span>
            </el-radio>
          </el-radio-group>
        </div>
      </div>

      <!-- 订单汇总 -->
      <div class="section summary-section">
        <div class="summary-row">
          <span class="label">商品金额</span>
          <span class="value">¥{{ cartStore.totalPrice.toFixed(2) }}</span>
        </div>
        <div class="summary-row">
          <span class="label">运费</span>
          <span class="value">¥{{ deliveryFee.toFixed(2) }}</span>
        </div>
        <div class="summary-row" v-if="couponDiscount > 0">
          <span class="label">优惠券</span>
          <span class="value discount">-¥{{ couponDiscount.toFixed(2) }}</span>
        </div>
        <div class="summary-row total">
          <span class="label">应付总额</span>
          <span class="total-price">
            <span class="price-symbol">¥</span>
            <span class="price-value">{{ totalAmount.toFixed(2) }}</span>
          </span>
        </div>
      </div>

      <!-- 提交订单 -->
      <div class="submit-bar">
        <div class="submit-info">
          <span>共 {{ cartStore.selectedItems.length }} 件商品</span>
          <span class="total">
            应付总额：<span class="total-price">¥{{ totalAmount.toFixed(2) }}</span>
          </span>
        </div>
        <el-button 
          type="primary" 
          size="large" 
          class="btn-submit"
          @click="submitOrder"
        >
          提交订单
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Location, ShoppingBag, Van, CreditCard, Ticket, Coin, Phone, Plus } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import { useUserStore } from '../../stores/user'
import { useCartStore } from '../../stores/cart'
import { useOrderStore } from '../../stores/order'
import { ElMessage, ElMessageBox } from 'element-plus'
import { addressApi } from '../../api/addresses'

const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const orderStore = useOrderStore()

// 选中的地址
const defaultAddress = userStore.userInfo?.addresses?.find(a => a.isDefault)
const selectedAddressId = ref(defaultAddress?.id || userStore.userInfo?.addresses?.[0]?.id || 0)

// 配送方式
const deliveryType = ref(1)

// 支付方式
const paymentType = ref(1)

// 优惠券
const selectedCouponId = ref(0)

// 地址管理
const showAddressDialog = ref(false)
const editingAddress = ref(null)
const addressForm = reactive({ name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false })

const resetForm = () => {
  addressForm.name = ''
  addressForm.phone = ''
  addressForm.province = ''
  addressForm.city = ''
  addressForm.district = ''
  addressForm.detail = ''
  addressForm.isDefault = false
}

const editAddress = (addr) => {
  editingAddress.value = addr
  addressForm.name = addr.name
  addressForm.phone = addr.phone
  addressForm.province = addr.province
  addressForm.city = addr.city
  addressForm.district = addr.district
  addressForm.detail = addr.detail
  addressForm.isDefault = addr.isDefault
  showAddressDialog.value = true
}

const saveAddress = async () => {
  try {
    if (editingAddress.value) {
      await addressApi.update(editingAddress.value.id, { ...addressForm })
    } else {
      await addressApi.create({ ...addressForm })
    }
    showAddressDialog.value = false
    editingAddress.value = null
    resetForm()
    await userStore.fetchUserInfo()
    const addr = userStore.userInfo?.addresses?.find(a => a.isDefault) || userStore.userInfo?.addresses?.[0]
    if (addr) selectedAddressId.value = addr.id
    ElMessage.success(editingAddress.value ? '地址更新成功' : '地址添加成功')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const deleteAddress = async (id) => {
  try {
    await addressApi.delete(id)
    await userStore.fetchUserInfo()
    if (selectedAddressId.value === id) {
      const addr = userStore.userInfo?.addresses?.[0]
      selectedAddressId.value = addr?.id || 0
    }
    ElMessage.success('地址删除成功')
  } catch (e) {
    ElMessage.error(e?.message || '删除失败')
  }
}

onMounted(() => { document.title = '确认订单 - 淘大宝' })

// 运费
const deliveryFee = computed(() => deliveryType.value === 2 ? 10 : 0)

// 优惠券折扣
const couponDiscount = computed(() => {
  if (selectedCouponId.value === 0) return 0
  const coupon = userStore.userInfo?.coupons?.find(c => c.id === selectedCouponId.value)
  if (coupon && cartStore.totalPrice >= coupon.minConsume) {
    return coupon.amount
  }
  return 0
})

// 总金额
const totalAmount = computed(() => {
  return cartStore.totalPrice + deliveryFee.value - couponDiscount.value
})

// 提交订单
const submitOrder = async () => {
  if (!selectedAddressId.value) {
    ElMessage.warning('请选择收货地址')
    return
  }
  if (cartStore.selectedItems.length === 0) {
    ElMessage.warning('请选择商品')
    return
  }

  if (userStore.balance < totalAmount.value) {
    const need = (totalAmount.value - userStore.balance).toFixed(2)
    ElMessageBox.confirm(
      `余额不足，还差 ¥${need}。去赚米中心赚金币？`,
      '余额不足',
      { confirmButtonText: '去赚米', cancelButtonText: '再看看', type: 'warning' }
    ).then(() => {
      router.push('/games')
    }).catch(() => {})
    return
  }

  const address = userStore.userInfo.addresses.find(a => a.id === selectedAddressId.value)

  try {
    const order = await orderStore.createOrder({
      items: cartStore.selectedItems.map(item => ({
        ...item,
        productId: item.productId
      })),
      totalAmount: cartStore.totalPrice,
      discountAmount: couponDiscount.value,
      payAmount: totalAmount.value,
      address
    })

    cartStore.removeByOrder(cartStore.selectedItems)
    ElMessage.success('订单创建成功')
    router.push(`/payment/${order.id}`)
  } catch (e) {
    ElMessage.error(e?.message || '订单创建失败')
  }
}
</script>

<style scoped>
.checkout-page {
  padding: 20px 0;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
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

/* 地址 */
.address-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.address-item {
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
}

.address-item:hover {
  border-color: #ff4400;
}

.address-item.active {
  border-color: #ff4400;
  background: #fff5f0;
}

.address-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.address-info .name {
  font-weight: bold;
  font-size: 16px;
}

.address-detail {
  font-size: 14px;
  color: #666;
}

.address-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.add-address-btn {
  border: 2px dashed #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s;
  color: #999;
  font-size: 14px;
  min-height: 100px;
}

.add-address-btn:hover {
  border-color: #ff4400;
  color: #ff4400;
}

.add-address-btn .el-icon {
  font-size: 24px;
}

/* 商品 */
.goods-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.goods-item:last-child {
  border-bottom: none;
}

.goods-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  object-fit: cover;
}

.goods-info {
  flex: 1;
}

.goods-name {
  font-size: 14px;
  color: #333;
  display: block;
  margin-bottom: 5px;
}

.goods-spec {
  font-size: 12px;
  color: #999;
}

.goods-price {
  text-align: right;
}

.goods-price .price {
  font-size: 16px;
  font-weight: bold;
  color: #ff4400;
  display: block;
}

.goods-price .quantity {
  font-size: 13px;
  color: #999;
}

/* 配送和支付 */
.delivery-options,
.payment-options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.delivery-option,
.payment-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.delivery-time {
  font-size: 12px;
  color: #999;
}

.delivery-price {
  color: #ff4400;
  font-weight: bold;
}

.payment-icon {
  display: flex;
}

.balance {
  font-size: 12px;
  color: #999;
}

/* 优惠券 */
.coupon-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.coupon-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.coupon-amount {
  color: #ff4400;
  font-weight: bold;
  font-size: 16px;
}

.coupon-condition {
  font-size: 12px;
  color: #999;
}

.coupon-name {
  font-size: 12px;
  background: #fff5f0;
  padding: 2px 6px;
  border-radius: 4px;
  color: #ff4400;
}

/* 汇总 */
.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  font-size: 14px;
}

.summary-row.total {
  padding-top: 15px;
  margin-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.summary-row .label {
  color: #666;
}

.summary-row .value {
  color: #333;
}

.summary-row .discount {
  color: #ff4400;
}

.total-price {
  color: #ff4400;
  font-weight: bold;
}

.total-price .price-symbol {
  font-size: 14px;
}

.total-price .price-value {
  font-size: 24px;
}

/* 提交栏 */
.submit-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 30px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  position: sticky;
  bottom: 0;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
}

.submit-info {
  font-size: 14px;
  color: #666;
}

.submit-info .total {
  margin-left: 20px;
}

.submit-info .total-price {
  font-size: 20px;
}

.btn-submit {
  padding: 12px 50px;
  font-size: 16px;
}

@media (max-width: 768px) {
  .address-list {
    grid-template-columns: 1fr;
  }
  
  .submit-bar {
    flex-direction: column;
    gap: 15px;
  }
  
  .submit-info {
    text-align: center;
  }
}
</style>
