<template>
  <div class="leaderboard-page">
    <div class="container">
      <div class="leaderboard-header">
        <div class="header-icon">
          <el-icon :size="40" color="#ff4400"><Trophy /></el-icon>
        </div>
        <h1 class="header-title">全服排行榜</h1>
        <p class="header-subtitle">与全服玩家一较高下</p>
      </div>

      <el-card class="leaderboard-card" shadow="never">
        <div class="tab-bar">
          <div
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-item"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            <el-icon class="tab-icon"><component :is="tab.icon" /></el-icon>
            <span class="tab-label">{{ tab.label }}</span>
          </div>
        </div>

        <div class="leaderboard-stats" v-if="currentUserRank">
          <div class="stat-row">
            <span class="stat-label">我的排名</span>
            <span class="stat-value rank-highlight">#{{ currentUserRank }}</span>
          </div>
        </div>

        <div class="leaderboard-body" v-loading="loading">
          <template v-if="list.length > 0">
            <div
              v-for="(item, index) in list"
              :key="item.userId"
              class="rank-row"
              :class="{
                'rank-top-1': item.rank === 1,
                'rank-top-2': item.rank === 2,
                'rank-top-3': item.rank === 3,
                'is-current-user': item.userId === currentUserId
              }"
            >
              <div class="rank-col">
                <span v-if="item.rank <= 3" class="medal">
                  <span class="medal-badge" :class="'medal-rank-' + item.rank">{{ item.rank }}</span>
                </span>
                <span v-else class="rank-num">{{ item.rank }}</span>
              </div>
              <div class="avatar-col">
                <img :src="item.avatar" :alt="item.nickname" class="user-avatar" />
                <div v-if="item.rank <= 3" class="avatar-ring"></div>
              </div>
              <div class="info-col">
                <span class="username">{{ item.nickname || item.username }}</span>
                <span class="userid">ID: {{ item.userId }}</span>
              </div>
              <div class="value-col">
                <span class="value-num">{{ formatValue(item) }}</span>
                <span class="value-label">{{ valueLabel }}</span>
              </div>
            </div>
          </template>
          <div v-else-if="!loading" class="empty-state">
            <el-icon class="empty-icon" :size="48"><DataAnalysis /></el-icon>
            <p>暂无排行数据</p>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Trophy, Wallet, Star, ShoppingCart, DataAnalysis } from '@element-plus/icons-vue'
import { useUserStore } from '../../stores/user'
import { leaderboardApi } from '../../api/leaderboard'

const userStore = useUserStore()
const currentUserId = computed(() => userStore.userInfo?.id)

const tabs = [
  { key: 'balance', label: '财富榜', icon: 'Wallet' },
  { key: 'points', label: '积分榜', icon: 'Star' },
  { key: 'spending', label: '消费榜', icon: 'ShoppingCart' }
]

const activeTab = ref('balance')
const list = ref([])
const loading = ref(false)

const valueLabel = computed(() => {
  const map = { balance: '余额', points: '积分', spending: '总消费' }
  return map[activeTab.value] || ''
})

const currentUserRank = computed(() => {
  const found = list.value.find(item => item.userId === currentUserId.value)
  return found ? found.rank : null
})

function formatValue(item) {
  if (activeTab.value === 'points') return item.points?.toLocaleString() || '0'
  const val = activeTab.value === 'balance' ? item.balance : item.totalSpent
  return '¥' + (val !== undefined ? Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00')
}

async function fetchData() {
  loading.value = true
  try {
    const apiMap = {
      balance: leaderboardApi.getByBalance,
      points: leaderboardApi.getByPoints,
      spending: leaderboardApi.getBySpending
    }
    const res = await apiMap[activeTab.value]()
    list.value = (res.leaderboard || []).map((item, idx) => ({
      ...item,
      rank: item.rank || idx + 1
    }))
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function switchTab(key) {
  if (activeTab.value === key) return
  activeTab.value = key
  fetchData()
}

onMounted(() => {
  document.title = '全服排行榜 - 淘大宝'
  fetchData()
})
</script>

<style scoped>
.leaderboard-page {
  padding: 30px 0;
  min-height: 60vh;
  background: #f5f5f5;
}

.leaderboard-header {
  text-align: center;
  margin-bottom: 30px;
}

.header-icon {
  margin-bottom: 8px;
}

.header-title {
  font-size: 28px;
  font-weight: 800;
  color: #333;
  letter-spacing: 2px;
}

.header-subtitle {
  font-size: 14px;
  color: #999;
  margin-top: 6px;
}

.leaderboard-card {
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  border: none;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

:deep(.el-card__body) {
  padding: 0;
}

.tab-bar {
  display: flex;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  padding: 18px 10px;
  text-align: center;
  cursor: pointer;
  color: #666;
  font-size: 15px;
  font-weight: 600;
  transition: all 0.3s;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.tab-item::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 3px;
  background: #ff4400;
  border-radius: 3px 3px 0 0;
  transition: width 0.3s;
}

.tab-item.active {
  color: #ff4400;
}

.tab-item.active::after {
  width: 60px;
}

.tab-item:hover {
  color: #ff4400;
}

.tab-icon {
  display: flex;
}

.leaderboard-stats {
  padding: 14px 24px;
  background: #fff5f0;
  border-bottom: 1px solid rgba(255, 68, 0, 0.12);
}

.stat-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 13px;
  color: #666;
}

.rank-highlight {
  font-size: 18px;
  font-weight: 800;
  color: #ff4400;
}

.leaderboard-body {
  padding: 8px 0;
  min-height: 300px;
}

.rank-row {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  gap: 14px;
  transition: background 0.2s;
  border-bottom: 1px solid #f5f5f5;
  background: #fff;
}

.rank-row:hover {
  background: #fafafa;
}

.rank-row.is-current-user {
  background: #fff5f0 !important;
  border-left: 3px solid #ff4400;
}

.rank-col {
  width: 40px;
  text-align: center;
  flex-shrink: 0;
}

.medal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.medal-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
}

.medal-rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4a);
  box-shadow: 0 2px 8px rgba(255, 215, 0, 0.4);
}

.medal-rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  box-shadow: 0 2px 8px rgba(192, 192, 192, 0.4);
}

.medal-rank-3 {
  background: linear-gradient(135deg, #cd7f32, #e8a84c);
  box-shadow: 0 2px 8px rgba(205, 127, 50, 0.4);
}

.rank-num {
  font-size: 15px;
  font-weight: 700;
  color: #999;
  font-feature-settings: 'tnum';
}

.rank-top-1 .rank-num,
.rank-top-2 .rank-num,
.rank-top-3 .rank-num {
  display: none;
}

.avatar-col {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  position: relative;
  z-index: 1;
}

.rank-top-1 .user-avatar {
  width: 44px;
  height: 44px;
  border: 2px solid #ffd700;
}

.rank-top-2 .user-avatar {
  border: 2px solid #c0c0c0;
}

.rank-top-3 .user-avatar {
  border: 2px solid #cd7f32;
}

.avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  z-index: 0;
}

.rank-top-1 .avatar-ring {
  background: conic-gradient(#ffd700, #ffed4a, #ffd700);
}

.rank-top-2 .avatar-ring {
  background: conic-gradient(#c0c0c0, #e8e8e8, #c0c0c0);
}

.rank-top-3 .avatar-ring {
  background: conic-gradient(#cd7f32, #e8a84c, #cd7f32);
}

.info-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.username {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-current-user .username {
  color: #ff4400;
}

.userid {
  font-size: 11px;
  color: #999;
}

.value-col {
  text-align: right;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.value-num {
  font-size: 17px;
  font-weight: 700;
  color: #ff4400;
  font-feature-settings: 'tnum';
}

.rank-top-1 .value-num {
  font-size: 19px;
  color: #ffd700;
}

.value-label {
  font-size: 11px;
  color: #999;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  display: block;
  margin-bottom: 12px;
}

.empty-state p {
  font-size: 14px;
}

:deep(.el-loading-mask) {
  background: rgba(255, 255, 255, 0.8);
}

:deep(.el-loading-spinner .circular) {
  border-color: #ff4400 transparent transparent transparent;
}

@media (max-width: 768px) {
  .leaderboard-page {
    padding: 16px 0;
  }

  .header-icon {
    font-size: 42px;
  }

  .header-title {
    font-size: 22px;
  }

  .leaderboard-card {
    border-radius: 8px;
  }

  .tab-item {
    font-size: 13px;
    padding: 14px 6px;
  }

  .rank-row {
    padding: 10px 14px;
    gap: 10px;
  }

  .rank-col {
    width: 32px;
  }

  .medal-badge {
    width: 24px;
    height: 24px;
    font-size: 12px;
  }

  .rank-num {
    font-size: 13px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
  }

  .rank-top-1 .user-avatar {
    width: 38px;
    height: 38px;
  }

  .username {
    font-size: 13px;
  }

  .value-num {
    font-size: 14px;
  }

  .rank-top-1 .value-num {
    font-size: 16px;
  }

  .leaderboard-stats {
    padding: 10px 14px;
  }
}
</style>
