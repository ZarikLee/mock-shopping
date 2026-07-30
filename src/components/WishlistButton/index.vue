<template>
  <div class="wishlist-btn" @click.stop="handleToggle">
    <el-icon :class="{ wished: isActive }" :size="20">
      <Star v-if="isActive" />
      <StarFilled v-else />
    </el-icon>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useWishlistStore } from '../../stores/wishlist'

const props = defineProps({
  product: {
    type: Object,
    required: true
  }
})

const wishlistStore = useWishlistStore()

const isActive = computed(() => wishlistStore.isWished(props.product.id))

const handleToggle = () => {
  const added = wishlistStore.toggleWish(props.product)
  if (added) {
    ElMessage.success('已加入收藏')
  } else {
    ElMessage.info('已取消收藏')
  }
}
</script>

<style scoped>
.wishlist-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.wishlist-btn:hover {
  transform: scale(1.15);
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.wishlist-btn .el-icon {
  color: #999;
  transition: color 0.3s, transform 0.3s;
}

.wishlist-btn .el-icon.wished {
  color: #ff4400;
  animation: pop 0.3s ease;
}

@keyframes pop {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
</style>
