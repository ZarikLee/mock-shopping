<template>
  <el-dialog :model-value="visible" width="440px" title="裁剪头像" :close-on-click-modal="false" @close="close">
    <div class="crop-container">
      <div class="crop-viewport" ref="viewportRef">
        <img
          ref="imgRef"
          :src="imageSrc"
          alt=""
          class="crop-image"
          @load="onImgLoad"
          @mousedown="preventDrag"
          @dragstart.prevent
        />
        <div
          class="crop-box"
          :style="boxStyle"
          @mousedown.prevent="startDrag($event)"
          @touchstart.prevent="startDrag($event)"
        >
          <div class="crop-grid"></div>
          <div class="crop-handle corner tl" @mousedown.stop.prevent="startResize($event, 'tl')" @touchstart.stop.prevent="startResize($event, 'tl')"></div>
          <div class="crop-handle corner tr" @mousedown.stop.prevent="startResize($event, 'tr')" @touchstart.stop.prevent="startResize($event, 'tr')"></div>
          <div class="crop-handle corner bl" @mousedown.stop.prevent="startResize($event, 'bl')" @touchstart.stop.prevent="startResize($event, 'bl')"></div>
          <div class="crop-handle corner br" @mousedown.stop.prevent="startResize($event, 'br')" @touchstart.stop.prevent="startResize($event, 'br')"></div>
          <div class="crop-size-label">{{ Math.round(boxSize / scale) }}px</div>
        </div>
      </div>
      <p class="crop-tip">拖动方框选择头像区域</p>
    </div>
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" :loading="uploading" @click="confirm">确认上传</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['update:visible', 'cropped'])

const visible = ref(false)
const imageSrc = ref('')
const uploading = ref(false)

const viewportRef = ref(null)
const imgRef = ref(null)

// 显示的图片尺寸（按容器适配后）
const imgW = ref(0)
const imgH = ref(0)
// 裁剪框大小（容器像素，可缩放）
const boxSize = ref(180)
const boxPos = ref({ x: 0, y: 0 })

const scale = computed(() => {
  const img = imgRef.value
  if (!img || !imgW.value) return 1
  return img.naturalWidth / imgW.value
})

const boxStyle = computed(() => ({
  width: boxSize.value + 'px',
  height: boxSize.value + 'px',
  transform: `translate(${boxPos.value.x}px, ${boxPos.value.y}px)`
}))

const open = (src) => {
  imageSrc.value = src
  visible.value = true
}

const close = () => {
  visible.value = false
  emit('update:visible', false)
}

const onImgLoad = () => {
  const img = imgRef.value
  if (!img) return
  imgW.value = img.offsetWidth || img.clientWidth
  imgH.value = img.offsetHeight || img.clientHeight
  // 初始方框居中，占显示宽度一半
  boxSize.value = Math.round(Math.min(imgW.value, imgH.value) * 0.6)
  boxPos.value = {
    x: Math.max(0, Math.round((imgW.value - boxSize.value) / 2)),
    y: Math.max(0, Math.round((imgH.value - boxSize.value) / 2))
  }
}

const preventDrag = (e) => e.preventDefault()

let dragging = false
let startMouse = { x: 0, y: 0 }
let startBox = { x: 0, y: 0 }
let startSize = 0
let resizeCorner = null

const MIN_SIZE = 60
const MAX_SIZE = () => Math.min(imgW.value, imgH.value)

const startDrag = (e) => {
  dragging = true
  resizeCorner = null
  const point = e.touches ? e.touches[0] : e
  startMouse = { x: point.clientX, y: point.clientY }
  startBox = { ...boxPos.value }
  bindMoveEvents()
}

const startResize = (e, corner) => {
  dragging = true
  resizeCorner = corner
  const point = e.touches ? e.touches[0] : e
  startMouse = { x: point.clientX, y: point.clientY }
  startBox = { ...boxPos.value }
  startSize = boxSize.value
  bindMoveEvents()
}

const bindMoveEvents = () => {
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onMove, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onMove = (e) => {
  if (!dragging) return
  e.preventDefault()
  const point = e.touches ? e.touches[0] : e
  const dx = point.clientX - startMouse.x
  const dy = point.clientY - startMouse.y

  if (resizeCorner) {
    // 缩放裁剪框（保持正方形）
    let delta = Math.max(Math.abs(dx), Math.abs(dy))
    // 根据角落方向调整正负
    if (resizeCorner === 'tr' || resizeCorner === 'br') {
      delta = dx >= 0 ? delta : -delta
    } else {
      delta = dx <= 0 ? delta : -delta
    }
    let newSize = startSize + delta
    newSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE(), newSize))
    boxSize.value = newSize

    // 调整位置，保持对角的锚点不动
    let nx = startBox.x
    let ny = startBox.y
    if (resizeCorner === 'tr' || resizeCorner === 'br') {
      // 右边固定，左边移动
      nx = startBox.x + (startSize - newSize)
    }
    if (resizeCorner === 'bl' || resizeCorner === 'br') {
      // 下边固定，上边移动
      ny = startBox.y + (startSize - newSize)
    }
    nx = Math.max(0, Math.min(imgW.value - newSize, nx))
    ny = Math.max(0, Math.min(imgH.value - newSize, ny))
    boxPos.value = { x: nx, y: ny }
  } else {
    // 拖动移动
    let nx = startBox.x + dx
    let ny = startBox.y + dy
    nx = Math.max(0, Math.min(imgW.value - boxSize.value, nx))
    ny = Math.max(0, Math.min(imgH.value - boxSize.value, ny))
    boxPos.value = { x: nx, y: ny }
  }
}

const endDrag = () => {
  dragging = false
  resizeCorner = null
  document.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onMove)
  document.removeEventListener('touchend', endDrag)
}

const confirm = () => {
  const img = imgRef.value
  if (!img) return
  const sx = boxPos.value.x * scale.value
  const sy = boxPos.value.y * scale.value
  const size = boxSize.value * scale.value

  const canvas = document.createElement('canvas')
  const out = 150
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, sx, sy, size, size, 0, 0, out, out)
  const dataUrl = canvas.toDataURL('image/jpeg', 0.85)

  uploading.value = true
  emit('cropped', dataUrl)
  setTimeout(() => {
    uploading.value = false
    close()
  }, 50)
}

defineExpose({ open })
</script>

<style scoped>
.crop-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.crop-viewport {
  position: relative;
  max-width: 100%;
  overflow: hidden;
  background: #000;
  border-radius: 8px;
  touch-action: none;
}

.crop-image {
  display: block;
  max-width: 360px;
  max-height: 360px;
  user-select: none;
  -webkit-user-drag: none;
}

.crop-box {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid #ff4400;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
  cursor: move;
  touch-action: none;
}

.crop-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px);
  background-size: 33.33% 33.33%;
  pointer-events: none;
}

.crop-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border: 2px solid #ff4400;
  border-radius: 3px;
  cursor: nwse-resize;
}

.crop-handle.tl { top: -8px; left: -8px; cursor: nwse-resize; }
.crop-handle.tr { top: -8px; right: -8px; cursor: nesw-resize; }
.crop-handle.bl { bottom: -8px; left: -8px; cursor: nesw-resize; }
.crop-handle.br { bottom: -8px; right: -8px; cursor: nwse-resize; }

.crop-size-label {
  position: absolute;
  bottom: -24px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.7);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}

.crop-tip {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>
