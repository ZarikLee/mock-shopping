<template>
  <div class="message-center-page">
    <div class="container">
      <div class="mc-back"><BackButton /></div>

      <div class="mc-layout">
        <aside class="mc-list-panel" :class="{ 'is-hidden': isMobile && activeConvId !== null }">
          <div class="mc-list-header">
            <span class="mc-title">消息中心</span>
          </div>

          <div class="feedback-entry" @click="openFeedbackDialog">
            <div class="feedback-icon"><el-icon :size="20"><Service /></el-icon></div>
            <div class="feedback-info">
              <span class="feedback-name">系统反馈</span>
              <span class="feedback-desc">意见与建议、问题反馈</span>
            </div>
            <el-icon class="mc-arrow"><ArrowRight /></el-icon>
          </div>

          <div class="report-review-entry" v-if="isAdmin" @click="openReportReview">
            <el-icon><Warning /></el-icon>
            <span>举报审核</span>
            <span v-if="pendingReports > 0" class="report-badge">{{ pendingReports }}</span>
          </div>

          <div class="conv-list" v-loading="conversationsLoading">
            <div
              v-for="conv in conversations"
              :key="conv.otherId"
              class="conv-item"
              :class="{ active: activeConvId === conv.otherId }"
              @click="openConversation(conv)"
            >
              <img :src="conv.otherAvatar || defaultAvatar" alt="avatar" class="conv-avatar" />
              <div class="conv-main">
                <div class="conv-top">
                  <span class="conv-name">{{ conv.otherName }}</span>
                  <span class="conv-time">{{ formatTime(conv.lastTime) }}</span>
                </div>
                <div class="conv-bottom">
                  <span class="conv-preview">{{ conv.lastContent }}</span>
                  <span v-if="conv.unread > 0" class="conv-badge">{{ conv.unread > 99 ? '99+' : conv.unread }}</span>
                </div>
              </div>
            </div>
            <div v-if="!conversationsLoading && !conversations.length" class="conv-empty">
              <el-icon :size="44"><ChatDotRound /></el-icon>
              <p>暂无会话，去排行榜找好友聊天吧</p>
            </div>
          </div>
        </aside>

        <section class="mc-chat-panel" :class="{ 'is-hidden': isMobile && activeConvId === null }">
          <template v-if="activeConvId !== null">
            <div class="chat-header">
              <div v-if="isMobile" class="chat-back-btn" @click="closeMobileChat">
                <el-icon><ArrowLeft /></el-icon>
              </div>
              <img :src="activeUser.avatar || defaultAvatar" alt="avatar" class="chat-avatar" />
              <span class="chat-name">{{ activeUser.name }}</span>
              <div class="chat-actions" v-if="activeUser.id && !isAdmin">
                <el-button v-if="!isBlocked" size="small" @click="confirmBlock">屏蔽</el-button>
                <el-button v-else size="small" type="danger" plain @click="confirmUnblock">已屏蔽·解除</el-button>
                <el-button size="small" @click="openReportDialog">举报</el-button>
              </div>
            </div>
            <div ref="chatBodyRef" class="chat-body">
              <div
                v-for="m in messages"
                :key="m.id"
                class="msg-row"
                :class="m.senderId === myId ? 'mine' : 'theirs'"
              >
                <img
                  :src="m.senderId === myId ? (myAvatar || defaultAvatar) : (activeUser.avatar || defaultAvatar)"
                  alt="avatar"
                  class="msg-avatar"
                />
                <div class="msg-bubble">{{ m.content }}</div>
              </div>
            </div>
            <div class="chat-input-row">
              <el-input
                v-model="draft"
                class="chat-input"
                placeholder="输入消息，Enter 发送"
                maxlength="500"
                @keyup.enter="sendMessage"
              />
              <el-button class="send-btn" type="primary" :disabled="!draft.trim()" @click="sendMessage">发送</el-button>
            </div>
          </template>
          <div v-else class="chat-empty">
            <el-icon :size="56"><ChatDotRound /></el-icon>
            <p>选择一个会话开始聊天</p>
          </div>
        </section>
      </div>
    </div>

    <el-dialog v-model="feedbackDialogVisible" title="系统反馈" width="480px" :close-on-click-modal="false">
      <div class="feedback-form">
        <el-radio-group v-model="feedbackType" class="feedback-types">
          <el-radio-button value="问题反馈">问题反馈</el-radio-button>
          <el-radio-button value="建议">建议</el-radio-button>
          <el-radio-button value="其他">其他</el-radio-button>
        </el-radio-group>
        <el-input
          v-model="feedbackContent"
          type="textarea"
          :rows="5"
          maxlength="500"
          show-word-limit
          placeholder="请描述您遇到的问题或建议..."
        />
      </div>
      <template #footer>
        <el-button @click="feedbackDialogVisible = false">取消</el-button>
        <el-button class="send-btn" type="primary" :loading="feedbackSubmitting" @click="submitFeedback">提交反馈</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reportDialogVisible" title="举报用户" width="440px">
      <p class="report-tip">举报：{{ activeUser.name }}</p>
      <el-radio-group v-model="reportReason">
        <el-radio-button value="言语攻击">言语攻击</el-radio-button>
        <el-radio-button value="骚扰行为">骚扰行为</el-radio-button>
        <el-radio-button value="广告营销">广告营销</el-radio-button>
        <el-radio-button value="其他">其他</el-radio-button>
      </el-radio-group>
      <div class="report-evidence">
        <p>将提交最近聊天记录作为证据</p>
      </div>
      <template #footer>
        <el-button @click="reportDialogVisible = false">取消</el-button>
        <el-button type="danger" @click="submitReport">提交举报</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="reviewDialogVisible" title="举报审核" width="640px" :close-on-click-modal="false">
      <div class="review-list" v-loading="reportsLoading">
        <div v-for="report in reports" :key="report.id" class="report-card">
          <div class="report-header">
            <span class="report-reporter">举报人：{{ report.reporterName }}</span>
            <span class="report-reported">被举报：{{ report.reportedName }}</span>
            <span class="report-status" :class="report.status">{{ statusText(report.status) }}</span>
          </div>
          <div class="report-reason">原因：{{ report.reason }}</div>
          <div class="report-messages" v-if="report.messages && report.messages.length">
            <div v-for="m in report.messages" :key="m.id" class="report-msg">
              <span class="rm-sender">{{ m.senderId === report.reporterId ? report.reporterName : report.reportedName }}:</span>
              <span class="rm-content">{{ m.content }}</span>
            </div>
          </div>
          <div class="report-actions" v-if="report.status === 'pending'">
            <el-button type="danger" size="small" @click="approveReport(report)">确认违规</el-button>
            <el-button size="small" @click="dismissReport(report)">驳回</el-button>
          </div>
        </div>
        <div v-if="!reportsLoading && !reports.length" class="conv-empty">
          <el-icon :size="44"><Warning /></el-icon>
          <p>暂无举报</p>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowRight, ArrowLeft, ChatDotRound, Service, User, Warning } from '@element-plus/icons-vue'
import BackButton from '../../components/BackButton/index.vue'
import { useUserStore } from '../../stores/user'
import { messageApi } from '../../api/messages'
import { userApi } from '../../api/users'
import { leaderboardApi } from '../../api/leaderboard'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const defaultAvatar = 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'

const myId = computed(() => Number(userStore.userInfo?.id))
const myAvatar = computed(() => userStore.userInfo?.avatar || defaultAvatar)
const isAdmin = computed(() => Number(myId.value) === 1)

const isMobile = ref(false)
const resizeHandler = () => {
  isMobile.value = window.innerWidth <= 768
}

const conversations = ref([])
const conversationsLoading = ref(false)
const activeConvId = ref(null)
const activeUser = ref({ id: null, name: '', avatar: '' })
const messages = ref([])
const draft = ref('')
const chatBodyRef = ref(null)

const blockedList = ref([])
const isBlocked = computed(() => blockedList.value.some(b => Number(b.userId ?? b.id) === Number(activeUser.value.id)))

const reportDialogVisible = ref(false)
const reportReason = ref('言语攻击')

const reports = ref([])
const reportsLoading = ref(false)
const reviewDialogVisible = ref(false)
const pendingReports = computed(() => reports.value.filter(r => r.status === 'pending').length)

const feedbackDialogVisible = ref(false)
const feedbackType = ref('问题反馈')
const feedbackContent = ref('')
const feedbackSubmitting = ref(false)

const loadBlockedList = async () => {
  try {
    const res = await messageApi.blockedList()
    blockedList.value = Array.isArray(res) ? res : (res.list || [])
  } catch {
    blockedList.value = []
  }
}

const confirmBlock = async () => {
  try {
    await ElMessageBox.confirm(`确定屏蔽 ${activeUser.value.name} 吗？屏蔽后对方将无法给你发送消息。`, '屏蔽用户', {
      confirmButtonText: '确定屏蔽',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await messageApi.block(activeUser.value.id)
    await loadBlockedList()
    ElMessage.success('已屏蔽该用户')
  } catch (e) {
    ElMessage.error(e?.message || '屏蔽失败')
  }
}

const confirmUnblock = async () => {
  try {
    await ElMessageBox.confirm(`确定解除对 ${activeUser.value.name} 的屏蔽吗？`, '解除屏蔽', {
      confirmButtonText: '解除屏蔽',
      cancelButtonText: '取消',
      type: 'info'
    })
  } catch {
    return
  }
  try {
    await messageApi.unblock(activeUser.value.id)
    await loadBlockedList()
    ElMessage.success('已解除屏蔽')
  } catch (e) {
    ElMessage.error(e?.message || '解除屏蔽失败')
  }
}

const openReportDialog = () => {
  if (activeUser.value.id) {
    reportReason.value = '言语攻击'
    reportDialogVisible.value = true
  }
}

const submitReport = async () => {
  const msgIds = messages.value.slice(-20).map(m => m.id)
  try {
    await messageApi.report({ reportedId: activeUser.value.id, reason: reportReason.value, messageIds: msgIds })
    ElMessage.success('举报已提交，管理员将尽快处理')
    reportDialogVisible.value = false
  } catch (e) {
    ElMessage.error(e?.message || '举报失败')
  }
}

const loadReports = async () => {
  reportsLoading.value = true
  try {
    const res = await messageApi.reports()
    reports.value = Array.isArray(res) ? res : (res.reports || [])
  } catch {
    reports.value = []
  } finally {
    reportsLoading.value = false
  }
}

const openReportReview = async () => {
  reviewDialogVisible.value = true
  await loadReports()
}

const approveReport = async (report) => {
  try {
    await ElMessageBox.confirm(`确认 ${report.reportedName} 存在违规行为？`, '确认违规', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }
  try {
    await messageApi.approveReport(report.id)
    await loadReports()
    ElMessage.success('已确认违规')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const dismissReport = async (report) => {
  try {
    await messageApi.dismissReport(report.id)
    await loadReports()
    ElMessage.success('已驳回该举报')
  } catch (e) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const statusText = (status) => {
  if (status === 'pending') return '待处理'
  if (status === 'approved') return '已确认违规'
  if (status === 'dismissed') return '已驳回'
  return status
}

const loadConversations = async (silent = false) => {
  if (!silent) conversationsLoading.value = true
  try {
    const res = await messageApi.conversations()
    conversations.value = Array.isArray(res) ? res : (res.conversations || [])
  } catch {
    if (!silent) ElMessage.error('加载会话失败')
  } finally {
    conversationsLoading.value = false
  }
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatBodyRef.value) chatBodyRef.value.scrollTop = chatBodyRef.value.scrollHeight
  })
}

const loadHistory = async (userId, silent = false) => {
  try {
    const res = await messageApi.history(userId)
    const list = Array.isArray(res) ? res : (res.messages || [])
    const prevLastId = messages.value[messages.value.length - 1]?.id
    const newLastId = list[list.length - 1]?.id
    messages.value = list
    if (!silent || (prevLastId !== undefined && prevLastId !== newLastId)) {
      scrollToBottom()
    }
  } catch {
    if (!silent) ElMessage.error('加载消息失败')
  }
}

const openConversation = async (conv) => {
  const otherId = Number(conv.otherId)
  activeConvId.value = otherId
  activeUser.value = { id: otherId, name: conv.otherName || '用户' + otherId, avatar: conv.otherAvatar || defaultAvatar }
  await loadHistory(otherId)
  try {
    await messageApi.readAll(otherId)
    const target = conversations.value.find(c => Number(c.otherId) === otherId)
    if (target) target.unread = 0
  } catch { /* ok */ }
}

const fetchUserInfoById = async (userId) => {
  try {
    const res = await userApi.getProfile(userId)
    const p = res.data || res
    if (p && (p.nickname || p.username || p.avatar)) {
      return { name: p.nickname || p.username || '用户' + userId, avatar: p.avatar || defaultAvatar }
    }
  } catch { /* ok */ }
  try {
    const res = await leaderboardApi.getByBalance()
    const raw = Array.isArray(res) ? res : (res.leaderboard || [])
    const found = raw.find(i => Number(i.userId || i.id) === Number(userId))
    if (found) {
      return { name: found.nickname || found.username || '用户' + userId, avatar: found.avatar || defaultAvatar }
    }
  } catch { /* ok */ }
  return { name: '用户' + userId, avatar: defaultAvatar }
}

const openConversationByUserId = async (userId) => {
  const otherId = Number(userId)
  if (!otherId || otherId === myId.value) return
  const existing = conversations.value.find(c => Number(c.otherId) === otherId)
  if (existing) {
    openConversation(existing)
    return
  }
  const user = await fetchUserInfoById(otherId)
  activeConvId.value = otherId
  activeUser.value = { id: otherId, name: user.name, avatar: user.avatar }
  await loadHistory(otherId)
  try {
    await messageApi.readAll(otherId)
  } catch { /* ok */ }
}

const sendMessage = async () => {
  const content = draft.value.trim()
  if (!content || activeConvId.value === null) return
  try {
    const res = await messageApi.send({ receiverId: activeConvId.value, content })
    const msg = res.data || res
    if (msg) messages.value.push(msg)
    draft.value = ''
    scrollToBottom()
    loadConversations(true)
  } catch (e) {
    ElMessage.error(e?.message || '发送失败')
  }
}

const openFeedbackDialog = () => {
  feedbackDialogVisible.value = true
}

const submitFeedback = async () => {
  const content = feedbackContent.value.trim()
  if (!content) {
    ElMessage.warning('请输入反馈内容')
    return
  }
  feedbackSubmitting.value = true
  try {
    await messageApi.send({ receiverId: 1, content, type: 'feedback' })
    ElMessage.success('反馈已提交，感谢您的支持')
    feedbackDialogVisible.value = false
    feedbackContent.value = ''
    await loadConversations()
    const adminConv = conversations.value.find(c => Number(c.otherId) === 1)
    if (adminConv) {
      await openConversation(adminConv)
    }
  } catch (e) {
    ElMessage.error(e?.message || '提交失败，请重试')
  } finally {
    feedbackSubmitting.value = false
  }
}

const closeMobileChat = () => {
  activeConvId.value = null
  activeUser.value = { id: null, name: '', avatar: '' }
  messages.value = []
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) {
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '昨天'
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}-${d.getDate()}`
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const handleRouteQuery = () => {
  const { chat, feedback } = route.query
  if (feedback !== undefined && String(feedback) !== '0') {
    openFeedbackDialog()
  }
  if (chat) {
    openConversationByUserId(Number(chat))
  }
}

let pollTimer = null
const startPolling = () => {
  stopPolling()
  pollTimer = setInterval(async () => {
    await loadConversations(true)
    if (activeConvId.value !== null) {
      await loadHistory(activeConvId.value, true)
    }
  }, 5000)
}
const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const onWindowFocus = () => {
  loadConversations(true)
  if (activeConvId.value !== null) loadHistory(activeConvId.value, true)
}

onMounted(async () => {
  document.title = '消息中心 - 淘大宝'
  resizeHandler()
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.replace('/auth')
    return
  }
  await loadConversations()
  await loadBlockedList()
  handleRouteQuery()
  startPolling()
  window.addEventListener('resize', resizeHandler)
  window.addEventListener('focus', onWindowFocus)
})

onBeforeUnmount(() => {
  stopPolling()
  window.removeEventListener('resize', resizeHandler)
  window.removeEventListener('focus', onWindowFocus)
})

watch(() => route.query, () => handleRouteQuery())
</script>

<style scoped>
.message-center-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 20px 0 40px;
}

.mc-back {
  max-width: 1200px;
  margin: 0 auto 16px;
}

.mc-layout {
  display: flex;
  gap: 16px;
  height: calc(100vh - 140px);
  min-height: 480px;
  max-width: 1200px;
  margin: 0 auto;
}

.mc-list-panel,
.mc-chat-panel {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.mc-list-panel {
  width: 320px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
}

.mc-list-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.mc-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a1a;
}

.feedback-entry {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  background: linear-gradient(135deg, #ff4400, #ff6a00);
  color: #fff;
  transition: opacity 0.2s;
}

.feedback-entry:hover {
  opacity: 0.92;
}

.feedback-icon {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feedback-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.feedback-name {
  font-size: 14px;
  font-weight: 600;
}

.feedback-desc {
  font-size: 12px;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mc-arrow {
  font-size: 14px;
  opacity: 0.9;
}

.report-review-entry {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 20px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
  font-size: 14px;
  transition: background 0.2s;
}

.report-review-entry:hover {
  background: #fafafa;
  color: #ff4400;
}

.report-badge {
  margin-left: auto;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4400;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
}

.conv-list {
  flex: 1;
  overflow-y: auto;
}

.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  cursor: pointer;
  transition: background 0.2s;
  border-bottom: 1px solid #f7f7f7;
}

.conv-item:hover {
  background: #fafafa;
}

.conv-item.active {
  background: #fff5f0;
}

.conv-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.conv-main {
  flex: 1;
  min-width: 0;
}

.conv-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 4px;
}

.conv-name {
  font-size: 14px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conv-time {
  font-size: 11px;
  color: #bbb;
  flex-shrink: 0;
}

.conv-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.conv-preview {
  font-size: 12px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

.conv-badge {
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  background: #ff4400;
  color: #fff;
  font-size: 11px;
  line-height: 18px;
  text-align: center;
  flex-shrink: 0;
}

.conv-empty {
  text-align: center;
  padding: 50px 20px;
  color: #bbb;
}

.conv-empty p {
  margin-top: 10px;
  font-size: 13px;
}

.mc-chat-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.chat-back-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  background: #f5f5f5;
}

.chat-back-btn:hover {
  color: #ff4400;
}

.chat-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  object-fit: cover;
}

.chat-name {
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
}

.chat-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.chat-actions :deep(.el-button--small) {
  border-radius: 8px;
}

.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.msg-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.msg-row.mine {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.msg-bubble {
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
}

.msg-row.mine .msg-bubble {
  background: #ff4400;
  color: #fff;
  border-top-right-radius: 2px;
}

.msg-row.theirs .msg-bubble {
  background: #f5f5f5;
  color: #333;
  border-top-left-radius: 2px;
}

.chat-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}

.chat-input {
  flex: 1;
}

.send-btn {
  background: #ff4400;
  border-color: #ff4400;
  border-radius: 8px;
}

.send-btn:hover {
  background: #ff6600;
  border-color: #ff6600;
}

.send-btn:disabled {
  background: #ffb199;
  border-color: #ffb199;
  color: #fff;
}

.chat-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  background: #fafafa;
}

.chat-empty p {
  margin-top: 12px;
  font-size: 14px;
}

.feedback-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.report-tip {
  font-size: 14px;
  color: #333;
  margin-bottom: 14px;
}

.report-evidence {
  margin-top: 16px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fafafa;
}

.report-evidence p {
  font-size: 12px;
  color: #999;
}

.review-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 120px;
}

.report-card {
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px 16px;
}

.report-header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 8px;
}

.report-reporter {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.report-reported {
  font-size: 13px;
  font-weight: 600;
  color: #ff4400;
}

.report-status {
  margin-left: auto;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: 10px;
}

.report-status.pending {
  background: #fff7e6;
  color: #d48806;
}

.report-status.approved {
  background: #fef0f0;
  color: #ff4400;
}

.report-status.dismissed {
  background: #f5f5f5;
  color: #999;
}

.report-reason {
  font-size: 13px;
  color: #555;
  margin-bottom: 8px;
}

.report-messages {
  background: #fafafa;
  border-radius: 8px;
  padding: 8px 12px;
  max-height: 140px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.report-msg {
  font-size: 13px;
  line-height: 1.5;
}

.rm-sender {
  color: #999;
  margin-right: 6px;
}

.rm-content {
  color: #333;
  word-break: break-word;
}

.report-actions {
  margin-top: 10px;
  display: flex;
  gap: 8px;
}

.feedback-types {
  display: flex;
}

.feedback-types :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner),
.feedback-types :deep(.el-radio-button__inner:hover) {
  color: #ff4400;
}

.feedback-types :deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-left-color: #dcdfe6;
}

@media (max-width: 768px) {
  .message-center-page {
    padding: 12px 0 24px;
  }

  .mc-layout {
    height: calc(100vh - 110px);
    min-height: 420px;
  }

  .mc-list-panel {
    width: 100%;
  }

  .mc-list-panel.is-hidden,
  .mc-chat-panel.is-hidden {
    display: none;
  }

  .conv-item {
    padding: 12px 14px;
  }

  .chat-header {
    padding: 10px 12px;
    gap: 8px;
  }

  .chat-name {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
  }

  .chat-actions {
    flex-shrink: 0;
    gap: 6px;
  }

  .chat-actions :deep(.el-button--small) {
    padding: 5px 10px;
  }

  .chat-body {
    padding: 12px;
  }

  .chat-input-row {
    padding: 8px 10px;
  }

  .msg-bubble {
    max-width: 80%;
  }
}
</style>
