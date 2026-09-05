<template>
  <aside class="ai-panel">
    <header class="ai-head">
      <span class="ai-dot"></span>
      <span class="ai-title">小纸 <i class="ai-tag">AI</i></span>
      <button class="ai-x" @click="emit('close')">×</button>
    </header>

    <div class="ai-body" ref="bodyEl">
      <div v-if="!sentAny" class="ai-welcome">
        <div class="ai-avatar">AI</div>
        <p>我是你的日志搭子，能看到你最近记的内容，有啥想聊的随时说～</p>
      </div>
      <div class="msg-row" :class="m.role === 'me' ? 'me' : 'ai'" v-for="m in shown" :key="m.id">
        <div class="bubble">{{ m.content }}</div>
      </div>
      <div class="msg-row ai" v-if="typing">
        <div class="bubble typing"><span></span><span></span><span></span></div>
      </div>
    </div>

    <footer class="ai-foot">
      <div class="sgline" v-if="!hideSuggest"><span class="sgpfx">AI建议：</span><span :key="curSug" class="sgroll" @click="useSuggest(curSug)">{{ curSug }}</span></div>
      <div class="ai-input">
        <textarea v-model="draft" rows="1" placeholder="和小纸聊两句…" @input="autoGrow" @keydown.enter.prevent="send"></textarea>
        <button class="send" :disabled="!draft.trim() || typing" @click="send">发送</button>
      </div>
    </footer>
  </aside>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { aiApi } from '../api/ai'

const props = defineProps({ projectId: { type: Number, required: true } })
const emit = defineEmits(['close'])
const suggests = ['帮我总结今天', '帮我写这周周报', '我这周状态怎么样', '给我点建议']
const draft = ref('')
const typing = ref(false)
const bodyEl = ref(null)
const hideSuggest = ref(false)
const curSug=ref(suggests[0])
let sugTimer=null
function startSug(){stopSug();sugTimer=setInterval(()=>{const i=suggests.indexOf(curSug.value);curSug.value=suggests[(i+1)%suggests.length]},3000)}
function stopSug(){clearInterval(sugTimer)}
const history = []      // {role, content} 用于后端上下文（完整句）
let shown = ref([])     // 渲染用（分段）
let seq = 0
let timers = []
const sentAny = ref(false)

function splitReply(text) {
  text = text.replace(/\s+/g, ' ').trim()
  const segs = []
  let cur = ''
  for (const ch of text) {
    cur += ch
    const isEnd = /[。！？!?…]/.test(ch)
    const tooLong = cur.length >= 22
    if (isEnd || tooLong) {
      if (tooLong && !isEnd && /[，,、；;：: ]/.test(ch)) {
        // 从句处断
        segs.push(cur)
        cur = ''
      } else if (isEnd) { segs.push(cur); cur = '' }
    }
  }
  if (cur) segs.push(cur)
  return segs.filter(s => s.trim())
}

function scrollDown() { nextTick(() => { bodyEl.value?.scrollTo({ top: 1e6 }) }) }

function schedule(ms, fn) { const t = setTimeout(fn, ms); timers.push(t) }

function pushAiSegments(text) {
  const segs = splitReply(text)
  const total = segs.length
  segs.forEach((seg, i) => {
    let delay = 700 + Math.min(2400, seg.length * 90)
    if (i > 0) delay += 500
    schedule(i === 0 ? 500 : delay * (i), () => {
      shown.value.push({ id: ++seq, role: 'ai', content: seg })
      scrollDown()
      if (i === total - 1) { typing.value = false }
    })
  })
  // 至少给总时长一个收尾
  const end = 500 + segs.reduce((a, s) => a + (700 + Math.min(2400, s.length * 90)), 0)
  schedule(Math.min(end, 20000), () => { typing.value = false })
}

async function send() {
  const text = draft.value.trim()
  if (!text || typing.value) return
  draft.value = ''
  hideSuggest.value = true; stopSug()
  shown.value.push({ id: ++seq, role: 'me', content: text })
  history.push({ role: 'me', content: text })
  scrollDown()
  typing.value = true
  sentAny.value = true
  try {
    const res = await aiApi.chat({ projectId: props.projectId, message: text, messages: history })
    const reply = (res && (res.reply || res.data?.reply)) || '嗯嗯，我在听～'
    history.push({ role: 'ai', content: reply })
    pushAiSegments(reply)
  } catch {
    pushAiSegments('网络开小差了，稍后再试好吗')
  }
}

function useSuggest(s){ draft.value = s; send() }
function autoGrow(e){e.target.style.height='auto';e.target.style.height=Math.min(160,e.target.scrollHeight)+'px'}
function reset() {
  history.length = 0
  shown.value = []
  sentAny.value = false
  hideSuggest.value = false; startSug()
  timers.forEach(t => clearTimeout(t))
  timers = []
  typing.value = false
}

watch(() => props.projectId, reset)
onBeforeUnmount(() => timers.forEach(t => clearTimeout(t)))
</script>

<style scoped>
.ai-panel{width:100%;height:100%;display:flex;flex-direction:column;background:var(--surface);border-left:1px solid var(--border)}
.ai-head{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid var(--border)}
.ai-dot{width:8px;height:8px;border-radius:50%;background:var(--green)}
.ai-title{font-weight:600;font-size:14px;flex:1;display:flex;align-items:center;gap:5px}
.ai-tag{font-style:normal;font-size:9px;font-weight:700;background:var(--accent);color:#fff;border-radius:4px;padding:0 4px;line-height:1.4}
.ai-x{border:none;background:none;color:var(--text-2);font-size:18px;cursor:pointer;width:26px;height:26px;border-radius:50%}
.ai-x:hover{background:var(--surface-2)}
.ai-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;background:var(--bg)}
.ai-welcome{display:flex;gap:10px;color:var(--text-2);font-size:13px;align-items:flex-start;max-width:85%}
.ai-avatar{width:30px;height:30px;border-radius:8px;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0}
.ai-welcome p{line-height:1.5;margin:0}
.msg-row{display:flex}
.msg-row.me{justify-content:flex-end}
.msg-row.ai{justify-content:flex-start}
.bubble{max-width:82%;padding:8px 12px;border-radius:12px;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word;animation:pop .18s ease}
.msg-row.me .bubble{background:var(--accent);color:#fff;border-top-right-radius:3px}
.msg-row.ai .bubble{background:var(--surface);color:var(--text);border:1px solid var(--border);border-top-left-radius:3px}
.typing{display:flex;gap:4px;align-items:center;padding:8px 12px;background:var(--surface);border:1px solid var(--border);border-radius:12px;border-top-left-radius:3px;width:52px}
.typing span{width:6px;height:6px;border-radius:50%;background:var(--text-2);animation:blink 1.2s infinite}
.typing span:nth-child(2){animation-delay:.2s}.typing span:nth-child(3){animation-delay:.4s}
@keyframes blink{0%,60%,100%{opacity:.2}30%{opacity:1}}
@keyframes pop{from{transform:scale(.96);opacity:0}to{transform:scale(1);opacity:1}}
.ai-foot{display:flex;flex-direction:column;gap:8px;padding:12px;border-top:1px solid var(--border)}
.suggests{display:flex;gap:6px;overflow-x:auto;flex-wrap:nowrap;scrollbar-width:none}
.suggests::-webkit-scrollbar{display:none}
.sg{border:1px solid var(--border);background:var(--bg);color:var(--accent);font-size:12px;border-radius:14px;padding:4px 10px;cursor:pointer;white-space:nowrap;flex:none}
.sg:hover{border-color:var(--accent)}
.ai-input{display:flex;gap:8px}
.ai-input textarea{flex:1;resize:none;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);padding:8px 12px;font-size:14px;outline:none;min-height:36px;max-height:120px}
.send{border:none;border-radius:10px;background:var(--accent);color:#fff;padding:0 16px;font-size:14px;cursor:pointer}
.send:disabled{opacity:.5}
</style>
