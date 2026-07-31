<template>
  <div class="stocks-page">
    <div class="container">
      <BackButton />

      <div class="stocks-header">
        <div class="header-left">
          <el-icon :size="34" color="#ff4400"><TrendCharts /></el-icon>
          <div class="header-titles">
            <h1 class="page-title">模拟股票交易</h1>
            <span class="page-sub">实时行情 · 模拟买卖</span>
          </div>
        </div>
        <div class="header-right">
          <div class="auto-refresh">
            <span class="refresh-dot"></span>
            <span>自动刷新中</span>
          </div>
          <div class="balance-box">
            <span class="balance-label">当前余额</span>
            <span class="balance-value">¥{{ balanceText }}</span>
          </div>
        </div>
      </div>

      <div class="stats-bar" v-if="userStore.isLoggedIn">
        <div class="stats-main">
          <div class="stat-item main-item">
            <span class="stat-label">总盈亏</span>
            <span class="stat-value main-value" :class="pnlClass(stats?.totalPnL)">
              {{ signedMoney(stats?.totalPnL) }}
            </span>
            <span class="stat-sub" :class="pnlClass(stats?.pnlPercent)">收益率 {{ formatPercent(stats?.pnlPercent) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前持仓市值</span>
            <span class="stat-value">¥{{ formatMoney(stats?.currentValue) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已实现盈亏</span>
            <span class="stat-value" :class="pnlClass(stats?.realizedPnL)">{{ signedMoney(stats?.realizedPnL) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">未实现盈亏</span>
            <span class="stat-value" :class="pnlClass(stats?.unrealizedPnL)">{{ signedMoney(stats?.unrealizedPnL) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">累计交易次数</span>
            <span class="stat-value">{{ stats?.tradeCount ?? 0 }} 次</span>
          </div>
        </div>
      </div>

      <div class="stocks-body">
        <div class="market-panel">
          <div class="panel-title">
            <span class="title-text">股票行情</span>
            <span class="last-update" v-if="lastUpdate">最近更新 {{ lastUpdate }}</span>
          </div>

          <!-- 排序筛选 -->
          <div class="sort-toolbar">
            <span class="sort-label">排序</span>
            <span
              v-for="opt in sortOptions"
              :key="opt.value"
              class="sort-chip"
              :class="{ active: currentSort === opt.value }"
              @click="changeSort(opt.value)"
            >{{ opt.label }}</span>
          </div>

          <el-table
            v-if="!isMobile"
            :data="sortedStocks"
            class="stock-table"
            v-loading="loading"
            @row-click="openTrading"
          >
            <el-table-column prop="symbol" label="代码" width="80" />
            <el-table-column prop="name" label="名称" min-width="90" />
            <el-table-column label="现价" width="100" align="right">
              <template #default="{ row }">
                <span class="price-cell" :class="trendClass(row)">{{ formatPrice(row.price) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="涨跌幅" min-width="110" align="right">
              <template #default="{ row }">
                <span class="trend-badge" :class="trendClass(row)">{{ formatPercent(row.changePercent) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="昨收" width="80" align="right">
              <template #default="{ row }">
                <span class="prev-close-cell">{{ formatPrice(row.prevClose) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="150" align="center">
              <template #default="{ row }">
                <div class="row-actions">
                  <span class="row-btn trade" @click.stop="openTrading(row)">交易</span>
                  <span class="row-btn detail" @click.stop="goDetail(row)">详情</span>
                </div>
              </template>
            </el-table-column>
          </el-table>

          <!-- 移动端卡片列表 -->
          <div class="stock-cards" v-if="isMobile" v-loading="loading">
            <div v-for="s in sortedStocks" :key="s.symbol" class="stock-card" @click="openTrading(s)">
              <div class="sc-main">
                <div class="sc-name">
                  <span class="sc-stock-name">{{ s.name }}</span>
                  <span class="sc-symbol">{{ s.symbol }}</span>
                </div>
                <div class="sc-price" :class="trendClass(s)">{{ formatPrice(s.price) }}</div>
              </div>
              <div class="sc-sub">
                <span class="sc-change" :class="trendClass(s)">{{ formatPercent(s.changePercent) }}</span>
                <span class="sc-actions">
                  <span class="sc-btn trade" @click.stop="openTrading(s)">交易</span>
                  <span class="sc-btn detail" @click.stop="goDetail(s)">详情</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="holdings-panel">
          <div class="panel-title">
            <span class="title-text">我的持仓</span>
            <span class="holding-count" v-if="userStore.isLoggedIn">{{ holdings.length }} 只</span>
          </div>
          <template v-if="userStore.isLoggedIn">
            <div v-if="holdings.length" class="holdings-list" v-loading="holdingsLoading">
              <div
                v-for="h in holdings"
                :key="h.symbol"
                class="holding-card"
                @click="openTradingBySymbol(h.symbol)"
              >
                <div class="holding-top">
                  <div class="holding-name">
                    <span class="h-name">{{ h.name }}</span>
                    <span class="h-symbol">{{ h.symbol }}</span>
                  </div>
                  <span class="h-value">¥{{ formatMoney(h.currentValue) }}</span>
                </div>
                <div class="holding-mid">
                  <div class="h-item">
                    <span class="h-label">持仓</span>
                    <span class="h-num">{{ h.shares }}</span>
                  </div>
                  <div class="h-item">
                    <span class="h-label">成本价</span>
                    <span class="h-num">{{ formatPrice(h.avgCost) }}</span>
                  </div>
                  <div class="h-item">
                    <span class="h-label">现价</span>
                    <span class="h-num">{{ formatPrice(h.currentPrice) }}</span>
                  </div>
                </div>
                <div class="holding-bottom">
                  <span class="pl-label">浮动盈亏</span>
                  <span class="pl-value" :class="profitClass(h.profit)">
                    {{ h.profit >= 0 ? '+' : '' }}{{ formatMoney(h.profit) }}
                    ({{ h.profitPercent >= 0 ? '+' : '' }}{{ h.profitPercent }}%)
                  </span>
                </div>
              </div>
            </div>
            <div v-else-if="!holdingsLoading" class="empty-state">
              <el-icon :size="40"><Wallet /></el-icon>
              <p>暂无持仓，点击股票开始交易</p>
            </div>
          </template>
          <div v-else class="empty-state">
            <el-icon :size="40"><Lock /></el-icon>
            <p>登录后查看持仓</p>
            <el-button type="primary" size="small" @click="requireLogin">去登录</el-button>
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      v-model="tradingVisible"
      :title="tradingTitle"
      width="460px"
      :close-on-click-modal="false"
      destroy-on-close
      class="trading-dialog"
    >
      <template v-if="selectedStock">
        <div class="trading-stock-info">
          <div>
            <span class="ts-name">{{ selectedStock.name }}</span>
            <span class="ts-symbol">{{ selectedStock.symbol }}</span>
          </div>
          <div class="ts-price-row">
            <span class="ts-price" :class="trendClass(selectedStock)">¥{{ formatPrice(selectedStock.price) }}</span>
            <span class="ts-change" :class="trendClass(selectedStock)">{{ formatPercent(selectedStock.changePercent) }}</span>
          </div>
        </div>

        <div class="trade-tabs">
          <div class="trade-tab" :class="{ active: activeTab === 'buy' }" @click="activeTab = 'buy'">
            买入
          </div>
          <div class="trade-tab" :class="{ active: activeTab === 'sell' }" @click="activeTab = 'sell'">
            卖出
          </div>
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
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { TrendCharts, Wallet, Lock } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import { stockApi } from '../../api/stocks'
import { useUserStore } from '../../stores/user'
import { useAuthStore } from '../../stores/auth'
import { useDevice } from '../../utils/device'

const { isMobile } = useDevice()
const router = useRouter()
const userStore = useUserStore()
const authStore = useAuthStore()

const stocks = ref([])
const loading = ref(false)
const holdings = ref([])
const holdingsLoading = ref(false)
const lastUpdate = ref('')
const stats = ref(null)
let refreshTimer = null

// 行情排序筛选
const currentSort = ref('default')
const sortOptions = [
  { label: '默认', value: 'default' },
  { label: '价格最高', value: 'priceDesc' },
  { label: '价格最低', value: 'priceAsc' },
  { label: '涨幅最高', value: 'gainDesc' },
  { label: '跌幅最大', value: 'gainAsc' },
]
const sortedStocks = computed(() => {
  const list = [...stocks.value]
  switch (currentSort.value) {
    case 'priceDesc': list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0)); break
    case 'priceAsc': list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0)); break
    case 'gainDesc': list.sort((a, b) => (Number(b.changePercent) || 0) - (Number(a.changePercent) || 0)); break
    case 'gainAsc': list.sort((a, b) => (Number(a.changePercent) || 0) - (Number(b.changePercent) || 0)); break
  }
  return list
})
const changeSort = (val) => { currentSort.value = val }

const balanceText = computed(() => Number(userStore.balance).toFixed(2))

const formatPrice = (p) => Number(p || 0).toFixed(2)
const formatMoney = (v) => Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const formatPercent = (p) => (Number(p) >= 0 ? '+' : '') + Number(p || 0).toFixed(2) + '%'
const formatChangeAmount = (row) => {
  const diff = Number(row.price) - Number(row.prevClose)
  return (diff >= 0 ? '+' : '') + diff.toFixed(2)
}

const trendClass = (row) => {
  const p = Number(row.changePercent)
  if (p > 0) return 'up'
  if (p < 0) return 'down'
  return 'flat'
}

const profitClass = (v) => (Number(v) >= 0 ? 'up' : 'down')

const pnlClass = (v) => (Number(v) > 0 ? 'up' : Number(v) < 0 ? 'down' : 'flat')
const signedMoney = (v) => (Number(v) > 0 ? '+' : '') + formatMoney(v)

async function refreshStocks(silent = false) {
  if (!silent) loading.value = true
  try {
    const res = await stockApi.list()
    const list = res.stocks || res || []
    // 原地更新已有数据，避免整表重渲染
    const map = {}
    stocks.value.forEach(s => { map[s.symbol] = s })
    list.forEach(item => {
      const existing = map[item.symbol]
      if (existing) {
        Object.assign(existing, item)
      } else {
        stocks.value.push(item)
      }
    })
    lastUpdate.value = new Date().toLocaleTimeString()
  } catch {
    if (!silent) ElMessage.error('获取行情失败')
  } finally {
    loading.value = false
  }
}

async function refreshHoldings() {
  if (!userStore.isLoggedIn) return
  holdingsLoading.value = true
  try {
    const res = await stockApi.holdings()
    holdings.value = res || []
  } catch {
    holdings.value = []
  } finally {
    holdingsLoading.value = false
  }
}

async function refreshStats() {
  if (!userStore.isLoggedIn) return
  try {
    const res = await stockApi.stats()
    stats.value = res || null
  } catch {
    stats.value = null
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    refreshStocks(true)
    refreshStats()
    refreshHoldings()
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

const tradingVisible = ref(false)
const selectedStock = ref(null)
const activeTab = ref('buy')
const shareInput = ref(100)
const trading = ref(false)

function openTrading(row) {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  selectedStock.value = row
  shareInput.value = 100
  activeTab.value = 'buy'
  tradingVisible.value = true
}

function openTradingBySymbol(symbol) {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  const stock = stocks.value.find(s => s.symbol === symbol)
  if (stock) openTrading(stock)
}

function goDetail(row) {
  router.push(`/stocks/${row.symbol}`)
}

function goDetailBySymbol(symbol) {
  router.push(`/stocks/${symbol}`)
}

const tradingTitle = computed(() =>
  selectedStock.value ? `${selectedStock.value.name}（${selectedStock.value.symbol}）` : '交易'
)

const currentPrice = computed(() => Number(selectedStock.value?.price) || 0)
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

const currentHolding = computed(() =>
  holdings.value.find(h => h.symbol === selectedStock.value?.symbol)
)
const maxSellShares = computed(() => currentHolding.value?.shares || 0)

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
  tradingVisible.value = false
  refreshHoldings()
  refreshStocks(true)
  refreshStats()
}

async function submitTrade() {
  if (!userStore.isLoggedIn) {
    requireLogin()
    return
  }
  const symbol = selectedStock.value?.symbol
  if (!symbol || shares.value <= 0) {
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
      const res = await stockApi.buy(symbol, shares.value)
      applyTradeResult(res)
      if (res.experienceGained) ElMessage.success(`买入成功，花费 ¥${formatMoney(res.total || buyTotal.value)}，经验+${res.experienceGained}`)
      else ElMessage.success(`买入成功，花费 ¥${formatMoney(res.total || buyTotal.value)}`)
    } else {
      if (shares.value > maxSellShares.value) {
        ElMessage.warning('持仓不足')
        return
      }
      const res = await stockApi.sell(symbol, shares.value)
      applyTradeResult(res)
      if (res.experienceGained) ElMessage.success(`卖出成功，净得 ¥${formatMoney(res.net || sellNet.value)}，经验+${res.experienceGained}`)
      else ElMessage.success(`卖出成功，净得 ¥${formatMoney(res.net || sellNet.value)}`)
    }
  } catch (e) {
    ElMessage.error(e?.error || e?.message || '交易失败')
  } finally {
    trading.value = false
  }
}

watch(() => userStore.isLoggedIn, (val) => {
  if (val) {
    refreshHoldings()
    refreshStats()
  }
})

onMounted(() => {
  document.title = '模拟股票交易 - 淘大宝'
  refreshStocks()
  refreshHoldings()
  refreshStats()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.stocks-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px 0 40px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}

.stocks-header {
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
  gap: 12px;
}

.header-titles {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.page-title {
  font-size: 24px;
  font-weight: 800;
  color: #1a1a1a;
}

.page-sub {
  font-size: 12px;
  color: #999;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.auto-refresh {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #666;
  background: #f5f5f5;
  padding: 6px 14px;
  border-radius: 20px;
}

.refresh-dot {
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

.balance-box {
  text-align: right;
}

.balance-label {
  display: block;
  font-size: 12px;
  color: #999;
}

.balance-value {
  font-size: 22px;
  font-weight: 700;
  color: #ff4d4f;
  font-variant-numeric: tabular-nums;
}

.stats-bar {
  background: #fff;
  border-radius: 12px;
  padding: 18px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-main {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 110px;
}

.main-item {
  padding-right: 24px;
  border-right: 1px solid #f0f0f0;
}

.stat-label {
  font-size: 12px;
  color: #999;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1a1a1a;
  font-variant-numeric: tabular-nums;
}

.main-value {
  font-size: 28px;
  font-weight: 800;
}

.stat-sub {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.stocks-body {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.row-btn {
  padding: 3px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.row-btn.trade {
  background: #ff4400;
  color: #fff;
}

.row-btn.trade:hover {
  background: #ff6600;
}

.row-btn.detail {
  background: #f0f0f0;
  color: #333;
}

.row-btn.detail:hover {
  background: #e0e0e0;
}

@media (max-width: 900px) {
  .stocks-body {
    flex-direction: column;
  }
}

.market-panel,
.holdings-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.market-panel {
  flex: 1.6;
  min-width: 0;
}

.holdings-panel {
  flex: 1;
  min-width: 0;
}

.panel-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.title-text {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
}

.last-update {
  font-size: 12px;
  color: #999;
}

.sort-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
}

.sort-label {
  font-size: 12px;
  color: #999;
  flex-shrink: 0;
}

.sort-chip {
  padding: 4px 12px;
  font-size: 12px;
  color: #666;
  background: #f5f5f5;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.sort-chip:hover {
  color: #ff4400;
}

.sort-chip.active {
  background: #ff4400;
  color: #fff;
}

.holding-count {
  font-size: 12px;
  color: #ff4400;
  background: #fff5f0;
  padding: 2px 10px;
  border-radius: 12px;
}

.stock-table {
  width: 100%;
}

:deep(.stock-table .el-table__row) {
  cursor: pointer;
}

.stock-cards {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stock-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.stock-card:hover {
  border-color: #ff4400;
  box-shadow: 0 2px 8px rgba(255, 68, 0, 0.1);
}

.sc-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.sc-name {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.sc-stock-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.sc-symbol {
  font-size: 11px;
  color: #999;
  flex-shrink: 0;
}

.sc-price {
  font-size: 17px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.sc-price.up {
  color: #ff4d4f;
}

.sc-price.down {
  color: #00b578;
}

.sc-price.flat {
  color: #333;
}

.sc-sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.sc-change {
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.sc-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sc-btn {
  padding: 4px 14px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.sc-btn.trade {
  background: #ff4400;
  color: #fff;
}

.sc-btn.trade:hover {
  background: #ff6600;
}

.sc-btn.detail {
  background: #f0f0f0;
  color: #333;
}

.sc-btn.detail:hover {
  background: #e0e0e0;
}

.view-hint {
  font-size: 12px;
  color: #ff4400;
  background: #fff5f0;
  padding: 2px 10px;
  border-radius: 12px;
}

:deep(.stock-table .el-table__row:hover) .view-hint {
  background: #ff4400;
  color: #fff;
}

.up { color: #ff4d4f; }
.down { color: #00b578; }
.flat { color: #666; }

.price-cell {
  display: inline-block;
  padding: 3px 8px;
  border-radius: 4px;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  transition: color 0.3s;
}

.price-cell.up { color: #ff4d4f; }
.price-cell.down { color: #00b578; }
.price-cell.flat { color: #333; }

.prev-close-cell {
  font-variant-numeric: tabular-nums;
  color: #999;
}

.trend-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.trend-badge.up { color: #ff4d4f; background: rgba(255, 77, 79, 0.1); }
.trend-badge.down { color: #00b578; background: rgba(0, 181, 120, 0.1); }
.trend-badge.flat { color: #666; background: #f5f5f5; }

.change-amount {
  font-variant-numeric: tabular-nums;
  font-weight: 500;
}


.holdings-list {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.holding-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.holding-card:hover {
  border-color: #ff4400;
  box-shadow: 0 2px 8px rgba(255, 68, 0, 0.1);
}

.holding-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.holding-name {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.h-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.h-symbol {
  font-size: 11px;
  color: #999;
}

.h-value {
  font-size: 16px;
  font-weight: 700;
  color: #1a1a1a;
  font-variant-numeric: tabular-nums;
}

.holding-mid {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-top: 1px dashed #f0f0f0;
  border-bottom: 1px dashed #f0f0f0;
}

.h-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.h-label {
  font-size: 11px;
  color: #999;
}

.h-num {
  font-size: 13px;
  font-weight: 600;
  color: #333;
  font-variant-numeric: tabular-nums;
}

.holding-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
}

.pl-label {
  font-size: 12px;
  color: #999;
}

.pl-value {
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  color: #bbb;
}

.empty-state p {
  margin-top: 10px;
  font-size: 13px;
}

.empty-state .el-button {
  margin-top: 12px;
}

.trading-stock-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 14px;
}

.ts-name {
  font-size: 18px;
  font-weight: 700;
  color: #1a1a1a;
  margin-right: 8px;
}

.ts-symbol {
  font-size: 13px;
  color: #999;
}

.ts-price-row {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.ts-price {
  font-size: 20px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ts-change {
  font-size: 13px;
  font-weight: 600;
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

@media (max-width: 992px) {
  .stocks-body {
    flex-direction: column;
  }

  .market-panel,
  .holdings-panel {
    width: 100%;
  }
}

@media (max-width: 768px) {
  .stocks-page {
    padding: 12px 0 30px;
  }

  .stocks-header {
    padding: 16px;
  }

  .page-title {
    font-size: 20px;
  }

  .header-right {
    width: 100%;
    justify-content: space-between;
  }

  .balance-value {
    font-size: 18px;
  }

  .stats-bar {
    padding: 14px 16px;
  }

  .stats-main {
    gap: 20px;
  }

  .main-item {
    padding-right: 16px;
  }

  .main-value {
    font-size: 24px;
  }
}
</style>
