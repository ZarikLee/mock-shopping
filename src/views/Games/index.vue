<template>
  <div class="earn-center">
    <div class="top-section">
      <div class="container">
        <BackButton />

        <div class="points-card">
          <div class="points-info">
            <span class="points-label">我的余额</span>
            <span class="points-value">{{ userStore.balance }}</span>
          </div>
          <div class="today-earned">
            <span>今日赚取</span>
            <span class="today-num">+{{ todayEarned }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="container">
      <section class="category-section">
        <div class="category-header">
          <el-icon :size="24" color="#ff4400"><List /></el-icon>
          <h2>每日任务</h2>
        </div>
        <div class="task-grid">
          <div class="task-card">
            <div class="task-icon daily-checkin">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div class="task-body">
              <span class="task-name">每日签到</span>
              <span class="task-desc">{{ checkedIn ? '今日已签到' : '签到赚取金币' }}</span>
            </div>
            <button class="task-btn" :class="{ done: checkedIn }" :disabled="checkedIn" @click="doCheckin">
              {{ checkedIn ? '已签到' : '签到' }}
            </button>
          </div>
          <div class="task-card">
            <div class="task-icon share">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <div class="task-body">
              <span class="task-name">分享赚金币</span>
              <span class="task-desc">分享给好友赚5金币</span>
            </div>
            <button class="task-btn" :class="{ done: shared }" :disabled="shared" @click="doShare">
              {{ shared ? '已领取' : '分享' }}
            </button>
          </div>
        </div>
      </section>

      <section class="category-section">
        <div class="category-header">
          <el-icon :size="24" color="#ff4400"><Trophy /></el-icon>
          <h2>小游戏</h2>
        </div>
        <div class="games-grid">
          <div class="game-card wheel-game">
            <div class="card-header">
              <h3>幸运转盘</h3>
              <span class="card-badge">消耗100金币</span>
            </div>
            <p class="card-desc">转动转盘，赢取丰厚金币奖励！最高可赢10000金币！</p>
            <div class="wheel-wrapper">
              <div class="wheel-pointer">
                <svg viewBox="0 0 24 24" width="32" height="32"><polygon points="12,2 4,18 12,14 20,18" fill="#ff4400" stroke="#fff" stroke-width="1.5"/></svg>
              </div>
              <div class="wheel" :class="{ spinning: spinning }" :style="{ transform: `rotate(${wheelRotation}deg)` }" @transitionend="onWheelTransitionEnd">
                <svg viewBox="0 0 400 400" width="100%" height="100%">
                  <circle cx="200" cy="200" r="190" fill="none" stroke="#fff" stroke-width="4"/>
                  <g v-for="(seg, i) in wheelSegments" :key="i">
                    <path :d="seg.path" :fill="seg.color" stroke="#fff" stroke-width="2"/>
                    <text :x="seg.textX" :y="seg.textY" :transform="`rotate(${seg.textRot}, ${seg.textX}, ${seg.textY})`" text-anchor="middle" dominant-baseline="middle" fill="#333" font-weight="bold" font-size="18">{{ seg.prize }}</text>
                  </g>
                  <circle cx="200" cy="200" r="25" fill="#fff" stroke="#ddd" stroke-width="2"/>
                  <circle cx="200" cy="200" r="18" fill="#ff4400"/>
                </svg>
              </div>
            </div>
            <button class="play-btn wheel-btn" :disabled="!userStore.isLoggedIn || spinning || wheelCooldown > 0" @click="spinWheel">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/><path d="M21 3v5h-5"/></svg>
              <span v-if="wheelCooldown > 0" class="cooldown-text">{{ `冷却中 ${formatCooldown(wheelCooldown)}` }}</span>
              <span v-else>{{ spinning ? '转动中...' : '转动转盘' }}</span>
            </button>
          </div>

          <div class="game-card guess-game">
            <div class="card-header">
              <h3>猜数字</h3>
              <span class="card-badge">双倍奖励</span>
            </div>
            <p class="card-desc">下注金币，猜随机数字的大小，猜中赢得双倍金币！</p>
            <div class="limit-text guess-limit-text cooldown-text">本小时剩余次数：{{ guessRemaining }}/{{ guessHourlyLimit }}</div>
            <div class="guess-body">
              <div class="bet-area">
                <span class="bet-label">下注</span>
                <el-input-number v-model="betAmount" :min="10" :step="10" :max="userStore.balance" :disabled="guessing" controls-position="right" size="large" />
                <span class="bet-hint" v-if="userStore.balance < 10">金币不足！</span>
              </div>
              <div class="number-display" :class="{ revealed: guessRevealed, win: guessResult === 'win', lose: guessResult === 'lose' }">
                <span class="number-value">{{ guessRevealed ? randomNumber : '?' }}</span>
                <span class="number-label">{{ guessRevealed ? (randomNumber > 50 ? '大于50' : '小于等于50') : '等待猜数' }}</span>
              </div>
              <div class="result-area" v-if="guessRevealed">
                <div class="result-icon" :class="guessResult">
                  <svg v-if="guessResult === 'win'" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ff4d4f" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 12l2 2 4-4"/></svg>
                  <svg v-else viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#00b578" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
                </div>
                <div class="result-text">
                  <span class="result-title" :class="guessResult">{{ guessResult === 'win' ? '恭喜猜中！' : '很遗憾猜错了' }}</span>
                  <span class="result-score" :class="guessResult">{{ guessResult === 'win' ? '+' : '' }}{{ lastGuessScore }} 金币</span>
                </div>
                <button class="play-btn guess-again-btn" @click="resetGuess">再来一局</button>
              </div>
              <div class="guess-buttons" v-else>
                <button class="guess-btn high" :disabled="!userStore.isLoggedIn || guessing || userStore.balance < 10 || guessHourlyCount >= guessHourlyLimit" @click="makeGuess('high')">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>{{ guessHourlyCount >= guessHourlyLimit ? '本小时次数已用完' : '高（大于50）' }}
                </button>
                <button class="guess-btn low" :disabled="!userStore.isLoggedIn || guessing || userStore.balance < 10 || guessHourlyCount >= guessHourlyLimit" @click="makeGuess('low')">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>{{ guessHourlyCount >= guessHourlyLimit ? '本小时次数已用完' : '低（小于等于50）' }}
                </button>
              </div>
            </div>
          </div>

          <div class="game-card match-game">
            <div class="card-header">
              <h3>翻翻乐</h3>
              <span class="card-badge">配对有奖</span>
            </div>
            <p class="card-desc">翻开卡片，找到配对的图案！每对奖励10金币。</p>
            <div class="limit-text match-limit-text cooldown-text">本小时剩余：{{ matchRemaining }}/{{ matchHourlyLimit }}</div>
            <div class="match-body match-limit-body" v-if="matchHourlyCount >= matchHourlyLimit && matchCards.length === 0">
              <div class="match-result">
                <el-icon :size="48" color="#999" class="match-result-icon"><Clock /></el-icon>
                <span class="match-result-text">本小时次数已用完，下小时再来吧！</span>
              </div>
            </div>
            <div class="match-body" v-else-if="!matchGameOver">
              <div class="match-grid">
                <div v-for="(card, i) in matchCards" :key="i" class="match-card" :class="{ flipped: card.flipped || card.matched, matched: card.matched }" @click="flipCard(i)">
                  <div class="match-card-inner">
                    <div class="match-front">?</div>
                    <div class="match-back">
                      <div class="match-color-dot" :style="{ background: card.color }"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div class="match-score-row">
                <span class="match-pairs">已配对: {{ matchPairs }} / 4</span>
                <span class="match-flips">翻牌: {{ matchFlips }} / 10</span>
                <span class="match-earned">获得: +{{ matchEarned }} 金币</span>
              </div>
            </div>
            <div class="match-body" v-else>
              <div class="match-result">
                <el-icon :size="48" :color="matchWon ? '#ff4400' : '#999'" class="match-result-icon">
                  <CircleCheck v-if="matchWon" /><Close v-else />
                </el-icon>
                <span class="match-result-text" v-if="matchWon">恭喜完成！获得 <span class="match-earned-text">+{{ matchEarned }}</span> 金币</span>
                <span class="match-result-text" v-else>次数用完了！已配对 {{ matchPairs }} 对</span>
                <button class="play-btn match-restart-btn" :disabled="matchHourlyCount >= matchHourlyLimit" @click="initMatchGame">{{ matchHourlyCount >= matchHourlyLimit ? '本小时次数已用完' : '再来一局' }}</button>
              </div>
            </div>
            <button v-if="matchEarned > 0 && !matchClaimed" class="play-btn match-claim-btn" @click="claimMatchReward">领取 {{ matchEarned }} 金币</button>
          </div>

          <div class="game-card rps-game">
            <div class="card-header">
              <h3>石头剪刀布</h3>
              <span class="card-badge">消耗50金币</span>
            </div>
            <p class="card-desc">和电脑一决胜负！赢家赢得双倍奖励，平局退回下注金币。</p>
            <div class="limit-text rps-limit-text cooldown-text">本小时剩余次数：{{ rpsRemaining }}/{{ rpsHourlyLimit }}</div>
            <div class="rps-body">
              <div class="rps-result" :class="rpsResult">
                <template v-if="rpsResult">
                  <div class="rps-choice-row">
                    <div class="rps-choice">
                      <span class="rps-choice-emoji">
                        <span v-if="rpsPlayerChoice === 'rock'" class="rock-dot"></span>
                        <el-icon v-else :size="36"><component :is="RPS_ICONS[rpsPlayerChoice]" /></el-icon>
                      </span>
                      <span class="rps-choice-label">你出{{ RPS_NAMES[rpsPlayerChoice] }}</span>
                    </div>
                    <span class="rps-vs">VS</span>
                    <div class="rps-choice">
                      <span class="rps-choice-emoji">
                        <span v-if="rpsComputerChoice === 'rock'" class="rock-dot"></span>
                        <el-icon v-else :size="36"><component :is="RPS_ICONS[rpsComputerChoice]" /></el-icon>
                      </span>
                      <span class="rps-choice-label">电脑出{{ RPS_NAMES[rpsComputerChoice] }}</span>
                    </div>
                  </div>
                  <span class="rps-result-title" :class="rpsResult">{{ rpsResultText }}</span>
                  <span class="rps-score" :class="rpsResult">{{ rpsScoreText }}</span>
                  <button class="play-btn rps-again-btn" @click="rpsResult = ''">再来一局</button>
                </template>
                <template v-else>
                  <span class="rps-wait-text">选择你的出招，赢家获得双倍金币！</span>
                </template>
              </div>
              <div class="rps-buttons">
                <button class="rps-btn" :disabled="rpsPlaying || !canPlayRps" @click="playRps('rock')">
                  <span class="rps-symbol rock-dot"></span><span>石头</span>
                </button>
                <button class="rps-btn" :disabled="rpsPlaying || !canPlayRps" @click="playRps('paper')">
                  <el-icon :size="30" class="rps-symbol"><Document /></el-icon><span>布</span>
                </button>
                <button class="rps-btn" :disabled="rpsPlaying || !canPlayRps" @click="playRps('scissors')">
                  <el-icon :size="30" class="rps-symbol"><Scissor /></el-icon><span>剪刀</span>
                </button>
              </div>
            </div>
          </div>

          <div class="game-card dice-game">
            <div class="card-header">
              <h3>掷骰子</h3>
              <span class="card-badge">消耗100金币</span>
            </div>
            <p class="card-desc">掷出点数大于3即为赢家，赢得双倍金币奖励！</p>
            <div class="limit-text dice-limit-text cooldown-text">本小时剩余次数：{{ diceRemaining }}/{{ diceHourlyLimit }}</div>
            <div class="dice-body">
              <div class="dice-display" :class="diceResult">
                <span class="dice-face">
                  <span class="dice-square" :class="{ idle: !diceValue }">{{ diceValue || '?' }}</span>
                </span>
                <span class="dice-label">{{ diceResultText }}</span>
              </div>
              <button class="play-btn dice-btn" :disabled="!canPlayDice || diceRolling" @click="rollDice">
                <span v-if="diceRolling">掷骰子中...</span>
                <span v-else>{{ diceResult ? '再掷一次' : '掷骰子（100金币）' }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section class="category-section">
        <div class="category-header">
          <el-icon :size="24" color="#ff4400"><ShoppingBag /></el-icon>
          <h2>购物返利</h2>
        </div>
        <div class="rebate-card">
          <div class="rebate-rule">
            <el-icon :size="32" color="#ff4400"><Coin /></el-icon>
            <div class="rebate-info">
              <span class="rebate-title">购物返金币</span>
              <span class="rebate-desc">购物每满100元返5金币，多买多送！</span>
            </div>
          </div>
          <div class="promo-list">
            <div class="promo-item" v-for="(p, i) in promotions" :key="i">
              <span class="promo-tag">{{ p.tag }}</span>
              <span class="promo-desc">{{ p.desc }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="history-section">
        <div class="section-header">
          <h2>赚取记录</h2>
          <span class="history-count" v-if="records.length">共 {{ records.length }} 条</span>
        </div>
        <div class="history-empty" v-if="records.length === 0">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          <p>还没有记录，快来赚取金币吧！</p>
        </div>
        <div class="history-list" v-else>
          <div class="history-item" v-for="(rec, i) in records" :key="rec.id || i">
            <div class="history-icon" :class="getGameType(rec)">
              <svg v-if="rec.gameType === 'wheel'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v4"/><path d="M12 19v4"/><path d="M4.22 4.22l2.83 2.83"/><path d="M16.95 16.95l2.83 2.83"/><path d="M1 12h4"/><path d="M19 12h4"/><path d="M4.22 19.78l2.83-2.83"/><path d="M16.95 7.05l2.83-2.83"/></svg>
              <svg v-else-if="rec.gameType === 'guess'" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="8" cy="12" r="1.5"/><circle cx="16" cy="12" r="1.5"/><path d="M10 9h4"/><path d="M12 7v4"/></svg>
              <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div class="history-info">
              <span class="history-game">{{ getGameName(rec) }}</span>
              <span class="history-time">{{ formatTime(rec.created_at) }}</span>
            </div>
            <div class="history-score" :class="rec.score >= 0 ? 'win' : 'lose'">
              {{ rec.score >= 0 ? '+' : '' }}{{ rec.score }}
            </div>
          </div>
        </div>
      </section>
    </div>

    <el-dialog v-model="showPrizeDialog" title="中奖结果" width="360px" :close-on-click-modal="false" center>
      <div class="prize-dialog-body">
        <div class="prize-value" :class="lastPrize > 0 ? 'win' : 'lose'">{{ lastPrize }}</div>
        <div class="prize-label">{{ lastPrize > 0 ? '金币' : '下次加油！' }}</div>
        <div class="prize-message" v-if="lastPrize > 0">恭喜你赢得了 {{ lastPrize }} 金币！</div>
        <div class="prize-message" v-else>很遗憾，没有赢得金币，再试一次吧！</div>
      </div>
      <template #footer>
        <el-button type="primary" @click="showPrizeDialog = false" round>知道了</el-button>
      </template>
    </el-dialog>

    <ShareDialog @shared="onShared" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import { List, Trophy, ShoppingBag, Coin, CircleCheck, Clock, Close, Document, Scissor } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import ShareDialog from '../../components/ShareDialog/index.vue'
import { gameApi } from '../../api/games'
import { authApi } from '../../api/auth'
import { useUserStore } from '../../stores/user'
import { useShareStore } from '../../stores/share'

const userStore = useUserStore()

const todayEarned = ref(0)
const checkedIn = ref(false)
const shared = ref(false)

const doCheckin = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  try {
    const res = await userStore.checkin()
    const pts = res.balance || 10
    todayEarned.value += pts
    checkedIn.value = true
    ElMessage.success(`签到成功 +${pts} 金币`)
    loadRecords()
  } catch (e) {
    const err = e.error || ''
    if (err.includes('Already checked in')) {
      checkedIn.value = true
      ElMessage.info('今日已签到')
    } else {
      ElMessage.error('签到失败')
    }
  }
}

const doShare = () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  useShareStore().openShare(window.location.origin)
}

const onShared = () => {
  if (userStore.userInfo) {
    userStore.userInfo.balance = (userStore.userInfo.balance || 0) + 5
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
  todayEarned.value += 5
  shared.value = true
  ElMessage.success('分享成功 +5 金币')
}

const loadCheckinStatus = async () => {
  if (!userStore.isLoggedIn) return
  try {
    const res = await authApi.getCheckinStatus()
    checkedIn.value = res.checkedIn
  } catch {}
}

const SEG_COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF8FB1', '#9B72CF', '#FFC300', '#2EC4B6']
const PRIZES = [100, 200, 500, 1000, 2000, 5000, 0, 10000]
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

const wheelCooldown = ref(0)
let wheelCooldownTimer = null

const WHEEL_COOLDOWN = 3600 // 1 hour

const startWheelCooldown = (seconds = WHEEL_COOLDOWN) => {
  wheelCooldown.value = seconds
  localStorage.setItem('wheel_cooldown_until_v2', Date.now() + seconds * 1000)
  clearInterval(wheelCooldownTimer)
  wheelCooldownTimer = setInterval(() => {
    if (wheelCooldown.value > 0) {
      wheelCooldown.value--
    } else {
      clearInterval(wheelCooldownTimer)
      wheelCooldownTimer = null
    }
  }, 1000)
}

const formatCooldown = (secs) => {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const spinWheel = async () => {
  if (spinning.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (userStore.balance < 100) {
    ElMessage.warning('金币不足，需要100金币才能转动')
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
    startWheelCooldown()
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
  const netScore = lastPrize.value - 100
  if (netScore > 0) todayEarned.value += netScore
  userStore.fetchUserInfo()
  loadRecords()
}

const betAmount = ref(10)
const guessing = ref(false)
const guessRevealed = ref(false)
const randomNumber = ref(0)
const guessResult = ref('')
const lastGuessScore = ref(0)

const guessHourlyCount = ref(0)
const guessHourlyLimit = 5

const currentHour = ref(new Date().getHours())
const guessHourKey = () => `guess_hourly_count_${currentHour.value}`
const matchHourKey = () => `match_hourly_count_${currentHour.value}`
const rpsHourKey = () => `rps_hourly_count_${currentHour.value}`
const diceHourKey = () => `dice_hourly_count_${currentHour.value}`

guessHourlyCount.value = parseInt(localStorage.getItem(guessHourKey()) || '0')

const guessRemaining = computed(() => Math.max(0, guessHourlyLimit - guessHourlyCount.value))

const makeGuess = async (guess) => {
  if (guessing.value || guessRevealed.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
    if (betAmount.value > userStore.balance) {
    ElMessage.warning('金币不足')
    return
  }
  guessing.value = true
  try {
    const res = await gameApi.play({ gameType: 'guess', bet: betAmount.value, guess })
    randomNumber.value = res.number
    guessResult.value = res.result
    lastGuessScore.value = res.score
    guessRevealed.value = true
    if (res.score > 0) todayEarned.value += res.score
    guessHourlyCount.value++
    localStorage.setItem(guessHourKey(), String(guessHourlyCount.value))
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
  if (userStore.balance < betAmount.value) {
    betAmount.value = Math.max(10, Math.min(10, userStore.balance))
  }
}

const matchCards = ref([])
const matchFlipped = ref([])
const matchPairs = ref(0)
const matchEarned = ref(0)
const matchFlips = ref(0)
const matchGameOver = ref(false)
const matchWon = ref(false)
const matchClaimed = ref(false)
const matchLocked = ref(false)

const matchHourlyCount = ref(0)
const matchHourlyLimit = 3

matchHourlyCount.value = parseInt(localStorage.getItem(matchHourKey()) || '0')

const matchRemaining = computed(() => Math.max(0, matchHourlyLimit - matchHourlyCount.value))

const matchColors = ['#FF6B6B', '#FFD93D', '#4D96FF', '#2EC4B6']
const maxFlips = 10
const matchTotalPairs = 4

const initMatchGame = () => {
  if (matchHourlyCount.value >= matchHourlyLimit) {
    matchCards.value = []
    matchGameOver.value = false
    matchEarned.value = 0
    matchFlips.value = 0
    return
  }
  const deck = [...matchColors, ...matchColors]
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  matchCards.value = deck.map((color, idx) => ({
    color,
    id: idx,
    flipped: false,
    matched: false
  }))
  matchFlipped.value = []
  matchPairs.value = 0
  matchEarned.value = 0
  matchFlips.value = 0
  matchGameOver.value = false
  matchWon.value = false
  matchClaimed.value = false
  matchLocked.value = false
}

const finishMatchGame = (won) => {
  if (matchGameOver.value) return
  matchGameOver.value = true
  matchWon.value = won
  if (won) {
    matchHourlyCount.value++
    localStorage.setItem(matchHourKey(), String(matchHourlyCount.value))
  }
}

const flipCard = (idx) => {
  if (matchLocked.value || matchGameOver.value) return
  const card = matchCards.value[idx]
  if (card.flipped || card.matched) return
  card.flipped = true
  matchFlips.value++
  matchFlipped.value.push(idx)
  if (matchFlipped.value.length === 2) {
    matchLocked.value = true
    const [i1, i2] = matchFlipped.value
    const c1 = matchCards.value[i1]
    const c2 = matchCards.value[i2]
    if (c1.color === c2.color) {
      c1.matched = true
      c2.matched = true
      matchPairs.value++
      matchEarned.value += 10
      matchFlipped.value = []
      matchLocked.value = false
      if (matchPairs.value === matchTotalPairs) {
        finishMatchGame(true)
      } else if (matchFlips.value >= maxFlips) {
        finishMatchGame(false)
      }
    } else {
      setTimeout(() => {
        c1.flipped = false
        c2.flipped = false
        matchFlipped.value = []
        matchLocked.value = false
        if (matchFlips.value >= maxFlips) {
          finishMatchGame(false)
        }
      }, 800)
    }
  } else if (matchFlips.value >= maxFlips) {
    finishMatchGame(false)
  }
}

const claimMatchReward = () => {
  if (matchClaimed.value) return
  if (userStore.userInfo) {
    userStore.userInfo.balance = (userStore.userInfo.balance || 0) + matchEarned.value
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
  todayEarned.value += matchEarned.value
  matchClaimed.value = true
  ElMessage.success(`获得 ${matchEarned.value} 金币`)
}

const addCoins = (n) => {
  if (userStore.userInfo) {
    userStore.userInfo.balance = (userStore.userInfo.balance || 0) + n
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
  if (n > 0) todayEarned.value += n
}

const recordGamePlay = () => {
  if (userStore.userInfo) {
    userStore.userInfo.experience = (userStore.userInfo.experience || 0) + 1
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
}

const RPS_BET = 50
const rpsHourlyLimit = 5
const rpsHourlyCount = ref(0)
const rpsHourKeyNow = rpsHourKey()
rpsHourlyCount.value = parseInt(localStorage.getItem(rpsHourKeyNow) || '0')
const rpsRemaining = computed(() => Math.max(0, rpsHourlyLimit - rpsHourlyCount.value))
const canPlayRps = computed(() => userStore.isLoggedIn && userStore.balance >= RPS_BET && rpsRemaining.value > 0)

const RPS_CHOICES = ['rock', 'paper', 'scissors']
const RPS_ICONS = { paper: 'Document', scissors: 'Scissor' }
const RPS_NAMES = { rock: '石头', paper: '布', scissors: '剪刀' }
const rpsPlaying = ref(false)
const rpsResult = ref('')
const rpsPlayerChoice = ref('')
const rpsComputerChoice = ref('')
const rpsScore = ref(0)

const rpsResultText = computed(() => {
  if (rpsResult.value === 'win') return '你赢了！'
  if (rpsResult.value === 'lose') return '你输了！'
  return '平局！'
})

const rpsScoreText = computed(() => {
  if (rpsResult.value === 'win') return `+${rpsScore.value} 金币`
  if (rpsResult.value === 'lose') return `${rpsScore.value} 金币`
  return '退回下注金币'
})

const playRps = (choice) => {
  if (rpsPlaying.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (rpsRemaining.value <= 0) {
    ElMessage.warning('本小时次数已用完')
    return
  }
  if (userStore.balance < RPS_BET) {
    ElMessage.warning('金币不足，需要50金币')
    return
  }
  rpsPlaying.value = true
  const computer = RPS_CHOICES[Math.floor(Math.random() * 3)]
  let result = 'tie'
  if (choice !== computer) {
    const winMap = { rock: 'scissors', paper: 'rock', scissors: 'paper' }
    result = winMap[choice] === computer ? 'win' : 'lose'
  }
  const net = result === 'win' ? RPS_BET : result === 'lose' ? -RPS_BET : 0
  rpsPlayerChoice.value = choice
  rpsComputerChoice.value = computer
  rpsResult.value = result
  rpsScore.value = net
  addCoins(net)
  recordGamePlay()
  rpsHourlyCount.value++
  localStorage.setItem(rpsHourKey(), String(rpsHourlyCount.value))
  rpsPlaying.value = false
  if (result === 'win') {
    ElMessage.success(`你赢了 +${RPS_BET} 金币`)
  } else if (result === 'lose') {
    ElMessage.info(`你输了 -${RPS_BET} 金币`)
  } else {
    ElMessage.info('平局，退回下注金币')
  }
}

const DICE_BET = 100
const diceHourlyLimit = 3
const diceHourlyCount = ref(0)
const diceHourKeyNow = diceHourKey()
diceHourlyCount.value = parseInt(localStorage.getItem(diceHourKeyNow) || '0')
const diceRemaining = computed(() => Math.max(0, diceHourlyLimit - diceHourlyCount.value))
const canPlayDice = computed(() => userStore.isLoggedIn && userStore.balance >= DICE_BET && diceRemaining.value > 0)

const diceValue = ref(0)
const diceRolling = ref(false)
const diceResult = ref('')
const diceScore = ref(0)

const diceResultText = computed(() => {
  if (diceRolling.value) return '掷骰子中...'
  if (!diceResult.value) return diceValue.value ? `点数 ${diceValue.value}` : '点击按钮掷骰子'
  if (diceResult.value === 'win') return `掷出 ${diceValue.value}，大于3！+${diceScore.value} 金币`
  return `掷出 ${diceValue.value}，未超过3 -${DICE_BET} 金币`
})

const rollDice = () => {
  if (diceRolling.value) return
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return
  }
  if (diceRemaining.value <= 0) {
    ElMessage.warning('本小时次数已用完')
    return
  }
  if (userStore.balance < DICE_BET) {
    ElMessage.warning('金币不足，需要100金币')
    return
  }
  diceRolling.value = true
  diceResult.value = ''
  setTimeout(() => {
    const value = Math.floor(Math.random() * 6) + 1
    const won = value > 3
    const net = won ? DICE_BET : -DICE_BET
    diceValue.value = value
    diceResult.value = won ? 'win' : 'lose'
    diceScore.value = net
    addCoins(net)
    recordGamePlay()
    diceHourlyCount.value++
    localStorage.setItem(diceHourKey(), String(diceHourlyCount.value))
    diceRolling.value = false
    if (won) {
      ElMessage.success(`掷出 ${value}，+${DICE_BET} 金币`)
    } else {
      ElMessage.info(`掷出 ${value}，-${DICE_BET} 金币`)
    }
  }, 700)
}

const refreshHourlyLimits = () => {
  const hour = new Date().getHours()
  if (hour !== currentHour.value) {
    currentHour.value = hour
    guessHourlyCount.value = parseInt(localStorage.getItem(guessHourKey()) || '0')
    matchHourlyCount.value = parseInt(localStorage.getItem(matchHourKey()) || '0')
    rpsHourlyCount.value = parseInt(localStorage.getItem(rpsHourKey()) || '0')
    diceHourlyCount.value = parseInt(localStorage.getItem(diceHourKey()) || '0')
    initMatchGame()
  }
}

let hourlyTimer = null

const promotions = [
  { tag: '满减', desc: '购物满200元返10金币' },
  { tag: '限时', desc: '限时3倍金币，仅限今日' },
  { tag: '新客', desc: '首次购物额外返20金币' }
]

const records = ref([])
const loadRecords = async () => {
  try {
    const res = await gameApi.getRecords()
    records.value = Array.isArray(res) ? res : (res.data || [])
  } catch {
    records.value = []
  }
}

const getGameType = (rec) => {
  if (rec.gameType === 'wheel') return 'wheel'
  if (rec.gameType === 'guess') return 'guess'
  return 'task'
}

const getGameName = (rec) => {
  if (rec.gameType === 'wheel') return '幸运转盘'
  if (rec.gameType === 'guess') return '猜数字'
  if (rec.gameType === 'checkin') return '每日签到'
  if (rec.gameType === 'browse') return '浏览商品'
  if (rec.gameType === 'share') return '分享赚金币'
  return rec.gameType || '赚米任务'
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

onMounted(() => {
  document.title = '赚米中心 - 淘大宝'
  const savedCooldown = localStorage.getItem('wheel_cooldown_until_v2')
  if (savedCooldown) {
    const remaining = Math.max(0, Math.floor((savedCooldown - Date.now()) / 1000))
    if (remaining > 0) {
      wheelCooldown.value = remaining
      startWheelCooldown(remaining)
    }
  }
  if (userStore.isLoggedIn) {
    loadCheckinStatus()
    loadRecords()
  }
  initMatchGame()
  hourlyTimer = setInterval(refreshHourlyLimits, 60000)
})

onUnmounted(() => {
  clearInterval(hourlyTimer)
})
</script>

<style scoped>
.earn-center {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 80px;
}

.container {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 16px;
}

.top-section {
  background: linear-gradient(135deg, #ff4400, #ff6600);
  padding: 30px 0;
  box-shadow: 0 4px 20px rgba(255, 68, 0, 0.3);
}

.points-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  padding: 24px 32px;
  border-radius: 20px;
}

.points-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.points-label {
  color: #666;
  font-size: 14px;
}

.points-value {
  color: #ff4d4f;
  font-size: 42px;
  font-weight: bold;
  line-height: 1;
}

.today-earned {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: #999;
  font-size: 13px;
}

.today-num {
  color: #ff4d4f;
  font-size: 22px;
  font-weight: bold;
}

.category-section {
  margin: 28px 0;
}

.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.category-icon {
  display: flex;
}

.category-header h2 {
  color: #333;
  font-size: 20px;
  margin: 0;
}

.task-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.task-card {
  display: flex;
  align-items: center;
  gap: 14px;
  background: #fff;
  border-radius: 16px;
  padding: 18px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  transition: transform 0.3s, box-shadow 0.3s;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.1);
}

.task-icon {
  width: 50px;
  height: 50px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
}

.task-icon.daily-checkin {
  background: #ff4400;
}

.task-icon.share {
  background: #ff8833;
}

.task-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.task-name {
  color: #333;
  font-size: 15px;
  font-weight: 600;
}

.task-desc {
  color: #999;
  font-size: 12px;
}

.task-btn {
  padding: 8px 18px;
  border: none;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  white-space: nowrap;
  background: #ff4400;
  color: #fff;
}

.task-btn:hover:not(:disabled) {
  box-shadow: 0 4px 16px rgba(255, 68, 0, 0.4);
}

.task-btn.done {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.8;
  color: #fff;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.game-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(0,0,0,0.08);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.card-header h3 {
  color: #333;
  font-size: 18px;
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
  background: #ff4400;
}

.guess-game .card-badge {
  background: #ff6600;
}

.match-game .card-badge {
  background: #ff8833;
}

.rps-game .card-badge {
  background: #ff9c00;
}

.dice-game .card-badge {
  background: #ff5500;
}

.card-desc {
  color: #666;
  font-size: 13px;
  margin: 0 0 16px;
}

.limit-text {
  font-size: 12px;
  margin-bottom: 12px;
}

.cooldown-text {
  color: #ff6600;
  font-weight: 600;
}

.guess-limit-text,
.match-limit-text,
.rps-limit-text,
.dice-limit-text {
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 8px;
  padding: 6px 10px;
  text-align: center;
}

.match-limit-body .match-result {
  padding: 30px 0;
}

.wheel-wrapper {
  position: relative;
  width: 240px;
  height: 240px;
  margin: 0 auto 16px;
}

.wheel-pointer {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
}

.wheel {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  transition: transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99);
  box-shadow: 0 0 0 6px rgba(255,255,255,0.8), 0 8px 40px rgba(0,0,0,0.15);
}

.wheel.spinning {
  cursor: not-allowed;
}

.play-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
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
  background: #ff4400;
  color: #fff;
  margin-top: auto;
}

.wheel-btn:hover:not(:disabled) {
  background: #e63e00;
  box-shadow: 0 8px 25px rgba(255, 68, 0, 0.4);
}

.guess-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.bet-area {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.bet-label {
  color: #666;
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
  padding: 20px;
  border-radius: 16px;
  background: #fafafa;
  border: 2px solid #eee;
  transition: all 0.4s;
}

.number-display.revealed {
  border-color: #ddd;
  background: #fff;
}

.number-display.win {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.05);
  box-shadow: 0 0 30px rgba(255, 77, 79, 0.15);
}

.number-display.lose {
  border-color: #00b578;
  background: rgba(0, 181, 120, 0.05);
  box-shadow: 0 0 30px rgba(0, 181, 120, 0.15);
}

.number-value {
  font-size: 42px;
  font-weight: bold;
  color: #333;
  transition: all 0.4s;
  min-height: 52px;
  display: flex;
  align-items: center;
}

.number-display.win .number-value {
  color: #ff4d4f;
  text-shadow: 0 0 30px rgba(255, 77, 79, 0.3);
}

.number-display.lose .number-value {
  color: #00b578;
  text-shadow: 0 0 30px rgba(0, 181, 120, 0.3);
}

.number-label {
  font-size: 13px;
  color: #999;
}

.guess-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: auto;
}

.guess-btn {
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
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
  background: #ff4400;
}

.guess-btn.high:hover:not(:disabled) {
  background: #e63e00;
  box-shadow: 0 8px 25px rgba(255, 68, 0, 0.4);
  transform: scale(1.03);
}

.guess-btn.low {
  background: #ff6600;
}

.guess-btn.low:hover:not(:disabled) {
  background: #e65c00;
  box-shadow: 0 8px 25px rgba(255, 102, 0, 0.4);
  transform: scale(1.03);
}

.result-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px;
  margin-top: auto;
}

.result-icon {
  animation: resultPop 0.4s ease;
}

.result-icon.win svg {
  filter: drop-shadow(0 0 20px rgba(255, 77, 79, 0.6));
}

.result-icon.lose svg {
  filter: drop-shadow(0 0 20px rgba(0, 181, 120, 0.6));
}

.result-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.result-title {
  font-size: 16px;
  font-weight: 600;
}

.result-title.win { color: #ff4d4f; }
.result-title.lose { color: #00b578; }

.result-score {
  font-size: 22px;
  font-weight: bold;
}

.result-score.win { color: #ff4d4f; }
.result-score.lose { color: #00b578; }

.guess-again-btn {
  background: #ff4400;
  color: #fff;
  max-width: 200px;
}

.guess-again-btn:hover {
  background: #e63e00;
  box-shadow: 0 8px 25px rgba(255, 68, 0, 0.4);
}

.match-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.match-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.match-card {
  aspect-ratio: 1;
  perspective: 600px;
  cursor: pointer;
}

.match-card.matched {
  cursor: default;
}

.match-card-inner {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.4s;
  transform-style: preserve-3d;
}

.match-card.flipped .match-card-inner {
  transform: rotateY(180deg);
}

.match-front, .match-back {
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  backface-visibility: hidden;
}

.match-front {
  background: #ff4400;
  color: #fff;
  font-size: 28px;
  font-weight: bold;
}

.match-back {
  background: #fff;
  border: 2px solid #f0f0f0;
  transform: rotateY(180deg);
  padding: 6px;
}

.match-color-dot {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  box-shadow: inset -4px -4px 8px rgba(0, 0, 0, 0.15);
}

.match-card.matched .match-back {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.08);
  box-shadow: 0 0 16px rgba(255, 77, 79, 0.2);
}

.match-score-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 0 4px;
}

.match-pairs {
  color: #666;
  font-size: 13px;
}

.match-flips {
  color: #ff6600;
  font-size: 13px;
  font-weight: 600;
}

.match-earned {
  color: #ff4d4f;
  font-size: 14px;
  font-weight: 600;
}

.match-earned-text {
  color: #ff4d4f;
  font-weight: 700;
}

.match-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 30px 0;
}

.match-result-icon {
  display: flex;
}

.match-result-text {
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.match-restart-btn {
  background: #ff4400;
  color: #fff;
  max-width: 200px;
}

.match-claim-btn {
  background: #ff4d4f;
  color: #fff;
  margin-top: 8px;
}

.match-claim-btn:hover:not(:disabled) {
  box-shadow: 0 8px 25px rgba(255, 77, 79, 0.4);
}

.rps-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rps-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 14px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
}

.rps-result.win {
  background: rgba(255, 77, 79, 0.06);
  border-color: rgba(255, 77, 79, 0.35);
}

.rps-result.lose {
  background: rgba(0, 181, 120, 0.06);
  border-color: rgba(0, 181, 120, 0.35);
}

.rps-result.tie {
  background: #fafafa;
  border-color: #eee;
}

.rps-choice-row {
  display: flex;
  align-items: center;
  gap: 22px;
}

.rps-choice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.rps-choice-emoji {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  line-height: 1;
  min-height: 36px;
}

.rock-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #ff4400;
  box-shadow: inset -5px -5px 10px rgba(0, 0, 0, 0.25);
}

.rps-choice-label {
  font-size: 12px;
  color: #666;
}

.rps-vs {
  font-size: 16px;
  font-weight: 700;
  color: #ff4400;
}

.rps-result-title {
  font-size: 15px;
  font-weight: 600;
}

.rps-result-title.win { color: #ff4d4f; }
.rps-result-title.lose { color: #00b578; }
.rps-result-title.tie { color: #666; }

.rps-score {
  font-size: 20px;
  font-weight: 700;
}

.rps-score.win { color: #ff4d4f; }
.rps-score.lose { color: #00b578; }
.rps-score.tie { color: #666; }

.rps-wait-text {
  font-size: 13px;
  color: #999;
  padding: 8px 0;
}

.rps-again-btn {
  background: #ff4400;
  color: #fff;
  max-width: 200px;
}

.rps-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: auto;
}

.rps-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 0;
  border: none;
  border-radius: 12px;
  background: #fff5f0;
  color: #ff4400;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.rps-btn:hover:not(:disabled) {
  background: #ff4400;
  color: #fff;
  transform: translateY(-2px);
}

.rps-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.rps-btn .rps-symbol {
  font-size: 30px;
  line-height: 1;
  display: flex;
}

.rps-btn .rock-dot {
  width: 26px;
  height: 26px;
}

.dice-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
}

.dice-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 18px;
  border-radius: 12px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  width: 100%;
  transition: all 0.3s;
}

.dice-display.win {
  background: rgba(255, 77, 79, 0.06);
  border-color: rgba(255, 77, 79, 0.35);
}

.dice-display.lose {
  background: rgba(0, 181, 120, 0.06);
  border-color: rgba(0, 181, 120, 0.35);
}

.dice-face {
  display: flex;
  align-items: center;
  justify-content: center;
}

.dice-square {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ff4400, #ff6600);
  color: #fff;
  font-size: 30px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset -4px -4px 10px rgba(0, 0, 0, 0.15);
}

.dice-square.idle {
  background: #eee;
  color: #999;
  box-shadow: none;
}

.dice-label {
  font-size: 13px;
  color: #666;
  text-align: center;
}

.dice-btn {
  background: #ff4400;
  color: #fff;
  margin-top: auto;
}

.dice-btn:hover:not(:disabled) {
  background: #e63e00;
  box-shadow: 0 8px 25px rgba(255, 68, 0, 0.4);
}

.rebate-card {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 24px;
}

.rebate-rule {
  display: flex;
  align-items: center;
  gap: 14px;
  padding-bottom: 18px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 18px;
}

.rebate-icon {
  display: flex;
}

.rebate-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rebate-title {
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.rebate-desc {
  color: #999;
  font-size: 13px;
}

.promo-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.promo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #fafafa;
  border-radius: 12px;
}

.promo-tag {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  background: #ff4400;
  white-space: nowrap;
}

.promo-desc {
  color: #666;
  font-size: 13px;
}

.history-section {
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 40px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h2 {
  color: #333;
  font-size: 18px;
  margin: 0;
}

.history-count {
  color: #999;
  font-size: 13px;
}

.history-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 40px;
  color: #999;
}

.history-empty p {
  margin: 0;
  font-size: 14px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-radius: 12px;
  background: #fafafa;
  transition: background 0.2s;
}

.history-item:hover {
  background: #f0f0f0;
}

.history-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.history-icon.wheel {
  background: rgba(255, 68, 0, 0.1);
  color: #ff4400;
}

.history-icon.guess {
  background: rgba(255, 102, 0, 0.1);
  color: #ff6600;
}

.history-icon.task {
  background: rgba(82, 196, 26, 0.1);
  color: #52c41a;
}

.history-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.history-game {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.history-time {
  color: #999;
  font-size: 12px;
}

.history-score {
  font-size: 16px;
  font-weight: bold;
  white-space: nowrap;
}

.history-score.win {
  color: #ff4d4f;
}

.history-score.lose {
  color: #00b578;
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
  color: #ff4d4f;
}

.prize-value.lose {
  color: #999;
}

.prize-label {
  font-size: 16px;
  color: #999;
}

.prize-message {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

@keyframes resultPop {
  0% { transform: scale(0); opacity: 0; }
  60% { transform: scale(1.2); }
  100% { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .earn-center {
    padding-bottom: 100px;
  }
  .task-grid {
    grid-template-columns: 1fr;
  }
  .games-grid {
    grid-template-columns: 1fr;
  }
  .top-section {
    padding: 20px 0;
  }
  .points-card {
    padding: 18px 20px;
  }
  .points-value {
    font-size: 32px;
  }
  .wheel-wrapper {
    width: 200px;
    height: 200px;
  }
  .number-value {
    font-size: 36px;
    min-height: 44px;
  }
  .match-grid {
    gap: 6px;
  }
  .history-section {
    padding: 16px;
    margin-bottom: 20px;
  }
}
</style>
