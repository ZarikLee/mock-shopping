<template>
  <div class="user-profile-page">
    <div class="container">
      <BackButton />

      <div v-loading="loading" class="profile-body">
        <div v-if="profile" class="profile-card-wrap">
          <div class="profile-header">
            <img :src="profile.avatar" :alt="profile.nickname" class="profile-avatar" />
            <div class="profile-header-info">
              <div class="name-row">
                <span class="profile-name">{{ profile.nickname || profile.username }}</span>
                <span class="level-badge">Lv.{{ profile.level }}</span>
              </div>
              <div class="profile-meta">
                <span class="meta-item">
                  <el-icon><User /></el-icon>
                  ID: {{ profile.id }}
                </span>
                <span v-if="profile.homeCity" class="meta-item">
                  <el-icon><Location /></el-icon>
                  {{ profile.homeCity }}
                </span>
                <span v-if="profile.joinDate" class="meta-item">
                  <el-icon><Calendar /></el-icon>
                  {{ formatJoinDate(profile.joinDate) }} 加入
                </span>
              </div>
              <el-button v-if="isOwnProfile" type="primary" class="edit-btn" @click="goEditProfile">
                <el-icon><Edit /></el-icon> 编辑资料
              </el-button>
            </div>
          </div>

          <div v-if="profile.bio" class="bio-section">
            <h3 class="section-title">个人简介</h3>
            <p class="bio-text">{{ profile.bio }}</p>
          </div>

          <div class="stats-section">
            <div class="stat-card">
              <span class="stat-value">{{ profile.stats?.totalPurchases ?? 0 }}</span>
              <span class="stat-label">累计购买</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-card">
              <span class="stat-value">¥{{ formatAmount(profile.stats?.totalSpent ?? 0) }}</span>
              <span class="stat-label">累计消费</span>
            </div>
          </div>

          <div class="achievements-section">
            <h3 class="section-title">
              成就徽章
              <span class="achievements-count">{{ unlockedCount }}/{{ ACHIEVEMENTS.length }}</span>
            </h3>
            <div class="achievement-grid">
              <div
                v-for="item in ACHIEVEMENTS"
                :key="item.id"
                class="achievement-card"
                :class="{ unlocked: isUnlocked(item.id) }"
              >
                <div class="card-icon">
                  <el-icon :size="32" :color="isUnlocked(item.id) ? '#ff4400' : '#999'">
                    <component :is="isUnlocked(item.id) ? item.icon : 'Lock'" />
                  </el-icon>
                </div>
                <div class="card-name">{{ isUnlocked(item.id) ? item.name : '未解锁' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="!loading" class="empty-state">
          <el-icon :size="48"><UserFilled /></el-icon>
          <p>用户不存在或资料已删除</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { User, Location, Calendar, Edit, UserFilled, Lock } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import { userApi } from '../../api/users'
import { useUserStore } from '../../stores/user'
import { ACHIEVEMENTS } from '../../data/achievements'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const profile = ref(null)
const loading = ref(false)

const isOwnProfile = computed(() => {
  const ownId = userStore.userInfo?.id
  return ownId !== undefined && ownId !== null && Number(route.params.id) === Number(ownId)
})

const unlockedCount = computed(() => {
  const unlocked = profile.value?.achievements?.map(a => a.id) || []
  return ACHIEVEMENTS.filter(a => unlocked.includes(a.id)).length
})

const isUnlocked = (id) => {
  const unlocked = profile.value?.achievements?.map(a => a.id) || []
  return unlocked.includes(id)
}

const formatJoinDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const formatAmount = (val) => {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const goEditProfile = () => {
  router.push('/user?menu=profile')
}

async function fetchProfile() {
  loading.value = true
  try {
    profile.value = await userApi.getProfile(route.params.id)
  } catch {
    profile.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '用户主页 - 淘大宝'
  fetchProfile()
})
</script>

<style scoped>
.user-profile-page {
  padding: 30px 0;
  min-height: 60vh;
  background: #f5f5f5;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.profile-body {
  min-height: 300px;
}

.profile-card-wrap {
  background: #fff;
  border-radius: 12px;
  padding: 28px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 24px;
}

.profile-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ff4400;
  flex-shrink: 0;
}

.profile-header-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.profile-name {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.level-badge {
  background: linear-gradient(135deg, #ff4400, #ff6600);
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  flex-shrink: 0;
}

.profile-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 14px;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #888;
}

.edit-btn {
  border-radius: 8px;
}

.bio-section {
  margin-top: 24px;
  padding: 20px;
  background: #fff5f0;
  border-radius: 10px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.bio-text {
  font-size: 14px;
  color: #555;
  line-height: 1.7;
  margin: 0;
  white-space: pre-wrap;
}

.stats-section {
  display: flex;
  align-items: center;
  margin-top: 24px;
  padding: 20px 0;
  border-top: 1px solid #f0f0f0;
  border-bottom: 1px solid #f0f0f0;
}

.stat-card {
  flex: 1;
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 26px;
  font-weight: 700;
  color: #ff4400;
}

.stat-label {
  display: block;
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #eee;
}

.achievements-section {
  margin-top: 24px;
}

.achievements-count {
  font-size: 13px;
  color: #ff4400;
  font-weight: 600;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 14px;
}

.achievement-card {
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 16px 10px;
  text-align: center;
  transition: all 0.2s;
}

.achievement-card.unlocked {
  border-color: #ff4400;
  background: #fff5f0;
}

.achievement-card.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 68, 0, 0.15);
}

.card-icon {
  display: flex;
  justify-content: center;
  font-size: 32px;
  margin-bottom: 8px;
}

.achievement-card.unlocked .card-icon {
  filter: none;
}

.achievement-card:not(.unlocked) {
  background: #fafafa;
  opacity: 0.6;
}

.achievement-card:not(.unlocked) .card-icon {
  filter: grayscale(1);
}

.card-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.achievement-card:not(.unlocked) .card-name {
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-state p {
  font-size: 14px;
  margin-top: 12px;
}

:deep(.el-loading-mask) {
  background: rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
  .user-profile-page {
    padding: 16px 0;
  }

  .profile-card-wrap {
    padding: 20px;
  }

  .profile-header {
    flex-direction: column;
    text-align: center;
    gap: 16px;
  }

  .name-row,
  .profile-meta {
    justify-content: center;
  }

  .profile-meta {
    gap: 10px;
  }

  .stat-value {
    font-size: 20px;
  }

  .achievement-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
}
</style>
