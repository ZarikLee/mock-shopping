<template>
  <div class="product-reviews">
    <div class="review-summary">
      <div class="review-score">
        <span class="score-number">{{ stats.average }}</span>
        <span class="score-label">综合评分</span>
      </div>
      <div class="review-stats">
        <div class="stat-row">
          <el-rate v-model="stats.average" disabled show-score score-template="{value}" />
        </div>
        <div class="stat-info">
          <span>好评率 <strong>{{ stats.positiveRate }}</strong></span>
          <span class="divider">|</span>
          <span>共 <strong>{{ stats.total }}</strong> 条评价</span>
        </div>
      </div>
      <div class="review-tags">
        <el-tag
          v-for="tab in filterTabs"
          :key="tab.key"
          :type="tab.type"
          :class="{ active: activeFilter === tab.key }"
          @click="activeFilter = tab.key"
        >
          {{ tab.label }} ({{ tab.count }})
        </el-tag>
      </div>
    </div>

    <div class="review-form" v-if="showForm">
      <div class="form-header">
        <el-icon><EditPen /></el-icon>
        <span>发表评价</span>
      </div>
      <div class="form-body">
        <div class="form-row">
          <span class="form-label">评分</span>
          <el-rate v-model="formData.rating" />
        </div>
        <div class="form-row">
          <span class="form-label">内容</span>
          <div class="form-content">
            <el-input
              v-model="formData.content"
              type="textarea"
              :rows="4"
              :maxlength="200"
              placeholder="分享您的使用体验（最多200字）"
              show-word-limit
            />
          </div>
        </div>
        <div class="form-row">
          <span class="form-label">图片</span>
          <div class="form-upload">
            <div class="upload-trigger" @click="handleSimulateUpload">
              <el-icon><Plus /></el-icon>
              <span>添加图片</span>
            </div>
            <div class="upload-preview" v-for="(img, index) in formData.images" :key="index">
              <img :src="img" alt="preview" />
              <span class="remove-btn" @click="formData.images.splice(index, 1)">&times;</span>
            </div>
          </div>
        </div>
        <div class="form-actions">
          <el-button type="primary" @click="handleSubmit" :disabled="!formData.rating || !formData.content.trim()">提交评价</el-button>
        </div>
      </div>
    </div>

    <div class="review-list">
      <div v-if="filteredReviews.length === 0" class="empty-reviews">
        <el-empty description="暂无评价" />
      </div>
      <div
        v-for="review in filteredReviews"
        :key="review.id"
        class="review-item"
      >
        <div class="review-header">
          <el-avatar :size="40" :src="review.avatar">
            <el-icon><User /></el-icon>
          </el-avatar>
          <div class="review-user-info">
            <span class="review-username">{{ review.username }}</span>
            <el-rate v-model="review.rating" disabled show-score score-template="{value}" />
          </div>
          <span class="review-date">{{ review.time }}</span>
        </div>
        <div class="review-content">
          <p>{{ review.content }}</p>
        </div>
        <div class="review-images" v-if="review.images && review.images.length">
          <div v-for="(img, index) in review.images" :key="index" class="review-image-item" @click="handlePreviewImage(review.images, index)">
            <img :src="img" alt="review image" />
          </div>
        </div>
        <div class="review-specs" v-if="review.specs">
          <el-tag size="small" effect="plain">{{ review.specs }}</el-tag>
        </div>
      </div>
    </div>

    <el-image-viewer
      v-if="previewVisible"
      :url-list="previewImages"
      :initial-index="previewIndex"
      @close="previewVisible = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { User, Plus, EditPen } from '@element-plus/icons-vue'
import { useReviewStore } from '@/stores/review'
import { ElMessage } from 'element-plus'

const props = defineProps({
  productId: { type: Number, required: true }
})

const reviewStore = useReviewStore()

const activeFilter = ref('all')
const showForm = ref(true)
const previewVisible = ref(false)
const previewImages = ref([])
const previewIndex = ref(0)

const formData = ref({
  rating: 5,
  content: '',
  images: []
})

const allReviews = computed(() => reviewStore.getReviews(props.productId))
const stats = computed(() => reviewStore.getStats(props.productId))

const filterTabs = computed(() => [
  { key: 'all', label: '全部', type: '', count: stats.value.total },
  { key: 'good', label: '好评', type: 'success', count: stats.value.positive },
  { key: 'neutral', label: '中评', type: 'warning', count: stats.value.neutral },
  { key: 'bad', label: '差评', type: 'danger', count: stats.value.negative }
])

const filteredReviews = computed(() => {
  if (activeFilter.value === 'all') return allReviews.value
  return allReviews.value.filter(r => r.type === activeFilter.value)
})

watch(() => props.productId, () => {
  activeFilter.value = 'all'
  formData.value = { rating: 5, content: '', images: [] }
})

function handleSimulateUpload() {
  const pics = [
    'https://picsum.photos/seed/up1/400/400',
    'https://picsum.photos/seed/up2/400/400',
    'https://picsum.photos/seed/up3/400/400'
  ]
  const img = pics[Math.floor(Math.random() * pics.length)]
  if (!formData.value.images.includes(img)) {
    formData.value.images.push(img)
  }
}

function handleSubmit() {
  if (!formData.value.rating || !formData.value.content.trim()) return
  const users = [
    { name: '用户***8', avatar: 'https://picsum.photos/seed/sub1/100/100' },
    { name: '用户***2', avatar: 'https://picsum.photos/seed/sub2/100/100' },
    { name: '用户***5', avatar: 'https://picsum.photos/seed/sub3/100/100' },
    { name: '用户***1', avatar: 'https://picsum.photos/seed/sub4/100/100' },
    { name: '用户***9', avatar: 'https://picsum.photos/seed/sub5/100/100' }
  ]
  const u = users[Math.floor(Math.random() * users.length)]
  reviewStore.addReview({
    productId: props.productId,
    userId: Date.now(),
    username: u.name,
    avatar: u.avatar,
    rating: formData.value.rating,
    content: formData.value.content.trim(),
    images: [...formData.value.images],
    specs: ''
  })
  formData.value = { rating: 5, content: '', images: [] }
  ElMessage.success('评价提交成功，感谢您的分享！')
}

function handlePreviewImage(images, index) {
  previewImages.value = images
  previewIndex.value = index
  previewVisible.value = true
}
</script>

<style scoped>
.product-reviews {
  padding: 20px 0;
}

.review-summary {
  display: flex;
  align-items: center;
  gap: 30px;
  padding: 24px;
  background: #f8f8f8;
  border-radius: 8px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.review-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
}

.score-number {
  font-size: 48px;
  font-weight: bold;
  color: #ff4400;
  line-height: 1;
}

.score-label {
  color: #666;
  margin-top: 5px;
  font-size: 13px;
}

.review-stats {
  flex: 1;
  min-width: 150px;
}

.stat-row {
  margin-bottom: 6px;
}

.stat-info {
  color: #999;
  font-size: 13px;
}

.stat-info strong {
  color: #333;
}

.divider {
  margin: 0 10px;
  color: #ddd;
}

.review-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.review-tags .el-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.review-tags .el-tag.active {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.12);
}

.review-form {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
}

.form-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  font-weight: bold;
  color: #333;
  font-size: 15px;
}

.form-body {
  padding: 20px;
}

.form-row {
  display: flex;
  margin-bottom: 16px;
}

.form-label {
  flex-shrink: 0;
  width: 60px;
  color: #666;
  padding-top: 6px;
  font-size: 14px;
}

.form-content {
  flex: 1;
}

.form-upload {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.upload-trigger {
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
  gap: 4px;
}

.upload-trigger:hover {
  border-color: #ff4400;
  color: #ff4400;
}

.upload-trigger .el-icon {
  font-size: 24px;
}

.upload-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
}

.upload-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 20px;
  height: 20px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  line-height: 1;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.empty-reviews {
  padding: 40px 0;
}

.review-item {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  transition: box-shadow 0.2s;
}

.review-item:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

.review-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.review-user-info {
  flex: 1;
  min-width: 0;
}

.review-username {
  display: block;
  color: #333;
  font-weight: bold;
  margin-bottom: 4px;
}

.review-date {
  color: #999;
  font-size: 12px;
  white-space: nowrap;
}

.review-content {
  color: #555;
  line-height: 1.7;
  font-size: 14px;
}

.review-content p {
  margin: 0;
}

.review-images {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
}

.review-image-item {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid #eee;
  transition: transform 0.2s;
}

.review-image-item:hover {
  transform: scale(1.05);
}

.review-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.review-specs {
  margin-top: 10px;
}

@media (max-width: 768px) {
  .review-summary {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .review-score {
    flex-direction: row;
    gap: 10px;
  }

  .score-number {
    font-size: 36px;
  }

  .form-row {
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    width: auto;
  }

  .upload-trigger,
  .upload-preview,
  .review-image-item {
    width: 64px;
    height: 64px;
  }

  .review-header {
    flex-wrap: wrap;
  }

  .review-date {
    width: 100%;
    margin-top: 4px;
  }
}
</style>
