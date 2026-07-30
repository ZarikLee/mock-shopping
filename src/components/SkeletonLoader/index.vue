<template>
  <div class="skeleton-wrapper">
    <template v-if="type === 'product-card'">
      <div class="skeleton-grid">
        <div v-for="n in count" :key="n" class="skeleton-card">
          <div class="sk-image" />
          <div class="sk-content">
            <div class="sk-line sk-line-short" />
            <div class="sk-line" />
            <div class="sk-line sk-line-price" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'product-detail'">
      <div class="skeleton-detail">
        <div class="sk-detail-image" />
        <div class="sk-detail-info">
          <div class="sk-line sk-line-title" />
          <div class="sk-line" />
          <div class="sk-line sk-line-medium" />
          <div class="sk-divider" />
          <div class="sk-line sk-line-price" />
          <div class="sk-line sk-line-short" />
          <div class="sk-divider" />
          <div class="sk-line-group">
            <div class="sk-line sk-line-btn" />
            <div class="sk-line sk-line-btn" />
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'cart'">
      <div v-for="n in count" :key="n" class="skeleton-cart-item">
        <div class="sk-cart-image" />
        <div class="sk-cart-info">
          <div class="sk-line" />
          <div class="sk-line sk-line-short" />
          <div class="sk-line sk-line-price" />
        </div>
      </div>
    </template>

    <template v-else-if="type === 'order'">
      <div v-for="n in count" :key="n" class="skeleton-order">
        <div class="sk-order-header">
          <div class="sk-line sk-line-medium" />
          <div class="sk-line sk-line-short" />
        </div>
        <div class="sk-order-body">
          <div class="sk-order-image" />
          <div class="sk-order-info">
            <div class="sk-line" />
            <div class="sk-line sk-line-short" />
            <div class="sk-line sk-line-price" />
          </div>
        </div>
        <div class="sk-order-footer">
          <div class="sk-line sk-line-short" />
          <div class="sk-line sk-line-btn" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'product-card',
    validator: (v) => ['product-card', 'product-detail', 'cart', 'order'].includes(v)
  },
  count: {
    type: Number,
    default: 4
  }
})
</script>

<style scoped>
.skeleton-wrapper {
  width: 100%;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.skeleton-card,
.skeleton-cart-item,
.skeleton-order,
.skeleton-detail {
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
}

.sk-image {
  width: 100%;
  padding-top: 100%;
  background: #f0f0f0;
}

.sk-cart-image,
.sk-order-image {
  width: 100px;
  height: 100px;
  background: #f0f0f0;
  border-radius: 8px;
  flex-shrink: 0;
}

.sk-content {
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-line {
  height: 14px;
  background: #f0f0f0;
  border-radius: 4px;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.sk-line-short {
  width: 60%;
}

.sk-line-medium {
  width: 80%;
}

.sk-line-price {
  width: 40%;
  height: 20px;
}

.sk-line-title {
  height: 22px;
  width: 90%;
}

.sk-line-btn {
  width: 100px;
  height: 36px;
  border-radius: 18px;
}

.sk-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 8px 0;
}

.sk-line-group {
  display: flex;
  gap: 12px;
}

.skeleton-detail {
  display: flex;
  gap: 40px;
  padding: 30px;
}

.sk-detail-image {
  width: 480px;
  height: 480px;
  background: #f0f0f0;
  border-radius: 8px;
  flex-shrink: 0;
}

.sk-detail-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skeleton-cart-item {
  display: flex;
  gap: 15px;
  padding: 20px;
  margin-bottom: 10px;
  align-items: center;
}

.sk-cart-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-order {
  margin-bottom: 15px;
}

.sk-order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.sk-order-body {
  display: flex;
  gap: 15px;
  padding: 20px;
}

.sk-order-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.sk-order-footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 15px;
  padding: 15px 20px;
  border-top: 1px solid #f0f0f0;
}

.sk-image,
.sk-cart-image,
.sk-order-image,
.sk-line {
  position: relative;
  overflow: hidden;
}

.sk-image::after,
.sk-cart-image::after,
.sk-order-image::after,
.sk-line::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100% {
    left: 100%;
  }
}

@media (max-width: 1024px) {
  .skeleton-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .skeleton-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .skeleton-detail {
    flex-direction: column;
    padding: 15px;
    gap: 20px;
  }

  .sk-detail-image {
    width: 100%;
    height: auto;
    padding-top: 100%;
  }
}
</style>
