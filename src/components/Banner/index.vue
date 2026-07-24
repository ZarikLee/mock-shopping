<template>
  <div class="banner">
    <el-carousel height="400px" :interval="5000" arrow="hover">
      <el-carousel-item v-for="item in banners" :key="item.id">
        <div class="banner-item" :style="{ background: item.gradient }">
          <div class="banner-content">
            <h2>{{ item.title }}</h2>
            <p>{{ item.subtitle }}</p>
            <el-button type="primary" size="large" @click="goToProducts(item.categoryId)">
              立即选购
            </el-button>
          </div>
          <div class="banner-image">
            <img :src="item.image" :alt="item.title" />
          </div>
        </div>
      </el-carousel-item>
    </el-carousel>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const banners = [
  {
    id: 1,
    title: '新品首发',
    subtitle: '旗舰新品，抢先体验',
    image: 'https://picsum.photos/600/400?random=101',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    categoryId: 1
  },
  {
    id: 2,
    title: '电脑焕新季',
    subtitle: '高性能笔记本，限时优惠',
    image: 'https://picsum.photos/600/400?random=102',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    categoryId: 2
  },
  {
    id: 3,
    title: '美妆盛宴',
    subtitle: '大牌美妆，满减狂欢',
    image: 'https://picsum.photos/600/400?random=103',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    categoryId: 6
  },
  {
    id: 4,
    title: '家居好物',
    subtitle: '品质生活，从家开始',
    image: 'https://picsum.photos/600/400?random=104',
    gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    categoryId: 4
  }
]

const goToProducts = (categoryId) => {
  router.push({
    path: '/products',
    query: { categoryId }
  })
}
</script>

<style scoped>
.banner {
  margin-bottom: 20px;
}

.banner-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 80px;
}

.banner-content {
  color: #fff;
  max-width: 400px;
}

.banner-content h2 {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 15px;
}

.banner-content p {
  font-size: 18px;
  margin-bottom: 25px;
  opacity: 0.9;
}

.banner-image {
  width: 400px;
  height: 300px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.banner-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .banner-item {
    padding: 0 30px;
    flex-direction: column;
    text-align: center;
    justify-content: center;
  }
  
  .banner-content h2 {
    font-size: 24px;
  }
  
  .banner-content p {
    font-size: 14px;
  }
  
  .banner-image {
    width: 200px;
    height: 150px;
    margin-top: 20px;
  }
}
</style>
