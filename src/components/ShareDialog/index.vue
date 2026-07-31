<template>
  <el-dialog :model-value="visible" width="420px" title="分享赚金币" @close="close">
    <div class="share-body">
      <p class="share-tip">把淘大宝分享给好友，好友也能来玩！</p>
      <div class="share-qr">
        <img :src="qrUrl" alt="分享二维码" />
      </div>
      <p class="share-url">{{ shareUrl }}</p>
      <div class="share-actions">
        <el-button type="primary" @click="copyLink">复制链接</el-button>
        <el-button v-if="canNativeShare" @click="nativeShare">分享给好友</el-button>
      </div>
      <p class="share-wechat">💬 微信用户：长按二维码或截图，发送给微信好友</p>
      <el-button
        class="share-confirm-btn"
        type="success"
        size="large"
        :disabled="shared"
        @click="confirmShared"
      >
        {{ shared ? '已领取奖励' : '我已分享，领取金币' }}
      </el-button>
    </div>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['shared'])

const visible = ref(false)
const shareUrl = ref('')
const shared = ref(false)

const canNativeShare = computed(() => typeof navigator !== 'undefined' && !!navigator.share)

const qrUrl = computed(() => `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shareUrl.value)}&size=200x200`)

const open = (url) => {
  shareUrl.value = url
  shared.value = false
  visible.value = true
}

const close = () => {
  visible.value = false
}

const copyLink = async () => {
  try {
    await navigator.clipboard.writeText(shareUrl.value)
    ElMessage.success('链接已复制，快去分享吧')
  } catch {
    ElMessage.warning('复制失败，请手动复制链接')
  }
}

const nativeShare = async () => {
  try {
    await navigator.share({ title: '淘大宝', text: '快来淘大宝玩吧！', url: shareUrl.value })
  } catch {
    // 用户取消或分享失败，不发放奖励
  }
}

const confirmShared = () => {
  if (shared.value) return
  shared.value = true
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

.share-confirm-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  margin-top: 4px;
}
</style>
