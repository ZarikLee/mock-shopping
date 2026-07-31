<template>
  <el-dialog v-model="showShare" width="420px" title="分享赚金币" @closed="onClosed">
    <div class="share-body">
      <p class="share-tip">把淘大宝分享给好友，好友也能来玩！</p>
      <div class="share-qr">
        <img :src="qrUrl" alt="分享二维码" />
      </div>
      <p class="share-url">{{ shareStore.shareUrl }}</p>
      <div class="share-actions">
        <el-button type="primary" @click="copyLink">
          <el-icon><Link /></el-icon>
          复制链接
        </el-button>
        <el-button type="success" @click="saveQr">
          <el-icon><Download /></el-icon>
          保存二维码
        </el-button>
      </div>
      <p class="share-wechat">💬 微信用户：保存二维码或截图，发送给微信好友即可</p>
      <p class="share-hint">关闭弹窗即视为完成分享，自动发放金币奖励</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Link, Download } from '@element-plus/icons-vue'
import { useShareStore } from '../../stores/share'

const emit = defineEmits(['shared'])
const shareStore = useShareStore()

const showShare = computed({
  get: () => shareStore.showShare,
  set: (v) => { shareStore.showShare = v }
})

const qrUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareStore.shareUrl)}&size=200x200`)

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareStore.shareUrl)
    ElMessage.success('链接已复制，快去分享吧')
  } catch {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}

const saveQr = async () => {
  try {
    const res = await fetch(qrUrl.value)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '淘大宝分享二维码.png'
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('二维码已保存')
  } catch {
    ElMessage.warning('保存失败，请长按二维码保存')
  }
}

const onClosed = () => {
  emit('shared')
}
</script>

<style scoped>
.share-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
}

.share-tip {
  color: #666;
  font-size: 13px;
  margin: 0;
  text-align: center;
}

.share-qr {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  background: #fff;
}

.share-qr img {
  display: block;
  width: 180px;
  height: 180px;
}

.share-url {
  color: #999;
  font-size: 12px;
  margin: 0;
  word-break: break-all;
  text-align: center;
  max-width: 100%;
}

.share-actions {
  display: flex;
  gap: 12px;
}

.share-wechat {
  color: #52c41a;
  font-size: 12px;
  margin: 0;
}

.share-hint {
  color: #999;
  font-size: 12px;
  margin: 0;
  background: #f8f8f8;
  padding: 6px 12px;
  border-radius: 6px;
}
</style>
