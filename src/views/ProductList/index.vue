<template>
  <div class="product-list-page">
    <div class="container">
      <!-- 面包屑 -->
      <div class="breadcrumb">
        <router-link to="/">首页</router-link>
        <span class="separator">/</span>
        <span v-if="currentCategory">{{ currentCategory.name }}</span>
        <span v-else>全部商品</span>
      </div>

      <div class="main-content">
        <!-- 左侧筛选 -->
        <div class="sidebar">
          <!-- 分类筛选 -->
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

          <!-- 价格筛选 -->
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

          <!-- 品牌筛选 -->
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

        <!-- 右侧商品列表 -->
        <div class="product-content">
          <!-- 排序栏 -->
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
            <div class="result-count">
              共 <span class="count">{{ filteredProducts.length }}</span> 件商品
            </div>
          </div>

          <!-- 商品列表 -->
          <div class="product-grid" v-if="filteredProducts.length > 0">
            <ProductCard 
              v-for="product in paginatedProducts" 
              :key="product.id" 
              :product="product" 
            />
          </div>

          <!-- 无数据 -->
          <div class="no-data" v-else>
            <el-icon :size="48"><Box /></el-icon>
            <p>暂无符合条件的商品</p>
            <el-button type="primary" @click="resetFilters">清除筛选</el-button>
          </div>

          <!-- 分页 -->
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Check, Box, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import ProductCard from '../../components/ProductCard/index.vue'
import products from '../../data/products.json'
import categories from '../../data/categories.json'

const router = useRouter()
const route = useRoute()

// 筛选条件
const selectedCategoryId = ref(Number(route.query.categoryId) || null)
const selectedBrands = ref([])
const priceRange = ref({ min: '', max: '' })
const currentSort = ref('default')
const sortDirection = ref('asc')

// 分页
const currentPage = ref(1)
const pageSize = ref(12)

// 品牌列表
const brands = computed(() => {
  const brandSet = new Set(products.map(p => p.brand))
  return Array.from(brandSet)
})

// 当前分类
const currentCategory = computed(() => {
  if (selectedCategoryId.value) {
    return categories.find(c => c.id === selectedCategoryId.value)
  }
  return null
})

// 排序选项
const sortOptions = [
  { label: '综合', value: 'default' },
  { label: '销量', value: 'sales' },
  { label: '价格', value: 'price' },
  { label: '评分', value: 'rating' }
]

// 价格排序图标
const priceSortIcon = computed(() => {
  if (currentSort.value !== 'price') return null
  return sortDirection.value === 'asc' ? ArrowUp : ArrowDown
})

// 筛选后的商品
const filteredProducts = computed(() => {
  let result = [...products]

  // 分类筛选
  if (selectedCategoryId.value) {
    result = result.filter(p => p.categoryId === selectedCategoryId.value)
  }

  // 品牌筛选
  if (selectedBrands.value.length > 0) {
    result = result.filter(p => selectedBrands.value.includes(p.brand))
  }

  // 价格筛选
  if (priceRange.value.min) {
    result = result.filter(p => p.price >= Number(priceRange.value.min))
  }
  if (priceRange.value.max) {
    result = result.filter(p => p.price <= Number(priceRange.value.max))
  }

  // 关键词搜索
  if (route.query.keyword) {
    const keyword = route.query.keyword.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.brand.toLowerCase().includes(keyword) ||
      p.shop.toLowerCase().includes(keyword)
    )
  }

  // 排序
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

// 分页后的商品
const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredProducts.value.slice(start, end)
})

// 选择分类
const selectCategory = (categoryId) => {
  selectedCategoryId.value = selectedCategoryId.value === categoryId ? null : categoryId
  currentPage.value = 1
}

// 切换品牌
const toggleBrand = (brand) => {
  const index = selectedBrands.value.indexOf(brand)
  if (index > -1) {
    selectedBrands.value.splice(index, 1)
  } else {
    selectedBrands.value.push(brand)
  }
  currentPage.value = 1
}

// 应用价格筛选
const applyPriceFilter = () => {
  currentPage.value = 1
}

// 切换排序
const changeSort = (sort) => {
  if (currentSort.value === sort) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    currentSort.value = sort
    sortDirection.value = 'asc'
  }
  currentPage.value = 1
}

// 重置筛选
const resetFilters = () => {
  selectedCategoryId.value = null
  selectedBrands.value = []
  priceRange.value = { min: '', max: '' }
  currentSort.value = 'default'
  currentPage.value = 1
}

// 分页变化
const handleSizeChange = () => {
  currentPage.value = 1
}

const handleCurrentChange = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// 监听路由变化
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
}

.sort-option {
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.sort-option:hover {
  background: #f8f8f8;
}

.sort-option.active {
  background: #ff4400;
  color: #fff;
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

@media (max-width: 768px) {
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
    flex-direction: column;
    gap: 10px;
  }
}
</style>
