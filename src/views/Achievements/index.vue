<template>
  <div class="achievements-page">
    <div class="container">
      <div class="page-header">
        <h2 class="page-title">我的成就</h2>
        <span class="page-count">{{ unlockedCount }} / {{ ACHIEVEMENTS.length }} 已解锁</span>
      </div>

      <div class="level-summary" v-if="userStore.isLoggedIn">
        <span class="level-icon">🏆</span>
        <div class="level-info">
          <span class="level-name">Lv.{{ userStore.level }}</span>
          <el-progress
            :percentage="levelProgress"
            :stroke-width="8"
            color="#ff4400"
            :show-text="false"
            class="level-progress"
          />
          <span class="level-text">经验值 {{ userStore.experience }} / {{ nextThreshold }}</span>
        </div>
      </div>

      <div class="achievement-grid">
        <div
          v-for="item in achievementList"
          :key="item.id"
          class="achievement-card"
          :class="{ unlocked: isUnlocked(item.id) }"
        >
          <div class="card-icon">{{ isUnlocked(item.id) ? item.icon : '❓' }}</div>
          <div class="card-name">{{ isUnlocked(item.id) ? item.name : '未解锁' }}</div>
          <div class="card-desc">{{ isUnlocked(item.id) ? item.desc : '???' }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useUserStore } from '../../stores/user'
import { authApi } from '../../api/auth'
import { ACHIEVEMENTS, getLevelProgress } from '../../data/achievements'

const userStore = useUserStore()

const achievementList = ACHIEVEMENTS

const isUnlocked = (id) => userStore.achievements.includes(id)

const unlockedCount = computed(() => {
  return ACHIEVEMENTS.filter((a) => userStore.achievements.includes(a.id)).length
})

const levelProgress = computed(() => {
  return getLevelProgress(userStore.experience).progress
})

const nextThreshold = computed(() => {
  return getLevelProgress(userStore.experience).nextThreshold
})

onMounted(async () => {
  document.title = '我的成就 - 淘大宝'
  try {
    await userStore.fetchUserInfo()
  } catch { /* ok */ }
})
</script>

<style scoped>
.achievements-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px 0;
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a1a;
}

.page-count {
  font-size: 14px;
  color: #ff4400;
  font-weight: 600;
}

.level-summary {
  display: flex;
  align-items: center;
  gap: 16px;
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.level-icon {
  font-size: 36px;
}

.level-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16px;
}

.level-name {
  font-size: 20px;
  font-weight: 700;
  color: #ff4400;
  white-space: nowrap;
}

.level-progress {
  flex: 1;
  max-width: 400px;
}

.level-text {
  font-size: 13px;
  color: #999;
  white-space: nowrap;
}

.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}

.achievement-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 2px solid transparent;
  transition: all 0.2s;
}

.achievement-card.unlocked {
  border-color: #ff4400;
  background: linear-gradient(180deg, #fff8f5, #fff);
}

.achievement-card.unlocked:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(255, 68, 0, 0.15);
}

.card-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.achievement-card:not(.unlocked) .card-icon {
  filter: grayscale(1);
  opacity: 0.4;
}

.card-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.achievement-card:not(.unlocked) .card-name {
  color: #bbb;
}

.card-desc {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .level-summary {
    padding: 16px;
  }

  .level-info {
    flex-wrap: wrap;
  }

  .level-progress {
    max-width: none;
  }

  .achievement-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
}
</style>
