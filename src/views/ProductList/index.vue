<template>
  <div class="product-list-page">
    <div class="container">
      <div class="breadcrumb">
        <router-link to="/">首页</router-link>
        <span class="separator">/</span>
        <span v-if="currentCategory">{{ currentCategory.name }}</span>
        <span v-else>全部商品</span>
      </div>

      <div class="main-content">
        <div class="sidebar" v-if="!isMobile">
          <div class="filter-section">
            <h3>商品分类</h3>
            <div class="filter-list">
              <div
                v-for="category in categories"
                :key="category.id"
                class="filter-item"
                :class="{ active: selectedCategoryId === category.id }"
                @click="selectCategory(category.id)"
              >
                <span class="icon">{{ category.icon }}</span>
                <span class="name">{{ category.name }}</span>
              </div>
            </div>
          </div>

          <div class="filter-section">
            <h3>价格区间</h3>
            <div class="price-filter">
              <input
                v-model="priceRange.min"
                type="number"
                placeholder="最低价"
                class="price-input"
              />
              <span class="separator">-</span>
              <input
                v-model="priceRange.max"
                type="number"
                placeholder="最高价"
                class="price-input"
              />
              <el-button type="primary" size="small" @click="applyPriceFilter">
                确定
              </el-button>
            </div>
          </div>

          <div class="filter-section">
            <h3>品牌</h3>
            <div class="filter-list">
              <div
                v-for="brand in brands"
                :key="brand"
                class="filter-item checkbox"
                :class="{ active: selectedBrands.includes(brand) }"
                @click="toggleBrand(brand)"
              >
                <el-icon v-if="selectedBrands.includes(brand)"><Check /></el-icon>
                <span class="name">{{ brand }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="product-content">
          <div class="sort-bar">
            <div class="sort-options">
              <span
                v-for="option in sortOptions"
                :key="option.value"
                class="sort-option"
                :class="{ active: currentSort === option.value }"
                @click="changeSort(option.value)"
              >
                {{ option.label }}
                <el-icon v-if="option.value === 'price'">
                  <component :is="priceSortIcon" />
                </el-icon>
              </span>
            </div>
            <div class="sort-actions">
              <el-button v-if="isMobile" size="small" class="filter-toggle-btn" @click="showFilterPanel = true">
                <el-icon><component :is="'Filter'"/></el-icon>
                筛选
              </el-button>
              <span class="result-count" v-if="!isMobile">
                共 <span class="count">{{ filteredProducts.length }}</span> 件商品
              </span>
            </div>
          </div>

          <SkeletonLoader v-if="loading" type="product-card" :count="6" />
          <div class="product-grid" v-else-if="filteredProducts.length > 0">
            <ProductCard
              v-for="product in paginatedProducts"
              :key="product.id"
              :product="product"
            />
          </div>

          <div class="no-data" v-else>
            <el-icon :size="48"><Box /></el-icon>
            <p>暂无符合条件的商品</p>
            <el-button type="primary" @click="resetFilters">清除筛选</el-button>
          </div>

          <div class="pagination" v-if="filteredProducts.length > 0">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[12, 24, 36, 48]"
              :total="filteredProducts.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile filter drawer -->
    <transition name="slide-up">
      <div class="filter-overlay" v-if="isMobile && showFilterPanel" @click="showFilterPanel = false">
        <div class="filter-panel" @click.stop>
          <div class="filter-panel-header">
            <span class="filter-panel-title">筛选</span>
            <el-icon :size="20" @click="showFilterPanel = false" class="filter-close">
              <Close />
            </el-icon>
          </div>
          <div class="filter-panel-body">
            <div class="mobile-filter-section">
              <h3>商品分类</h3>
              <div class="mobile-filter-chips">
                <span
                  v-for="category in categories"
                  :key="category.id"
                  class="filter-chip"
                  :class="{ active: selectedCategoryId === category.id }"
                  @click="selectCategory(category.id)"
                >
                  {{ category.icon }} {{ category.name }}
                </span>
              </div>
            </div>

            <div class="mobile-filter-section">
              <h3>价格区间</h3>
              <div class="mobile-price-filter">
                <input v-model="priceRange.min" type="number" placeholder="最低价" class="price-input" />
                <span class="separator">-</span>
                <input v-model="priceRange.max" type="number" placeholder="最高价" class="price-input" />
                <el-button type="primary" size="small" @click="applyPriceFilter">确定</el-button>
              </div>
            </div>

            <div class="mobile-filter-section">
              <h3>品牌</h3>
              <div class="mobile-filter-chips">
                <span
                  v-for="brand in brands"
                  :key="brand"
                  class="filter-chip"
                  :class="{ active: selectedBrands.includes(brand) }"
                  @click="toggleBrand(brand)"
                >
                  {{ brand }}
                </span>
              </div>
            </div>
          </div>
          <div class="filter-panel-footer">
            <el-button @click="resetFilters">重置</el-button>
            <el-button type="primary" @click="showFilterPanel = false">确定</el-button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Check, Box, ArrowUp, ArrowDown, Close } from '@element-plus/icons-vue'
import { useDevice } from '../../utils/device'
import ProductCard from '../../components/ProductCard/index.vue'
import SkeletonLoader from '../../components/SkeletonLoader/index.vue'
import products from '../../data/products.json'
import categories from '../../data/categories.json'

const { isMobile } = useDevice()
const router = useRouter()
const route = useRoute()

const selectedCategoryId = ref(Number(route.query.categoryId) || null)
const selectedBrands = ref([])
const priceRange = ref({ min: '', max: '' })
const currentSort = ref('default')
const sortDirection = ref('asc')
const loading = ref(true)
const currentPage = ref(1)
const pageSize = ref(12)
const showFilterPanel = ref(false)

const brands = computed(() => {
  const brandSet = new Set(products.map(p => p.brand))
  return Array.from(brandSet)
})

const currentCategory = computed(() => {
  if (selectedCategoryId.value) {
    return categories.find(c => c.id === selectedCategoryId.value)
  }
  return null
})

const sortOptions = [
  { label: '综合', value: 'default' },
  { label: '销量', value: 'sales' },
  { label: '价格', value: 'price' },
  { label: '评分', value: 'rating' }
]

const priceSortIcon = computed(() => {
  if (currentSort.value !== 'price') return null
  return sortDirection.value === 'asc' ? ArrowUp : ArrowDown
})

const filteredProducts = computed(() => {
  let result = [...products]
  if (selectedCategoryId.value) {
    result = result.filter(p => p.categoryId === selectedCategoryId.value)
  }
  if (selectedBrands.value.length > 0) {
    result = result.filter(p => selectedBrands.value.includes(p.brand))
  }
  if (priceRange.value.min) {
    result = result.filter(p => p.price >= Number(priceRange.value.min))
  }
  if (priceRange.value.max) {
    result = result.filter(p => p.price <= Number(priceRange.value.max))
  }
  if (route.query.keyword) {
    const keyword = route.query.keyword.toLowerCase()
    result = result.filter(p =>
      p.name.toLowerCase().includes(keyword) ||
      p.brand.toLowerCase().includes(keyword) ||
      p.shop.toLowerCase().includes(keyword)
    )
  }
  if (currentSort.value === 'sales') {
    result.sort((a, b) => b.sales - a.sales)
  } else if (currentSort.value === 'price') {
    result.sort((a, b) => {
      return sortDirection.value === 'asc'
        ? a.price - b.price
        : b.price - a.price
    })
  } else if (currentSort.value === 'rating') {
    result.sort((a, b) => b.rating - a.rating)
  }
  return result
})

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

const selectCategory = (categoryId) => {
  selectedCategoryId.value = selectedCategoryId.value === categoryId ? null : categoryId
  currentPage.value = 1
}

const toggleBrand = (brand) => {
  const index = selectedBrands.value.indexOf(brand)
  if (index > -1) {
    selectedBrands.value.splice(index, 1)
  } else {
    selectedBrands.value.push(brand)
  }
  currentPage.value = 1
}

const applyPriceFilter = () => {
  currentPage.value = 1
}

const changeSort = (sort) => {
  if (currentSort.value === sort) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value = sort
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

const resetFilters = () => {
  selectedCategoryId.value = null
  selectedBrands.value = []
  priceRange.value = { min: '', max: '' }
  currentSort.value = 'default'
  currentPage.value = 1
}

const handleSizeChange = () => {
  currentPage.value = 1
}

const handleCurrentChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  setTimeout(() => {
    loading.value = false
  }, 300)
})

watch(() => route.query, (newQuery) => {
  if (newQuery.categoryId) {
    selectedCategoryId.value = Number(newQuery.categoryId)
  }
  if (newQuery.keyword) {
    selectedCategoryId.value = null
  }
  currentPage.value = 1
}, { immediate: true })
</script>

<style scoped>
.product-list-page {
  padding: 20px 0;
}

.breadcrumb {
  font-size: 14px;
  color: #999;
  margin-bottom: 20px;
}

.breadcrumb a {
  color: #666;
  transition: color 0.3s;
}

.breadcrumb a:hover {
  color: #ff4400;
}

.breadcrumb .separator {
  margin: 0 8px;
}

.main-content {
  display: flex;
  gap: 20px;
}

.sidebar {
  width: 220px;
  flex-shrink: 0;
}

.filter-section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 15px;
}

.filter-section h3 {
  font-size: 16px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.filter-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-item:hover {
  background: #f8f8f8;
}

.filter-item.active {
  background: #fff5f0;
  color: #ff4400;
}

.filter-item.checkbox {
  padding: 6px 12px;
}

.filter-item .icon {
  font-size: 18px;
}

.price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.price-input {
  width: 80px;
  padding: 6px 10px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  font-size: 13px;
}

.price-input:focus {
  outline: none;
  border-color: #ff4400;
}

.price-filter .separator {
  color: #999;
}

.product-content {
  flex: 1;
  min-width: 0;
}

.sort-bar {
  background: #fff;
  border-radius: 8px;
  padding: 15px 20px;
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sort-options {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
}

.sort-option {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.sort-option:hover {
  background: #f8f8f8;
}

.sort-option.active {
  background: #ff4400;
  color: #fff;
}

.sort-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-count {
  font-size: 14px;
  color: #999;
}

.result-count .count {
  color: #ff4400;
  font-weight: bold;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
}

.no-data {
  background: #fff;
  border-radius: 8px;
  padding: 60px 20px;
  text-align: center;
}

.no-data .el-icon {
  color: #ccc;
  margin-bottom: 15px;
}

.no-data p {
  color: #999;
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
}

.filter-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1001;
  display: flex;
  align-items: flex-end;
}

.filter-panel {
  width: 100%;
  max-height: 70vh;
  background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.filter-panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.filter-panel-title {
  font-size: 16px;
  font-weight: bold;
}

.filter-close {
  cursor: pointer;
  color: #999;
}

.filter-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}

.mobile-filter-section {
  margin-bottom: 20px;
}

.mobile-filter-section h3 {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin-bottom: 10px;
}

.mobile-filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-chip {
  padding: 8px 14px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-chip.active {
  border-color: #ff4400;
  background: #fff5f0;
  color: #ff4400;
}

.mobile-price-filter {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mobile-price-filter .price-input {
  width: 100px;
}

.filter-panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.filter-panel-footer .el-button {
  flex: 1;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.25s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

@media (max-width: 768px) {
  .product-list-page {
    padding: 12px 0;
  }

  .breadcrumb {
    padding: 0 12px;
    margin-bottom: 12px;
  }

  .main-content {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
  }

  .filter-section {
    display: none;
  }

  .product-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .sort-bar {
    flex-direction: row;
    padding: 10px 12px;
    margin: 0 12px 12px;
    border-radius: 8px;
  }

  .sort-option {
    padding: 6px 12px;
    font-size: 13px;
  }

  .pagination {
    padding: 0 12px;
  }

  .pagination :deep(.el-pagination) {
    flex-wrap: wrap;
    justify-content: center;
    font-size: 12px;
  }
}
</style>
