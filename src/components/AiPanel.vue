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
      <div class="sgline" @click="useSuggest(curSug)"><span class="sgpfx">AI建议</span><span :key="'s'+curSug" class="sgroll">{{ curSug }}</span></div>
      <div class="ai-box">
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
const curSug=ref(suggests[0])
let sugTimer=null
function nextSug(){const i=suggests.indexOf(curSug.value);curSug.value=suggests[(i+1)%suggests.length]}
function startSug(){stopSug();sugTimer=setInterval(nextSug,3000)}
function stopSug(){clearInterval(sugTimer)}
const history = []      // {role, content} 用于后端上下文（完整句）
let shown = ref([])     // 渲染用（分段）
let seq = 0
let timers = []
const sentAny = ref(false)

function stripEnd(text){return text.replace(/[。！？!?；;，,、：:．.…~～\s]+$/,'').trim()}

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
    seg = stripEnd(seg)
    if (!seg) return
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
  shown.value.push({ id: ++seq, role: 'me', content: text })
  history.push({ role: 'me', content: text })
  scrollDown()
  typing.value = true
  sentAny.value = true
  nextSug()
  try {
    window.dispatchEvent(new Event('dl:flush')); await new Promise(r=>setTimeout(r,400))
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
  startSug()
  timers.forEach(t => clearTimeout(t))
  timers = []
  typing.value = false
}

watch(() => props.projectId, reset)
onMounted(startSug)
onBeforeUnmount(() => { timers.forEach(t => clearTimeout(t)); stopSug() })
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
.ai-foot{display:flex;flex-direction:column;gap:8px;padding:12px;border-top:1px solid var(--border);background:var(--surface)}
.sgline{display:inline-flex;align-items:center;gap:6px;align-self:flex-start;max-width:100%;background:var(--accent);color:#fff;border-radius:17px;padding:6px 13px;cursor:pointer;box-shadow:0 2px 8px rgba(0,122,255,.25);transition:transform .15s}
.sgline:hover{transform:translateY(-1px)}
.sgpfx{font-size:10px;font-weight:700;background:rgba(255,255,255,.25);border-radius:8px;padding:1px 5px;line-height:1.5}
.sgroll{font-size:12px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;animation:rollUp .4s ease}
.ai-box{display:flex;align-items:flex-end;gap:6px;border:1px solid var(--border);border-radius:14px;background:var(--bg);padding:6px;box-shadow:var(--shadow)}
.ai-box textarea{flex:1;resize:none;border:none;background:transparent;color:var(--text);padding:6px 8px;font-size:14px;outline:none;min-height:32px;max-height:120px;line-height:1.5;font-family:inherit}
.send{border:none;border-radius:10px;background:var(--accent);color:#fff;padding:0 16px;font-size:14px;cursor:pointer;height:34px;flex-shrink:0}
.send:disabled{opacity:.5}
@keyframes rollUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
</style>
