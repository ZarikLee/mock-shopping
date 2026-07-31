<template>
  <div class="kline-chart" ref="containerRef" :style="{ height: height + 'px' }">
    <svg
      v-if="visibleCandles.length"
      :viewBox="`0 0 ${width} ${height}`"
      preserveAspectRatio="none"
      class="kline-svg"
      @mousemove="onHover"
      @mouseleave="hoverIndex = -1"
    >
      <!-- Grid lines -->
      <g v-for="i in 5" :key="'g'+i">
        <line :x1="0" :x2="width" :y1="height/5*i" :y2="height/5*i" stroke="#f0f0f0" stroke-width="1" />
      </g>
      <!-- Price labels -->
      <g v-for="i in 5" :key="'p'+i">
        <text :x="width - 4" :y="height/5*i - 3" font-size="10" fill="#999" text-anchor="end">{{ priceLabel(gridPrice(i)) }}</text>
      </g>
      <!-- Candles -->
      <g v-for="(c, i) in visibleCandles" :key="i">
        <line :x1="candleX(i)" :x2="candleX(i)" :y1="priceToY(c.high)" :y2="priceToY(c.low)" :stroke="candleColor(c)" stroke-width="1.5" />
        <rect :x="candleX(i)-candleW/2" :y="Math.min(priceToY(c.open), priceToY(c.close))" :width="candleW" :height="Math.max(2, Math.abs(priceToY(c.open)-priceToY(c.close)))" :fill="candleColor(c)" rx="1" />
      </g>
      <!-- Hover crosshair -->
      <g v-if="hoverIndex >= 0 && hoverCandle">
        <line :x1="candleX(hoverIndex)" :x2="candleX(hoverIndex)" :y1="0" :y2="height" stroke="#ccc" stroke-width="1" stroke-dasharray="4,4" />
        <line :x1="0" :x2="width" :y1="priceToY(hoverCandle.close)" :y2="priceToY(hoverCandle.close)" stroke="#ccc" stroke-width="1" stroke-dasharray="4,4" />
        <text :x="Math.min(candleX(hoverIndex)+6, width - 6)" :y="12" font-size="11" fill="#333">开:{{ hoverCandle.open }} 高:{{ hoverCandle.high }} 低:{{ hoverCandle.low }} 收:{{ hoverCandle.close }}</text>
      </g>
      <!-- Empty state -->
    </svg>
    <div v-if="!visibleCandles.length" class="kline-empty">暂无行情数据</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  height: {
    type: Number,
    default: 300
  }
})

const containerRef = ref(null)
const width = ref(600)
const hoverIndex = ref(-1)

let resizeObserver = null

function measureWidth() {
  if (containerRef.value) {
    const w = containerRef.value.clientWidth
    if (w > 0) width.value = w
  }
}

onMounted(() => {
  measureWidth()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureWidth)
    if (containerRef.value) resizeObserver.observe(containerRef.value)
  } else {
    window.addEventListener('resize', measureWidth)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  } else {
    window.removeEventListener('resize', measureWidth)
  }
})

watch(() => props.data, () => {
  hoverIndex.value = -1
})

const candles = computed(() => {
  const list = props.data || []
  return list.map(c => ({
    open: Number(c.open),
    high: Number(c.high),
    low: Number(c.low),
    close: Number(c.close)
  }))
})

const visibleCandles = computed(() => candles.value.slice(-80))

const minMax = computed(() => {
  const list = visibleCandles.value
  if (!list.length) return { min: 0, max: 1 }
  let min = Infinity
  let max = -Infinity
  list.forEach(c => {
    if (c.low < min) min = c.low
    if (c.high > max) max = c.high
  })
  if (!isFinite(min) || !isFinite(max) || min === max) {
    min = min === Infinity ? 0 : min
    max = max === -Infinity ? 1 : max
    if (min === max) { min -= 1; max += 1 }
  }
  const pad = (max - min) * 0.08
  return { min: min - pad, max: max + pad }
})

const count = computed(() => visibleCandles.value.length || 1)

const candleW = computed(() => width.value / (count.value * 1.5))

const stepX = computed(() => {
  if (count.value <= 1) return width.value / 2
  return (width.value - 10) / (count.value - 1)
})

function candleX(i) {
  return 5 + i * stepX.value
}

function priceToY(price) {
  const { min, max } = minMax.value
  return heightPx() - ((Number(price) - min) / (max - min)) * heightPx()
}

const h = computed(() => props.height)

function heightPx() {
  return h.value
}

function candleColor(c) {
  return c.close >= c.open ? '#ff4d4f' : '#00b578'
}

function gridPrice(i) {
  const { min, max } = minMax.value
  return min + ((max - min) / 5) * i
}

function priceLabel(p) {
  return Number(p).toFixed(2)
}

function onHover(e) {
  if (!visibleCandles.value.length) return
  const rect = e.currentTarget.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * width.value
  const idx = Math.round((x - 5) / stepX.value)
  if (idx >= 0 && idx < visibleCandles.value.length) {
    hoverIndex.value = idx
  } else {
    hoverIndex.value = -1
  }
}

const hoverCandle = computed(() =>
  hoverIndex.value >= 0 ? visibleCandles.value[hoverIndex.value] : null
)
</script>

<style scoped>
.kline-chart {
  width: 100%;
  position: relative;
  overflow: hidden;
}

.kline-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.kline-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #bbb;
  font-size: 13px;
}
</style>
