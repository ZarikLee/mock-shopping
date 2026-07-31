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
          <div class="crop-handle corner tl"></div>
          <div class="crop-handle corner tr"></div>
          <div class="crop-handle corner bl"></div>
          <div class="crop-handle corner br"></div>
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
// 裁剪框大小（容器像素）
const boxSize = 180
const boxPos = ref({ x: 0, y: 0 })

const boxStyle = computed(() => ({
  width: boxSize + 'px',
  height: boxSize + 'px',
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
  // 初始方框居中
  boxPos.value = {
    x: Math.max(0, Math.round((imgW.value - boxSize) / 2)),
    y: Math.max(0, Math.round((imgH.value - boxSize) / 2))
  }
}

const preventDrag = (e) => e.preventDefault()

let dragging = false
let startMouse = { x: 0, y: 0 }
let startBox = { x: 0, y: 0 }

const startDrag = (e) => {
  dragging = true
  const point = e.touches ? e.touches[0] : e
  startMouse = { x: point.clientX, y: point.clientY }
  startBox = { ...boxPos.value }
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', endDrag)
  document.addEventListener('touchmove', onDrag, { passive: false })
  document.addEventListener('touchend', endDrag)
}

const onDrag = (e) => {
  if (!dragging) return
  e.preventDefault()
  const point = e.touches ? e.touches[0] : e
  const dx = point.clientX - startMouse.x
  const dy = point.clientY - startMouse.y
  let nx = startBox.x + dx
  let ny = startBox.y + dy
  // 限制在图片范围内
  nx = Math.max(0, Math.min(imgW.value - boxSize, nx))
  ny = Math.max(0, Math.min(imgH.value - boxSize, ny))
  boxPos.value = { x: nx, y: ny }
}

const endDrag = () => {
  dragging = false
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', endDrag)
  document.removeEventListener('touchmove', onDrag)
  document.removeEventListener('touchend', endDrag)
}

const confirm = () => {
  const img = imgRef.value
  if (!img) return
  const naturalW = img.naturalWidth
  const naturalH = img.naturalHeight
  const scale = naturalW / imgW.value
  const sx = boxPos.value.x * scale
  const sy = boxPos.value.y * scale
  const size = boxSize * scale

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
  width: 14px;
  height: 14px;
  background: #fff;
  border: 2px solid #ff4400;
  border-radius: 3px;
  pointer-events: none;
}

.crop-handle.tl { top: -8px; left: -8px; }
.crop-handle.tr { top: -8px; right: -8px; }
.crop-handle.bl { bottom: -8px; left: -8px; }
.crop-handle.br { bottom: -8px; right: -8px; }

.crop-tip {
  color: #999;
  font-size: 12px;
  margin: 0;
}
</style>
