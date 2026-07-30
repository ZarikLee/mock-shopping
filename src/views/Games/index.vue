<template>
  <div class="games-page">
    <div class="games-header">
      <div class="container">
        <div class="header-left">
          <div class="header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><path d="M10 9h4"/><path d="M12 7v4"/></svg>
          </div>
          <h1>游戏中心</h1>
        </div>
        <div class="header-right">
          <span class="points-label">当前积分</span>
          <span class="points-value">{{ userStore.points }}</span>
        </div>
      </div>
    </div>

    <div class="container">
      <div class="games-grid">
        <div class="game-card wheel-game">
          <div class="card-header">
            <h2>幸运转盘</h2>
            <span class="card-badge">消耗10积分</span>
          </div>
          <p class="card-desc">转动转盘，赢取丰厚积分奖励！最高可赢500积分！</p>
          <div class="wheel-wrapper">
            <div class="wheel-pointer">
              <svg viewBox="0 0 24 24" width="32" height="32"><polygon points="12,2 4,18 12,14 20,18" fill="#ff4400" stroke="#fff" stroke-width="1.5"/></svg>
            </div>
            <div class="wheel" :class="{ spinning: spinning }" :style="{ transform: `rotate(${wheelRotation}deg)` }" @transitionend="onWheelTransitionEnd">
              <svg viewBox="0 0 400 400" width="100%" height="100%">
                <circle cx="200" cy="200" r="190" fill="none" stroke="#fff" stroke-width="4"/>
                <g v-for="(seg, i) in wheelSegments" :key="i">
                  <path :d="seg.path" :fill="seg.color" stroke="#fff" stroke-width="2"/>
                  <text
                    :x="seg.textX"
                    :y="seg.textY"
                    :transform="`rotate(${seg.textRot}, ${seg.textX}, ${seg.textY})`"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="#fff"
                    font-weight="bold"
                    font-size="18"
                  >{{ seg.prize }}</text>
                </g>
                <circle cx="200" cy="200" r="25" fill="#fff" stroke="#ddd" stroke-width="2"/>
                <circle cx="200" cy="200" r="18" fill="#ff4400"/>
              </svg>
            </div>
          </div>
          <button class="play-btn wheel-btn" :disabled="!userStore.isLoggedIn || spinning" @click="spinWheel">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v5h-5"/></svg>
            {{ spinning ? '转动中...' : '转动转盘' }}
          </button>
        </div>

        <div class="game-card guess-game">
          <div class="card-header">
            <h2>猜数字</h2>
            <span class="card-badge">双倍奖励</span>
          </div>
          <p class="card-desc">下注积分，猜随机数字的大小，猜中赢得双倍积分！</p>
          <div class="guess-body">
            <div class="bet-area">
              <span class="bet-label">下注积分</span>
              <el-input-number v-model="betAmount" :min="10" :step="10" :max="userStore.points" :disabled="guessing" controls-position="right" size="large" />
              <span class="bet-hint" v-if="userStore.points < 10">积分不足！</span>
            </div>
            <div class="number-display" :class="{ revealed: guessRevealed, win: guessResult === 'win', lose: guessResult === 'lose' }">
              <span class="number-value">{{ guessRevealed ? randomNumber : '?' }}</span>
              <span class="number-label">{{ guessRevealed ? (randomNumber > 50 ? '大于50' : '小于等于50') : '等待猜数' }}</span>
            </div>
            <div class="result-area" v-if="guessRevealed">
              <div class="result-icon" :class="guessResult">
                <svg v-if="guessResult === 'win'" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#52c41a" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                <svg v-else viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ff4d4f" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
              </div>
              <div class="result-text">
                <span class="result-title" :class="guessResult">{{ guessResult === 'win' ? '恭喜猜中！' : '很遗憾猜错了' }}</span>
                <span class="result-score" :class="guessResult">{{ guessResult === 'win' ? '+' : '' }}{{ lastGuessScore }} 积分</span>
              </div>
              <button class="play-btn guess-again-btn" @click="resetGuess">再来一局</button>
            </div>
            <div class="guess-buttons" v-else>
              <button class="guess-btn high" :disabled="!userStore.isLoggedIn || guessing || userStore.points < 10" @click="makeGuess('high')">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>
                高（大于50）
              </button>
              <button class="guess-btn low" :disabled="!userStore.isLoggedIn || guessing || userStore.points < 10" @click="makeGuess('low')">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>
                低（小于等于50）
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="history-section">
        <div class="history-header">
          <h2>游戏记录</h2>
          <span class="history-count" v-if="records.length">共 {{ records.length }} 条</span>
        </div>
        <div class="history-empty" v-if="records.length === 0">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <p>还没有游戏记录，快来玩一局吧！</p>
        </div>
        <div class="history-list" v-else>
          <div class="history-item" v-for="(rec, i) in records" :key="rec.id || i">
            <div class="history-icon" :class="rec.gameType">
              <svg v-if="rec.gameType === 'wheel'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="M4.22 19.78l2.83-2.83"/><path d="M16.95 7.05l2.83-2.83"/></svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><path d="M10 9h4"/><path d="M12 7v4"/></svg>
            </div>
            <div class="history-info">
              <span class="history-game">{{ rec.gameType === 'wheel' ? '幸运转盘' : '猜数字' }}</span>
              <span class="history-time">{{ formatTime(rec.created_at) }}</span>
            </div>
            <div class="history-score" :class="rec.score >= 0 ? 'win' : 'lose'">
              {{ rec.score >= 0 ? '+' : '' }}{{ rec.score }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showPrizeDialog" title="🎉 中奖结果" width="360px" :close-on-click-modal="false" center>
      <div class="prize-dialog-body">
        <div class="prize-value" :class="lastPrize > 0 ? 'win' : 'lose'">{{ lastPrize }}</div>
        <div class="prize-label">{{ lastPrize > 0 ? '积分' : '下次加油！' }}</div>
        <div class="prize-message" v-if="lastPrize > 0">恭喜你赢得了 {{ lastPrize }} 积分！</div>
        <div class="prize-message" v-else>很遗憾，没有赢得积分，再试一次吧！</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showPrizeDialog = false" round>知道了</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { gameApi } from '../../api/games'
import { useUserStore } from '../../stores/user'

const userStore = useUserStore()

const SEG_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
const PRIZES = [10, 20, 50, 100, 0, 200, 5, 500]
const CX = 200, CY = 200, R = 180
const SEG_ANGLE = Math.PI / 4

const wheelSegments = computed(() => {
  return PRIZES.map((prize, i) => {
    const startA = -Math.PI / 2 + i * SEG_ANGLE
    const endA = startA + SEG_ANGLE
    const x1 = CX + R * Math.cos(startA)
    const y1 = CY + R * Math.sin(startA)
    const x2 = CX + R * Math.cos(endA)
    const y2 = CY + R * Math.sin(endA)
    const path = `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`
    const midA = startA + SEG_ANGLE / 2
    const tr = 120
    const textX = CX + tr * Math.cos(midA)
    const textY = CY + tr * Math.sin(midA)
    const deg = midA * 180 / Math.PI
    const textRot = deg > 90 && deg < 270 ? deg + 180 : deg
    return { prize, color: SEG_COLORS[i], path, textX, textY, textRot }
  })
})

const wheelRotation = ref(0)
const spinning = ref(false)
const showPrizeDialog = ref(false)
const lastPrize = ref(0)

const spinWheel = async () => {
  if (spinning.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  spinning.value = true
  try {
    const res = await gameApi.play({ gameType: 'wheel' })
    const prize = res.score
    const idx = PRIZES.indexOf(prize)
    if (idx === -1) {
      spinning.value = false
      ElMessage.error('Server error: invalid prize')
      return
    }
    const currentAngle = ((wheelRotation.value % 360) + 360) % 360
    const targetAngle = ((337.5 - idx * 45) % 360 + 360) % 360
    let additional = targetAngle - currentAngle
    if (additional < 0) additional += 360
    additional += 5 * 360
    wheelRotation.value += additional
    lastPrize.value = prize
  } catch (e) {
    spinning.value = false
    ElMessage.error(e.error || e.message || '请求失败')
  }
}

const onWheelTransitionEnd = () => {
  if (!spinning.value) return
  spinning.value = false
  if (lastPrize.value > 0) {
    showPrizeDialog.value = true
  } else {
    ElMessage.info('很遗憾，没有中奖')
  }
  userStore.fetchUserInfo()
  loadRecords()
}

const betAmount = ref(10)
const guessing = ref(false)
const guessRevealed = ref(false)
const randomNumber = ref(0)
const guessResult = ref('')
const lastGuessScore = ref(0)

const makeGuess = async (guess) => {
  if (guessing.value || guessRevealed.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (betAmount.value > userStore.points) {
    ElMessage.warning('积分不足')
    return
  }
  guessing.value = true
  try {
    const res = await gameApi.play({ gameType: 'guess', bet: betAmount.value, guess })
    randomNumber.value = res.number
    guessResult.value = res.result
    lastGuessScore.value = res.score
    guessRevealed.value = true
    userStore.fetchUserInfo()
    loadRecords()
  } catch (e) {
    ElMessage.error(e.error || e.message || '请求失败')
  } finally {
    guessing.value = false
  }
}

const resetGuess = () => {
  guessRevealed.value = false
  randomNumber.value = 0
  guessResult.value = ''
  lastGuessScore.value = 0
  if (userStore.points < betAmount.value) {
    betAmount.value = Math.max(10, Math.min(10, userStore.points))
  }
}

const records = ref([])
const loadRecords = async () => {
  try {
    const res = await gameApi.getRecords()
    records.value = Array.isArray(res) ? res : (res.data || [])
  } catch {
    records.value = []
  }
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  if (userStore.isLoggedIn) {
    loadRecords()
  }
})
</script>

<style scoped>
.games-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  padding-bottom: 80px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.games-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px 0;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
}
.games-header .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.header-icon svg {
  width: 36px;
  height: 36px;
  color: #fff;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}
.games-header h1 {
  font-size: 26px;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(255,255,255,0.15);
  backdrop-filter: blur(10px);
  padding: 10px 20px;
  border-radius: 30px;
}
.points-label {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}
.points-value {
  color: #ffd700;
  font-size: 22px;
  font-weight: bold;
  text-shadow: 0 0 20px rgba(255,215,0,0.5);
}

.games-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin: 30px 0;
}
.game-card {
  background: rgba(255,255,255,0.06);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 20px;
  padding: 28px;
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}
.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.3);
}
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.card-header h2 {
  color: #fff;
  font-size: 20px;
  margin: 0;
}
.card-badge {
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}
.wheel-game .card-badge {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.guess-game .card-badge {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.card-desc {
  color: rgba(255,255,255,0.6);
  font-size: 13px;
  margin: 0 0 20px;
}

.wheel-wrapper {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto 20px;
}
.wheel-pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
}
.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  box-shadow: 0 0 0 6px rgba(255,255,255,0.15), 0 8px 40px rgba(0,0,0,0.4);
}
.wheel.spinning {
  cursor: not-allowed;
}

.play-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
}
.play-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.wheel-btn {
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #fff;
  margin-top: auto;
}
.wheel-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #e881f0, #e94d60);
  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
}

.guess-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
}
.bet-area {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.bet-label {
  color: rgba(255,255,255,0.7);
  font-size: 14px;
  white-space: nowrap;
}
.bet-hint {
  color: #ff6b6b;
  font-size: 12px;
}
.number-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 24px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 2px solid rgba(255,255,255,0.1);
  transition: all 0.4s;
}
.number-display.revealed {
  border-color: rgba(255,255,255,0.3);
  background: rgba(255,255,255,0.08);
}
.number-display.win {
  border-color: #52c41a;
  background: rgba(82, 196, 26, 0.1);
  box-shadow: 0 0 30px rgba(82, 196, 26, 0.2);
}
.number-display.lose {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.1);
  box-shadow: 0 0 30px rgba(255, 77, 79, 0.2);
}
.number-value {
  font-size: 48px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 0 30px rgba(255,255,255,0.3);
  transition: all 0.4s;
  min-height: 60px;
  display: flex;
  align-items: center;
}
.number-display.win .number-value {
  color: #52c41a;
  text-shadow: 0 0 30px rgba(82, 196, 26, 0.5);
}
.number-display.lose .number-value {
  color: #ff4d4f;
  text-shadow: 0 0 30px rgba(255, 77, 79, 0.5);
}
.number-label {
  font-size: 13px;
  color: rgba(255,255,255,0.5);
}

.guess-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: auto;
}
.guess-btn {
  padding: 16px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.3s;
  color: #fff;
}
.guess-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.guess-btn.high {
  background: linear-gradient(135deg, #f093fb, #f5576c);
}
.guess-btn.high:hover:not(:disabled) {
  background: linear-gradient(135deg, #e881f0, #e94d60);
  box-shadow: 0 8px 25px rgba(245, 87, 108, 0.4);
  transform: scale(1.03);
}
.guess-btn.low {
  background: linear-gradient(135deg, #4facfe, #00f2fe);
}
.guess-btn.low:hover:not(:disabled) {
  background: linear-gradient(135deg, #3d9ef0, #00d8f0);
  box-shadow: 0 8px 25px rgba(79, 172, 254, 0.4);
  transform: scale(1.03);
}

.result-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-top: auto;
}
.result-icon {
  animation: resultPop 0.4s ease;
}
.result-icon.win svg {
  filter: drop-shadow(0 0 20px rgba(82, 196, 26, 0.6));
}
.result-icon.lose svg {
  filter: drop-shadow(0 0 20px rgba(255, 77, 79, 0.6));
}
.result-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.result-title {
  font-size: 18px;
  font-weight: 600;
}
.result-title.win { color: #52c41a; }
.result-title.lose { color: #ff4d4f; }
.result-score {
  font-size: 24px;
  font-weight: bold;
}
.result-score.win { color: #52c41a; }
.result-score.lose { color: #ff4d4f; }
.guess-again-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  max-width: 200px;
}
.guess-again-btn:hover {
  background: linear-gradient(135deg, #5a6fd6, #6a4196);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

@keyframes resultPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

.history-section {
  background: rgba(255,255,255,0.04);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 40px;
}
.history-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.history-header h2 {
  color: #fff;
  font-size: 18px;
  margin: 0;
}
.history-count {
  color: rgba(255,255,255,0.4);
  font-size: 13px;
}
.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: rgba(255,255,255,0.3);
}
.history-empty p {
  margin: 0;
  font-size: 14px;
}
.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(255,255,255,0.04);
  transition: background 0.2s;
}
.history-item:hover {
  background: rgba(255,255,255,0.08);
}
.history-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.history-icon.wheel {
  background: rgba(240, 147, 251, 0.2);
  color: #f093fb;
}
.history-icon.guess {
  background: rgba(79, 172, 254, 0.2);
  color: #4facfe;
}
.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.history-game {
  color: #fff;
  font-size: 14px;
  font-weight: 500;
}
.history-time {
  color: rgba(255,255,255,0.4);
  font-size: 12px;
}
.history-score {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}
.history-score.win {
  color: #52c41a;
}
.history-score.lose {
  color: #ff4d4f;
}

.prize-dialog-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 0;
}
.prize-value {
  font-size: 64px;
  font-weight: bold;
  line-height: 1;
}
.prize-value.win {
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
}
.prize-value.win::after {
  content: ' 🎉';
}
.prize-value.lose {
  color: #999;
}
.prize-label {
  font-size: 16px;
  color: rgba(0,0,0,0.4);
}
.prize-message {
  font-size: 14px;
  color: rgba(0,0,0,0.6);
  margin-top: 8px;
}

@media (max-width: 768px) {
  .games-page {
    padding-bottom: 100px;
  }
  .games-grid {
    grid-template-columns: 1fr;
    gap: 20px;
    margin: 20px 0;
  }
  .games-header {
    padding: 16px 0;
  }
  .games-header h1 {
    font-size: 20px;
  }
  .header-icon svg {
    width: 28px;
    height: 28px;
  }
  .header-right {
    padding: 8px 14px;
  }
  .points-value {
    font-size: 18px;
  }
  .game-card {
    padding: 20px;
  }
  .wheel-wrapper {
    width: 220px;
    height: 220px;
  }
  .number-value {
    font-size: 36px;
    min-height: 44px;
  }
  .history-section {
    padding: 16px;
    margin-bottom: 20px;
  }
}
</style>
