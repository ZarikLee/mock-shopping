<template>
  <div v-if="visible" class="suggestions" @click.stop>
    <div v-if="!keyword.trim()" class="hot-section">
      <div class="section-title">热门搜索</div>
      <div class="hot-list">
        <span
          v-for="(item, index) in suggestions"
          :key="'hot-' + index"
          class="hot-tag"
          @click="handleClick(item)"
        >
          {{ item.text }}
        </span>
      </div>
    </div>
    <div v-else-if="suggestions.length > 0" class="product-section">
      <div
        v-for="(item, index) in suggestions"
        :key="'prod-' + index"
        class="suggestion-item"
        @click="handleClick(item)"
      >
        <img :src="item.data.image" :alt="item.data.name" class="suggestion-img" />
        <div class="suggestion-info">
          <div class="suggestion-name" v-html="highlightText(item.data.name, item.keyword)"></div>
          <div class="suggestion-price">¥{{ item.data.price }}</div>
        </div>
      </div>
    </div>
    <div v-else class="empty-section">
      <span class="empty-text">未找到相关商品</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import products from '../../data/products.json'

const router = useRouter()

const props = defineProps({
  keyword: { type: String, default: '' },
  visible: { type: Boolean, default: false }
})

const emit = defineEmits(['select', 'close'])

const hotSearches = ['iPhone', '华为', '电脑', '耳机', '运动鞋', '面膜', '零食', '空调']

const suggestions = computed(() => {
  const kw = props.keyword.trim().toLowerCase()
  if (!kw) {
    return hotSearches.map(item => ({ type: 'hot', text: item }))
  }
  const filtered = products
    .filter(p => p.name.toLowerCase().includes(kw) || p.brand.toLowerCase().includes(kw))
    .slice(0, 5)
  return filtered.map(p => ({ type: 'product', data: p, keyword: props.keyword.trim() }))
})

function highlightText(text, kw) {
  if (!kw) return text
  const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
  return text.replace(regex, '<em>$1</em>')
}

function handleClick(item) {
  if (item.type === 'product') {
    router.push(`/product/${item.data.id}`)
    emit('select')
  } else {
    router.push({ path: '/products', query: { keyword: item.text } })
    emit('select')
  }
}
</script>

<style scoped>
.suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: 0 0 4px 4px;
  max-height: 400px;
  overflow-y: auto;
  z-index: 1001;
}

.section-title {
  padding: 10px 15px 5px;
  font-size: 12px;
  color: #999;
}

.hot-section {
  padding-bottom: 10px;
}

.hot-list {
  display: flex;
  flex-wrap: wrap;
  padding: 0 10px 5px;
  gap: 8px;
}

.hot-tag {
  display: inline-block;
  padding: 4px 12px;
  font-size: 13px;
  color: #333;
  background: #f5f5f5;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.hot-tag:hover {
  color: #ff4400;
  background: #fff0e8;
}

.product-section {
  padding: 5px 0;
}

.suggestion-item {
  display: flex;
  align-items: center;
  padding: 8px 15px;
  cursor: pointer;
  transition: background 0.2s;
}

.suggestion-item:hover {
  background: #f5f5f5;
}

.suggestion-img {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 4px;
  flex-shrink: 0;
}

.suggestion-info {
  margin-left: 10px;
  flex: 1;
  min-width: 0;
}

.suggestion-name {
  font-size: 13px;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.suggestion-name :deep(em) {
  font-style: normal;
  color: #ff4400;
}

.suggestion-price {
  font-size: 12px;
  color: #ff4400;
  margin-top: 2px;
}

.empty-section {
  padding: 20px 15px;
  text-align: center;
}

.empty-text {
  font-size: 13px;
  color: #999;
}

@media (max-width: 768px) {
  .suggestions {
    position: fixed;
    top: auto;
    left: 15px;
    right: 15px;
    max-height: 300px;
  }
}
</style>
