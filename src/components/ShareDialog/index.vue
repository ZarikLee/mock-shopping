<template>
  <el-dialog :model-value="visible" width="420px" title="分享赚金币" @close="close">
    <div class="share-body">
      <p class="share-tip">分享给好友，好友点击你的链接赚金币，你也得奖励！</p>
      <div class="share-qr">
        <img :src="qrUrl" alt="分享二维码" />
      </div>
      <p class="share-url">{{ shareUrl }}</p>
      <div class="share-actions">
        <el-button type="primary" @click="copyLink">复制链接</el-button>
        <el-button v-if="canNativeShare" @click="nativeShare">分享给好友</el-button>
      </div>
      <p class="share-wechat">💬 微信用户：长按二维码或截图发送给好友</p>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['shared'])

const visible = ref(false)
const shareUrl = ref('')

const canNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

const qrUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl.value)}&size=200x200`)

const open = (url) => {
  shareUrl.value = url
  visible.value = true
}

const close = () => {
  visible.value = false
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
  } catch {}
  ElMessage.success('链接已复制')
  emit('shared')
}

const nativeShare = async () => {
  try {
    await navigator.share({ title: '淘大宝', text: '快来淘大宝玩吧！', url: shareUrl.value })
    emit('shared')
  } catch {}
}

defineExpose({ open })
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
</style>
