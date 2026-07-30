<template>
  <div class="promotion-bar" :class="[type]" v-if="type === 'cart' || (type === 'detail' && flashPromotions.length > 0)">
    <div class="promo-header">
      <div class="promo-title">
        <span class="promo-icon">🏷️</span>
        <span class="promo-label">优惠活动</span>
        <span v-if="type === 'cart' && progress.current" class="promo-badge">
          已省 ¥{{ currentDiscount }}
        </span>
      </div>
      <div v-if="type === 'cart'" class="promo-summary">
        <template v-if="progress.next">
          <span class="highlight">再买 ¥{{ remainingAmount }}</span>
          <span>可享受</span>
          <span class="highlight">{{ progress.next.name }}</span>
        </template>
        <template v-else-if="progress.current">
          <span class="highlight">已享受 {{ progress.current.name }}</span>
        </template>
        <template v-else>
          <span>满200元即可享受优惠</span>
        </template>
      </div>
    </div>

    <div v-if="showProgress" class="progress-section">
      <div class="tier-labels">
        <span
          v-for="tier in discountTiers"
          :key="tier.id"
          class="tier-label"
          :class="{ reached: totalAmount >= tier.threshold }"
        >
          <span class="tier-dot"></span>
          <span class="tier-name">{{ tier.name }}</span>
        </span>
      </div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: animatedPercent + '%' }">
          <div class="progress-glow"></div>
        </div>
        <div
          v-for="tier in discountTiers"
          :key="tier.id"
          class="progress-marker"
          :style="{ left: ((tier.threshold - 0) / (tier.threshold || 1)) * 100 + '%' }"
          :class="{ active: totalAmount >= tier.threshold }"
        >
          <span class="marker-icon">{{ totalAmount >= tier.threshold ? '🎉' : '🎯' }}</span>
        </div>
      </div>
    </div>

    <div class="promo-tags">
      <div v-if="type === 'cart' && newUserPromotions.length > 0" class="promo-tag new-user">
        <span class="tag-icon">👶</span>
        <span class="tag-text">{{ newUserPromotions[0].description }}</span>
      </div>
      <div v-for="p in flashPromotions" :key="p.id" class="promo-tag flash">
        <span class="tag-icon">⚡</span>
        <span class="tag-text">{{ p.name }}</span>
        <span class="tag-desc">{{ p.description }}</span>
      </div>
      <div v-if="type === 'cart'" class="promo-tag action" @click="handleAddItems">
        <span class="tag-icon">🛒</span>
        <span class="tag-text">去凑单</span>
        <span class="tag-arrow">›</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { usePromotions } from '../../composables/usePromotions'
import { computed, ref, watch, onMounted } from 'vue'

const props = defineProps({
  type: {
    type: String,
    default: 'cart',
    validator: (v) => ['cart', 'detail'].includes(v)
  },
  totalAmount: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['add-items'])
const router = useRouter()

const { discountTiers, getProgress, getFlashPromotions, getNewUserPromotions } = usePromotions()

const progress = computed(() => getProgress(props.totalAmount))
const flashPromotions = computed(() => getFlashPromotions())
const newUserPromotions = computed(() => getNewUserPromotions())

const remainingAmount = computed(() => {
  if (!progress.value.next) return 0
  return progress.value.next.threshold - props.totalAmount
})

const currentDiscount = computed(() => {
  if (!progress.value.current) return 0
  return progress.value.current.discount
})

const barPercent = computed(() => Math.min(progress.value.percent, 100))
const showProgress = computed(() => props.type === 'cart')

const animatedPercent = ref(0)

watch(barPercent, (val) => {
  const start = animatedPercent.value
  const diff = val - start
  const duration = 600
  const startTime = performance.now()
  const animate = (now) => {
    const elapsed = now - startTime
    const t = Math.min(elapsed / duration, 1)
    animatedPercent.value = start + diff * t
    if (t < 1) requestAnimationFrame(animate)
  }
  requestAnimationFrame(animate)
})

onMounted(() => {
  setTimeout(() => {
    animatedPercent.value = barPercent.value
  }, 100)
})

const handleAddItems = () => {
  router.push('/products')
  emit('add-items')
}
</script>

<style scoped>
.promotion-bar {
  background: linear-gradient(135deg, #fff5f5 0%, #fff0e6 100%);
  border: 1px solid #ffd7b3;
  border-radius: 8px;
  padding: 16px 20px;
  margin-bottom: 16px;
  position: relative;
  overflow: hidden;
}

.promotion-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #ff6b35, #ff4400, #ff6b35);
}

.promo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: wrap;
  gap: 8px;
}

.promo-title {
  display: flex;
  align-items: center;
  gap: 6px;
}

.promo-icon {
  font-size: 18px;
}

.promo-label {
  font-size: 15px;
  font-weight: 600;
  color: #d4380d;
}

.promo-badge {
  background: linear-gradient(135deg, #ff4400, #ff6b35);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  margin-left: 6px;
}

.promo-summary {
  font-size: 13px;
  color: #666;
}

.promo-summary .highlight {
  color: #d4380d;
  font-weight: 600;
}

.progress-section {
  margin-bottom: 12px;
}

.tier-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 0 2px;
}

.tier-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #999;
  transition: all 0.3s;
}

.tier-label.reached {
  color: #d4380d;
  font-weight: 600;
}

.tier-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ddd;
  transition: all 0.3s;
}

.tier-label.reached .tier-dot {
  background: #ff4400;
  box-shadow: 0 0 4px rgba(255, 68, 0, 0.5);
}

.progress-track {
  position: relative;
  height: 8px;
  background: #f0e0d6;
  border-radius: 4px;
  overflow: visible;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff6b35, #ff4400);
  border-radius: 4px;
  transition: width 0.6s ease;
  position: relative;
}

.progress-glow {
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4));
  border-radius: 0 4px 4px 0;
}

.progress-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.marker-icon {
  font-size: 14px;
  filter: grayscale(1);
  opacity: 0.5;
  transition: all 0.3s;
}

.progress-marker.active .marker-icon {
  filter: grayscale(0);
  opacity: 1;
  transform: scale(1.2);
}

.promo-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.promo-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  cursor: default;
  transition: all 0.2s;
}

.promo-tag.flash {
  background: linear-gradient(135deg, #fff3e0, #ffe0b2);
  color: #e65100;
  border: 1px solid #ffcc80;
}

.promo-tag.new-user {
  background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
  color: #2e7d32;
  border: 1px solid #a5d6a7;
}

.promo-tag.action {
  background: linear-gradient(135deg, #ff4400, #ff6b35);
  color: #fff;
  cursor: pointer;
  border: none;
  padding: 4px 14px;
  font-weight: 600;
}

.promo-tag.action:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(255, 68, 0, 0.4);
}

.tag-icon {
  font-size: 14px;
  line-height: 1;
}

.tag-desc {
  color: #999;
  font-size: 11px;
}

.tag-arrow {
  font-size: 16px;
  font-weight: bold;
  margin-left: 2px;
}

@media (max-width: 768px) {
  .promotion-bar {
    padding: 12px 14px;
  }

  .promo-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .tier-labels {
    flex-wrap: wrap;
    gap: 4px;
  }

  .promo-tags {
    flex-wrap: wrap;
  }
}
</style>
