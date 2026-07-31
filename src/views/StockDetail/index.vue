<template>
  <div class="stock-detail-page">
    <div class="container">
      <BackButton />

      <template v-if="stock">
        <div class="detail-header">
          <div class="header-left">
            <div class="stock-title">
              <h1 class="stock-name">{{ stock.name }}</h1>
              <span class="stock-symbol">{{ stock.symbol }}</span>
            </div>
            <span class="style-badge" :class="styleClass(stock.style)">{{ stock.style || '未知' }}</span>
          </div>
          <div class="live-indicator">
            <span class="live-dot"></span>
            <span>实时更新中</span>
          </div>
        </div>

        <div class="detail-grid">
          <div class="detail-left">
            <div class="quote-card">
              <div class="quote-left">
                <span class="quote-price" :class="trendClass">{{ formatPrice(quote.price) }}</span>
                <span class="quote-change" :class="trendClass">{{ formatPercent(quote.changePercent) }}</span>
              </div>
              <div class="quote-stats" v-if="userStore.isLoggedIn">
                <div class="q-stat">
                  <span class="q-label">持仓</span>
                  <span class="q-value">{{ holding?.shares ?? 0 }} 股</span>
                </div>
                <div class="q-stat">
                  <span class="q-label">成本价</span>
                  <span class="q-value">{{ formatPrice(holding?.avgCost) }}</span>
                </div>
                <div class="q-stat">
                  <span class="q-label">浮动盈亏</span>
                  <span class="q-value" :class="profitClass(holding?.profit)">{{ signedMoney(holding?.profit) }}</span>
                </div>
              </div>
            </div>

            <div class="info-card">
              <div class="card-title">股票信息</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">所属行业</span>
                  <span class="info-value">{{ stock.industry || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">总市值</span>
                  <span class="info-value">{{ stock.marketCap || '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">市盈率</span>
                  <span class="info-value">{{ stock.pe ? stock.pe.toFixed(2) : '-' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">交易所</span>
                  <span class="info-value">{{ stock.exchange || '-' }}</span>
                </div>
              </div>
              <div class="desc-block">
                <span class="info-label">公司简介</span>
                <p class="desc-text">{{ stock.desc || '暂无简介' }}</p>
              </div>
            </div>

            <div class="chart-card">
              <div class="card-title">
                <span>K线走势</span>
                <span class="chart-sub">最近 80 根 · 5 秒刷新</span>
              </div>
              <KLineChart :data="history" :height="chartHeight" />
            </div>
          </div>

          <div class="detail-right">
            <div class="trade-card">
              <div class="card-title">模拟交易</div>
              <template v-if="userStore.isLoggedIn">
                <div class="trade-tabs">
                  <div class="trade-tab" :class="{ active: activeTab === 'buy' }" @click="activeTab = 'buy'">买入</div>
                  <div class="trade-tab" :class="{ active: activeTab === 'sell' }" @click="activeTab = 'sell'">卖出</div>
                </div>

                <div class="trade-form">
                  <div class="form-row">
                    <span class="form-label">可用资金</span>
                    <span class="form-value">¥{{ balanceText }}</span>
                  </div>
                  <div v-if="activeTab === 'sell'" class="form-row">
                    <span class="form-label">可卖数量</span>
                    <span class="form-value">{{ maxSellShares }} 股</span>
                  </div>

                  <div class="form-label-block">数量（股）</div>
                  <el-input-number
                    v-model="shareInput"
                    :min="0"
                    :max="99999999"
                    :step="100"
                    :step-strictly="false"
                    :controls-position="'right'"
                    class="share-input"
                    @change="sanitizeShares"
                  />
                  <div class="quick-btns">
                    <button class="quick-btn" @click="quickShare(0.25)">1/4</button>
                    <button class="quick-btn" @click="quickShare(0.5)">1/2</button>
                    <button class="quick-btn" @click="quickShare(1)">全部</button>
                  </div>

                  <div class="calc-box">
                    <template v-if="activeTab === 'buy'">
                      <div class="calc-row">
                        <span>买入金额</span>
                        <span>¥{{ formatMoney(buyCost) }}</span>
                      </div>
                      <div class="calc-row">
                        <span>手续费 (1.5%)</span>
                        <span>¥{{ formatMoney(buyFee) }}</span>
                      </div>
                      <div class="calc-row total">
                        <span>预计花费</span>
                        <span>¥{{ formatMoney(buyTotal) }}</span>
                      </div>
                    </template>
                    <template v-else>
                      <div class="calc-row">
                        <span>卖出金额</span>
                        <span>¥{{ formatMoney(sellProceeds) }}</span>
                      </div>
                      <div class="calc-row">
                        <span>手续费 (3%)</span>
                        <span>¥{{ formatMoney(sellFee) }}</span>
                      </div>
                      <div class="calc-row total">
                        <span>预计净得</span>
                        <span>¥{{ formatMoney(sellNet) }}</span>
                      </div>
                    </template>
                  </div>

                  <el-button
                    class="trade-btn"
                    :class="activeTab === 'buy' ? 'buy-btn' : 'sell-btn'"
                    :loading="trading"
                    @click="submitTrade"
                  >
                    {{ activeTab === 'buy' ? '买入' : '卖出' }}
                  </el-button>
                </div>
              </template>
              <div v-else class="login-tip">
                <el-icon :size="40"><Lock /></el-icon>
                <p>登录后可进行模拟交易</p>
                <el-button type="primary" @click="requireLogin">去登录</el-button>
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-else-if="!loading" class="not-found">
        <el-icon :size="44"><Warning /></el-icon>
        <p>未找到该股票</p>
        <el-button type="primary" plain @click="goBack">返回股票列表</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Lock, Warning } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import KLineChart from '../../components/KLineChart/index.vue'
import { stockApi } from '../../api/stocks'
import { useUserStore } from '../../stores/user'
import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const symbol = computed(() => route.params.symbol)
const stock = ref(null)
const quote = ref({ price: 0, changePercent: 0 })
const history = ref([])
const loading = ref(false)
const holding = ref(null)
const lastQuoteUpdate = ref('')

const activeTab = ref('buy')
const shareInput = ref(100)
const trading = ref(false)

const isDesktop = ref(false)

let refreshTimer = null

const balanceText = computed(() => Number(userStore.balance).toFixed(2))

const formatPrice = (p) => Number(p || 0).toFixed(2)
const formatMoney = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPercent = (p) => (Number(p) >= 0 ? '+' : '') + Number(p || 0).toFixed(2) + '%'
const signedMoney = (v) => (Number(v) > 0 ? '+' : '') + formatMoney(v)

const trendClass = computed(() => {
  const p = Number(quote.value.changePercent)
  if (p > 0) return 'up'
  if (p < 0) return 'down'
  return 'flat'
})

const profitClass = (v) => (Number(v) >= 0 ? 'up' : 'down')

const styleClass = (style) => {
  const map = {
    '激进': 'aggressive',
    '成长': 'growth',
    '稳健': 'steady',
    '价值': 'value',
    '防御': 'defensive'
  }
  return map[style] || 'default'
}

const chartHeight = computed(() => (isDesktop.value ? 240 : 280))

function updateViewport() {
  isDesktop.value = window.innerWidth >= 1024
}

async function fetchDetail() {
  try {
    const res = await stockApi.detail(symbol.value)
    stock.value = res
    document.title = `${res.name} - 模拟股票交易`
  } catch {
    stock.value = null
  }
}

async function fetchHistory() {
  try {
    const res = await stockApi.history(symbol.value)
    const hist = res.history || []
    history.value = hist.slice(-80)
    if (hist.length) {
      const last = hist[hist.length - 1]
      quote.value = { price: last.close, changePercent: res.changePercent ?? 0 }
    } else {
      quote.value = { price: res.price ?? 0, changePercent: res.changePercent ?? 0 }
    }
    lastQuoteUpdate.value = new Date().toLocaleTimeString()
  } catch {
    if (!history.value.length) ElMessage.error('获取行情失败')
  }
}

async function fetchHolding() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await stockApi.holdings()
    const list = res || []
    holding.value = list.find(h => h.symbol === symbol.value) || null
  } catch {
    holding.value = null
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    fetchHistory()
    fetchHolding()
  }, 5000)
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function requireLogin() {
  authStore.openLogin()
}

const currentPrice = computed(() => Number(quote.value.price) || 0)
const shares = computed(() => Math.floor(Number(shareInput.value)) || 0)

const buyCost = computed(() => Math.round(currentPrice.value * shares.value * 100) / 100)
const buyFee = computed(() => Math.round(buyCost.value * 0.015 * 100) / 100)
const buyTotal = computed(() => Math.round((buyCost.value + buyFee.value) * 100) / 100)

const sellProceeds = computed(() => Math.round(currentPrice.value * shares.value * 100) / 100)
const sellFee = computed(() => Math.round(sellProceeds.value * 0.03 * 100) / 100)
const sellNet = computed(() => Math.round((sellProceeds.value - sellFee.value) * 100) / 100)

const maxBuyShares = computed(() => {
  if (!currentPrice.value) return 0
  return Math.floor(userStore.balance / (currentPrice.value * 1.015))
})

const maxSellShares = computed(() => holding.value?.shares || 0)

function quickShare(fraction) {
  if (activeTab.value === 'buy') {
    shareInput.value = Math.floor(maxBuyShares.value * fraction)
  } else {
    shareInput.value = Math.floor(maxSellShares.value * fraction)
  }
}

function sanitizeShares(val) {
  if (val === null || val === undefined) {
    shareInput.value = 0
    return
  }
  shareInput.value = Math.max(0, Math.floor(Number(val)))
}

function applyTradeResult(res) {
  if (res && res.balance !== undefined && userStore.userInfo) {
    userStore.userInfo.balance = res.balance
    localStorage.setItem('userInfo', JSON.stringify(userStore.userInfo))
  }
  fetchHolding()
  fetchHistory()
}

async function submitTrade() {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  if (!symbol.value || shares.value <= 0) {
    ElMessage.warning('请输入有效的股数')
    return
  }
  trading.value = true
  try {
    if (activeTab.value === 'buy') {
      if (buyTotal.value > userStore.balance) {
        ElMessage.warning('余额不足')
        return
      }
      const res = await stockApi.buy(symbol.value, shares.value)
      applyTradeResult(res)
      ElMessage.success(`买入成功，花费 ¥${formatMoney(res.total || buyTotal.value)}`)
    } else {
      if (shares.value > maxSellShares.value) {
        ElMessage.warning('持仓不足')
        return
      }
      const res = await stockApi.sell(symbol.value, shares.value)
      applyTradeResult(res)
      ElMessage.success(`卖出成功，净得 ¥${formatMoney(res.net || sellNet.value)}`)
    }
  } catch (e) {
    ElMessage.error(e?.error || e?.message || '交易失败')
  } finally {
    trading.value = false
  }
}

watch(() => userStore.isLoggedIn, (val) => {
  if (val) fetchHolding()
})

watch(symbol, () => {
  loading.value = true
  stock.value = null
  history.value = []
  holding.value = null
  fetchDetail().finally(() => { loading.value = false })
  fetchHistory()
  fetchHolding()
})

function goBack() {
  router.push('/stocks')
}

onMounted(() => {
  updateViewport()
  window.addEventListener('resize', updateViewport)
  loading.value = true
  fetchDetail().finally(() => { loading.value = false })
  fetchHistory()
  fetchHolding()
  startAutoRefresh()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateViewport)
  stopAutoRefresh()
})
</script>

<style scoped>
.stock-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px 0 40px;
}

.container {
  max-width: 900px;
  margin: 0 auto;
  padding: 0 16px;
}

.detail-header {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  margin-bottom: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stock-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stock-name {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
}

.stock-symbol {
  font-size: 13px;
  color: #999;
}

.style-badge {
  font-size: 13px;
  font-weight: 600;
  padding: 3px 12px;
  border-radius: 14px;
}

.style-badge.aggressive { color: #ff4d4f; background: rgba(255, 77, 79, 0.12); }
.style-badge.growth { color: #ff7d00; background: rgba(255, 125, 0, 0.12); }
.style-badge.steady { color: #409eff; background: rgba(64, 158, 255, 0.12); }
.style-badge.value { color: #9254de; background: rgba(146, 84, 222, 0.12); }
.style-badge.defensive { color: #666; background: rgba(102, 102, 102, 0.12); }
.style-badge.default { color: #666; background: #f5f5f5; }

.live-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #00b578;
  font-weight: 600;
  background: rgba(0, 181, 120, 0.1);
  padding: 6px 14px;
  border-radius: 20px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #00b578;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(0, 181, 120, 0.5); }
  70% { box-shadow: 0 0 0 6px rgba(0, 181, 120, 0); }
  100% { box-shadow: 0 0 0 0 rgba(0, 181, 120, 0); }
}

.quote-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.quote-left {
  display: flex;
  align-items: baseline;
  gap: 14px;
}

.quote-price {
  font-size: 36px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.quote-change {
  font-size: 16px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.up { color: #ff4d4f; }
.down { color: #00b578; }
.flat { color: #666; }

.quote-stats {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.q-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 70px;
}

.q-label {
  font-size: 12px;
  color: #999;
}

.q-value {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  font-variant-numeric: tabular-nums;
}

.chart-card,
.trade-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-sub {
  font-size: 12px;
  font-weight: 400;
  color: #999;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
}

.desc-block {
  border-top: 1px dashed #f0f0f0;
  padding-top: 10px;
}

.desc-text {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trade-tabs {
  display: flex;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 16px;
}

.trade-tab {
  flex: 1;
  text-align: center;
  padding: 9px 0;
  font-size: 15px;
  font-weight: 600;
  color: #666;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.trade-tab.active {
  background: #fff;
  color: #ff4400;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.trade-form {
  display: flex;
  flex-direction: column;
}

.form-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.form-label {
  font-size: 13px;
  color: #999;
}

.form-value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.form-label-block {
  font-size: 13px;
  color: #333;
  margin-bottom: 8px;
}

.share-input {
  width: 100%;
}

.quick-btns {
  display: flex;
  gap: 8px;
  margin: 10px 0 14px;
}

.quick-btn {
  flex: 1;
  padding: 6px 0;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.quick-btn:hover {
  border-color: #ff4400;
  color: #ff4400;
  background: #fff5f0;
}

.calc-box {
  background: #fafafa;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}

.calc-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #666;
  padding: 4px 0;
  font-variant-numeric: tabular-nums;
}

.calc-row.total {
  font-size: 15px;
  font-weight: 700;
  color: #1a1a1a;
  border-top: 1px dashed #e0e0e0;
  margin-top: 4px;
  padding-top: 8px;
}

.trade-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  color: #fff;
  border-radius: 8px;
}

.trade-btn.buy-btn {
  background: #ff7d00;
}

.trade-btn.buy-btn:hover {
  background: #ff8f26;
}

.trade-btn.sell-btn {
  background: #409eff;
}

.trade-btn.sell-btn:hover {
  background: #66b1ff;
}

.login-tip {
  text-align: center;
  padding: 40px 20px;
  color: #bbb;
}

.login-tip p {
  margin-top: 10px;
  font-size: 13px;
}

.login-tip .el-button {
  margin-top: 12px;
}

.not-found {
  text-align: center;
  padding: 80px 20px;
  color: #bbb;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.not-found p {
  margin: 12px 0;
  font-size: 14px;
}

@media (max-width: 768px) {
  .stock-detail-page {
    padding: 12px 0 30px;
  }

  .stock-name {
    font-size: 20px;
  }

  .quote-price {
    font-size: 30px;
  }

  .quote-stats {
    gap: 16px;
  }
}

@media (min-width: 1024px) {
  .stock-detail-page {
    padding: 16px 0 24px;
  }

  .detail-grid {
    display: grid;
    grid-template-columns: 1fr 340px;
    gap: 16px;
    align-items: start;
  }

  .detail-header,
  .quote-card,
  .info-card,
  .chart-card,
  .trade-card {
    margin-bottom: 12px;
  }

  .chart-card {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .chart-card .card-title {
    flex-shrink: 0;
  }

  .chart-card .kline-wrapper,
  .chart-card :deep(.kline-chart) {
    height: 260px !important;
  }

  .info-card {
    padding: 14px 18px;
  }

  .desc-text {
    font-size: 12px;
    line-height: 1.5;
  }
}
</style>
