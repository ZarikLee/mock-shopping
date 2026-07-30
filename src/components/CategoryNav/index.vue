<template>
  <div class="category-nav">
    <div class="container">
      <div class="category-list">
        <div 
          v-for="category in categories" 
          :key="category.id"
          class="category-item"
          @click="goToCategory(category.id)"
        >
          <el-icon :size="28" class="category-icon"><component :is="category.icon" /></el-icon>
          <span class="category-name">{{ category.name }}</span>
          <div class="category-dropdown">
            <div class="subcategory-list">
              <span 
                v-for="sub in category.subcategories" 
                :key="sub"
                class="subcategory-item"
                @click.stop="goToSubCategory(category.id, sub)"
              >
                {{ sub }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import categories from '../../data/categories.json'

const router = useRouter()

const goToCategory = (categoryId) => {
  router.push({
    path: '/products',
    query: { categoryId }
  })
}

const goToSubCategory = (categoryId, subcategory) => {
  router.push({
    path: '/products',
    query: { categoryId, subcategory }
  })
}
</script>

<style scoped>
.category-nav {
  background: #fff;
  padding: 15px 0;
  margin-bottom: 20px;
}

.category-list {
  display: flex;
  justify-content: space-between;
}

.category-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 25px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.3s;
  position: relative;
}

.category-item:hover {
  background: #fff5f0;
}

.category-icon {
  margin-bottom: 8px;
}

.category-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.category-dropdown {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 15px;
  min-width: 200px;
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s;
  z-index: 100;
}

.category-item:hover .category-dropdown {
  opacity: 1;
  visibility: visible;
}

.subcategory-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.subcategory-item {
  padding: 8px 15px;
  background: #f8f8f8;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.3s;
}

.subcategory-item:hover {
  background: #ff4400;
  color: #fff;
}

@media (max-width: 768px) {
  .category-list {
    overflow-x: auto;
    gap: 10px;
    padding-bottom: 10px;
  }
  
  .category-item {
    padding: 10px 15px;
    min-width: 80px;
  }
  
  .category-name {
    font-size: 12px;
  }
  
  .category-dropdown {
    display: none;
  }
}
</style>
