<template>
  <div class="editor">
    <div class="work">
      <div class="top">
        <div class="t-left">
          <div class="t-name"><button class="back-m" @click="router.push('/projects')">‹</button>
            <span class="pn">{{ projectName }}</span><span class="t-sub">{{ projectSub }}</span></div>
          <span class="as-tip" :class="{ on: hasDirty }">{{ savedTip }}</span>
          <div class="ver-grp">
            <button class="vbtn" :disabled="!canUndo" @click="verPrev" title="撤销最近一次操作">上一版本</button>
            <button class="vbtn" :disabled="!canRedo" @click="verNext" title="重做">下一版本</button>
            <span class="vi-hint" tabindex="0"><i class="vi-q">i</i><span class="vi-tip">上一/下一版本为本次打开页面期间的临时记录，刷新或换设备后会丢失；服务端仅保留最近一次保存的状态。</span></span>
          </div>
        </div>
        <div class="t-actions">
          <button class="tb blue" @click="importOpen = true">导入任务</button>
          <span class="cal-wrap">
            <button class="cal-btn" @click="calToggle" title="按日历查看"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg></button>
            <transition name="fade"><div v-if="calOpen" class="cal-pane">
              <div class="cal-head"><button class="cm" @click="calShift(-1)">‹</button><span class="cal-title">{{ calTitle }}</span><button class="cm" @click="calShift(1)">›</button></div>
              <div class="cal-week"><span v-for="w in ['日','一','二','三','四','五','六']" :key="w">{{ w }}</span></div>
              <div class="cal-grid">
                <button v-for="d in calDays" :key="d.key" class="cal-d" :class="{ dim: !d.cur, today: d.today }" :style="d.style" :title="d.title" @click="calPick(d)">{{ d.num }}</button>
              </div>
            </div></transition>
          </span>
          <button class="theme-round" @click="theme.toggle" :title="theme.theme === 'dark' ? '切换到日间' : '切换到暗色'">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
        </div>
      </div>

      <div class="fmt">
        <select class="fsel" v-model="prefs.font" @change="applyPrefs"><option value="-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif">系统</option>
          <option value="'Songti SC','SimSun',serif">宋体</option><option value="'Times New Roman',serif">Times</option>
          <option value="ui-monospace,Menlo,Consolas,monospace">等宽</option></select>
        <select class="fsel" v-model.number="prefs.size" @change="applyPrefs"><option v-for="s in sizes" :key="s" :value="s">{{ s }}</option></select>
        <select class="fsel" v-model.number="prefs.lh" @change="applyPrefs"><option :value="1.2">1.2</option><option :value="1.4">1.4</option><option :value="1.6">1.6</option><option :value="1.8">1.8</option><option :value="2">2.0</option></select>
        <span class="sep"></span>
        <button class="fb" @mousedown.prevent="cmd('bold')">B</button>
        <button class="fb it" @mousedown.prevent="cmd('italic')">I</button>
        <button class="fb u" @mousedown.prevent="cmd('underline')">U</button>
        <span class="sep"></span>
        <div class="swatch"><template v-for="c in colors" :key="c"><i class="dotc" :style="{background:c}" @mousedown.prevent="cmd('foreColor',c)"></i></template></div>
        <div class="swatch hl"><template v-for="c in hl" :key="c"><i class="dotc" :style="{background:c}" @mousedown.prevent="cmd('hiliteColor',c)"></i></template></div>
        <span class="sr-wrap">
          <span class="fmt-search"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg><input v-model="searchQ" placeholder="搜索记录 / 日期…" @input="openSearch" @focus="openSearch" @blur="closeSearch" @keydown.enter="goFirstResult" /></span>
          <transition name="fade"><div v-if="searchOpen && searchResults.length" class="search-pane">
            <div v-for="r in searchResults" :key="r.date + '-' + r.idx" class="search-item" @mousedown.prevent="openSearchItem(r)">
              <span class="ss-day">{{ dayLabel(r.date) }} <em>{{ r.weekday }}</em></span>
              <span class="ss-text" :class="{ ok: r.done }">{{ r.text || '（当天记录）' }}</span>
            </div>
            <div v-if="!searchResults.length" class="search-empty">没有匹配的记录</div>
          </div></transition>
        </span>
        <button class="fmt-ai" :class="{ open: aiOpen }" @click="aiToggle" title="和小纸聊两句">
          <template v-if="!aiOpen"><i class="fa-tag">AI</i><span class="fa-name">小纸</span></template><span v-else class="fa-x">×</span>
        </button>
      </div>

      <div v-if="loadError" class="err">{{ loadError }}</div>
      
      <div class="swrap">
        <div class="scroll" ref="scrollEl" @scroll="onDocScroll">
        <div class="doc" :style="{ fontFamily: prefs.font, fontSize: prefs.size + 'px', lineHeight: prefs.lh }">
          <section v-for="day in days" :key="day.date" class="day-card">
            <div class="dhead">
              <span class="dt">{{ dayLabel(day.date) }}<em> {{ day.weekday }}</em></span>
              <span class="dtools">
                <span v-if="day.items.length" class="dstat" :class="cs(day)">{{ doneOf(day) }}/{{ day.items.length }}</span>
                <i v-if="day.items.length" class="cstat" :class="cs(day)" :title="'完成 ' + doneOf(day) + '/' + day.items.length"></i>
                <button class="del-day" @click="askDelete(day)" title="删除这一天">×</button>
              </span>
            </div>
            <div class="daybody" contenteditable="true" spellcheck="false" :data-date="day.date"
              @input="e => onInput(day)" @keydown="e => onKey(e, day)" @blur="e => blurDay(day, e)"></div>
            <div class="day-media">
              <div v-if="(day.files || []).length" class="mf-list">
                <button v-for="(f, fi) in day.files" :key="fi" class="mf-chip" @click="previewFile(f)"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M13 2v7h7"/></svg>{{ f.name }}</button>
              </div>
              <button class="mf-add" @click="openFilePick(day)"><svg viewBox="0 0 24 24" width="13" height="13"><path d="M12 5v14M5 12h14"/></svg>附件</button>
            </div>
          </section>

          <div v-if="!loading && !days.length" class="ph"><p>还没有记录。</p></div>

          <div class="card-add-row">
            <button class="add-card-btn" @click="addNextDay">＋ 新增记录 · 从今天开始</button>
          </div>
        </div>
      </div>
      <div class="docmap" v-if="days.length" @mousedown.prevent="mapDown">
        <div ref="mapMirror" class="map-mirror" aria-hidden="true"></div>
        <div class="map-thumb" :style="thumbStyle" @mousedown.prevent="thumbDown"></div>
      </div>
      </div>
    </div>

    <transition name="fade">
      <div v-show="aiOpen" class="ai-dialog" :style="{ top: aiPos.top + 'px', right: aiPos.right + 'px' }"><AiPanel :project-id="pid" @close="aiOpen = false" /></div>
    </transition>



    <!-- 导入历史 -->
    <div v-if="importOpen" class="center-mask">
      <div class="center-card wide">
        <h3>导入任务记录</h3>
        <p class="tip">支持 txt / Markdown / 纯文本。日期支持：2024-09-01、2024/9/1、2024年9月1日、20240901、9月1日或 9.1（自动就近补年份）等。任务行前加 [x]/✔ 视为已完成；多个日期自动分天、去重合并，可导入后点“上一版本”撤回。</p>
        <textarea v-model="importText" class="imp" placeholder="示例：
2024-09-01 周日
- [x] 复习高数
1. 写作业
2. 跑步

2024/09/02
- 读论文"></textarea>
        <p v-if="importPreview" class="tip">{{ importPreview }}</p>
        <div class="uprow"><button class="upfile" @click="$refs.impFile.click()">选择文件上传</button>
          <input ref="impFile" type="file" accept=".txt,.md,.json,.csv,text/plain" style="display:none" @change="onFile"></div>
        <div class="row">
          <button class="ghost" @click="importOpen = false">取消</button>
          <button class="ghost" @click="previewImport">预览</button>
          <button class="primary" :disabled="!parsed" @click="doImport">导入</button>
        </div>
      </div>
    </div>

    <input ref="pickImg" type="file" accept="image/*" multiple style="display:none" @change="onPickImg" />
    <input ref="pickFile" type="file" multiple style="display:none" @change="onPickFile" />
    <transition name="fade"><div v-if="toast" class="toast">{{ toast }}</div></transition>

    <!-- 删除确认 -->
    <transition name="fade">
      <div v-if="delDay" class="center-mask" @click.self="delDay = null">
        <div class="center-card warn">
          <h3>删除这一天？</h3>
          <p class="tip">{{ delDay ? dayLabel(delDay.date) : '' }} 的记录将被删除，此操作无法恢复。</p>
          <div class="row">
            <button class="ghost" @click="delDay = null">取消</button>
            <button class="danger" @click="doDelete">确认删除</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 历史未完成任务提醒 -->
    <transition name="fade">
      <div v-if="showRemind" class="center-mask" @click.self="closeRemind">
        <div class="center-card remind">
          <h3>有几条任务还没完成哦</h3>
          <p class="tip">过去 {{ pastPendingCount }} 个日子还有 {{ pastPendingTotal }} 条未完成，建议尽快处理：</p>
          <label class="remind-chk"><input type="checkbox" v-model="remindOff" @change="saveRemindOff" /> 不再提醒我（后续登录/刷新不再弹出）</label>
          <div class="col-btns">
            <button class="primary" @click="markAllPastDone">全部转为已完成</button>
            <button class="ghost-wide" @click="movePastToToday">全部未完成加到今天</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'
import AiPanel from '../components/AiPanel.vue'

const route=useRoute();const router=useRouter();const user=useUserStore();const theme=useThemeStore()
const pid=ref(Number(route.params.projectId))
const loading=ref(true);const loadError=ref('')
const projectName=ref('…');const projectSub=ref('')
const days=ref([]);const saving=ref(false)
const unsavedPrompt=ref(false)
const status=ref('已自动保存')
const lastSaved=ref('')
const pad2=n=>String(n).padStart(2,'0')
const nowStamp=()=>{const d=new Date();return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`}
const savedTip=computed(()=>hasDirty.value?'正在编辑…':(lastSaved.value?('已自动保存 '+lastSaved.value):'已自动保存'))
const versions=ref([]);const showVersions=ref(false);const selVersion=ref(null);const confirmRollback=ref(false)
const importOpen=ref(false);const importText=ref('');const parsed=ref([]);const importPreview=ref('')
const aiOpen=ref(false)
const aiPos=reactive({top:70,right:20})
const pickImg=ref(null)
const pickFile=ref(null)
let imgPick=null
let filePick=null
function placeAi(){const b=document.querySelector('.fmt-ai');if(!b)return
  const r=b.getBoundingClientRect()
  aiPos.top=Math.max(52,Math.round(r.bottom+6))
  aiPos.right=Math.max(8,Math.round(window.innerWidth-r.right))}
function aiToggle(){aiOpen.value=!aiOpen.value
  if(aiOpen.value)nextTick(placeAi)}
const searchQ=ref('')
const searchOpen=ref(false)
function normalizeDateQ(q){let s=q.replace(/\s/g,'')
  let m=s.match(/^(\d{4})[年.\-\/]?(\d{1,2})[月.\-\/](\d{1,2})日?$/);if(m)return `${m[1]}-${pad2(+m[2])}-${pad2(+m[3])}`
  m=s.match(/^(\d{1,2})[月.\-\/](\d{1,2})日?$/);if(m){const y=new Date().getFullYear();return `${y}-${pad2(+m[1])}-${pad2(+m[2])}`}
  return null}
const searchResults=computed(()=>{const q=searchQ.value.trim().toLowerCase();if(!q)return []
  const dq=normalizeDateQ(searchQ.value.trim())
  const res=[]
  for(const day of days.value){const lbl=(dayLabel(day.date)+day.weekday).toLowerCase()
    const dateHit=(dq&&day.date===dq)||lbl.includes(q)
    day.items.forEach((it,idx)=>{const th=(it.text||'').toLowerCase().includes(q)
      if(th||(dateHit&&idx===0))res.push({date:day.date,weekday:day.weekday,idx,text:it.text||'',done:!!it.done})})
    if(dateHit&&!day.items.length)res.push({date:day.date,weekday:day.weekday,idx:0,text:'',done:false})}
  return res.slice(0,40)})
function openSearch(){searchOpen.value=true}
function closeSearch(){setTimeout(()=>{searchOpen.value=false},120)}
function goFirstResult(){if(searchResults.value.length)openSearchItem(searchResults.value[0])}
function openSearchItem(r){searchOpen.value=false;scrollToDay(r.date,r.idx)}
const calOpen=ref(false)
const calMonth=reactive({y:(()=>{const d=new Date();return d.getFullYear()})(),m:(()=>{const d=new Date();return d.getMonth()+1})()})
function calToggle(){calOpen.value=!calOpen.value}
function calShift(d){let y=calMonth.y,m=calMonth.m+d;if(m<1){m=12;y--}if(m>12){m=1;y++}calMonth.y=y;calMonth.m=m}
const calTitle=computed(()=>calMonth.y+'年'+calMonth.m+'月')
function dayRatio(date){const d=findDay(date);if(!d||!d.items.length)return 0;return d.items.filter(i=>i.done).length/d.items.length}
const calDays=computed(()=>{const y=calMonth.y,m=calMonth.m;const first=new Date(y,m-1,1).getDay();const dim=new Date(y,m,0).getDate();const today=tNow;const arr=[]
  for(let i=0;i<first;i++)arr.push({key:'e'+i,num:'',cur:false,today:false,style:{},title:''})
  for(let n=1;n<=dim;n++){const date=`${y}-${pad2(m)}-${pad2(n)}`;const ratio=dayRatio(date);const alpha=ratio>0?(0.18+0.82*ratio):0
    arr.push({key:date,num:n,cur:true,today:date===today,date,title:date+' · '+Math.round(ratio*100)+'%',style:{background:alpha?`rgba(10,132,255,${alpha.toFixed(2)})`:'transparent'}})}
  return arr})
function calPick(d){if(!d.cur)return;calOpen.value=false;if(dayRatio(d.date)>=0&&findDay(d.date)){scrollToDay(d.date,0);return}showToast('这一天没有记录')}
function scrollToDay(date,idx){const el=document.querySelector(`.daybody[data-date="${date}"]`)?.closest('.day-card');const scr=scrollEl.value;if(!el||!scr)return
  const sr=scr.getBoundingClientRect();const top=scr.scrollTop+(el.getBoundingClientRect().top-sr.top)-12
  scr.scrollTo({top:Math.max(0,top),behavior:'smooth'})
  if(idx!=null){const li=document.querySelector(`.daybody[data-date="${date}"] ol>li:nth-child(${idx+1})`);if(li){li.classList.add('fl');setTimeout(()=>li.classList.remove('fl'),1400)}}}
const scrollEl=ref(null)
const showRemind=ref(false)
const remindOff=ref(localStorage.getItem('dl_rem_off')==='1')
function saveRemindOff(){if(remindOff.value)localStorage.setItem('dl_rem_off','1');else localStorage.removeItem('dl_rem_off')}
const undoStack=ref([]);const redoStack=ref([])
const canUndo=computed(()=>undoStack.value.length>0)
const canRedo=computed(()=>redoStack.value.length>0)
const pastPendingTotal=ref(0)
const pastPendingCount=ref(0)

const toast=ref('');let toastTimer=null;const timers={}
const sizes=[12,13,14,15,16,18,20,22,24]
const colors=['#1d1d1f','#ff3b30','#ff9500','#ffcc00','#34c759','#0a84ff','#af52de','#ffffff']
const hl=['#ffe08a','#b1ff9e','#9ecbff','#ffd1d1','#e0d0ff','transparent']
function lp(){try{return JSON.parse(localStorage.getItem('dl_prefs')||'null')}catch{return null}}
const prefs=reactive(lp()||{font:"-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif",size:16,lh:1.6})
function applyPrefs(){localStorage.setItem('dl_prefs',JSON.stringify(prefs))}
const WEEKS=['周日','周一','周二','周三','周四','周五','周六']
const pad=n=>String(n).padStart(2,'0')
function dstr(d){return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`}
const nowD=new Date();const tNow=dstr(nowD)
const isToday=d=>d===tNow
const doneOf=day=>(day.items||[]).filter(i=>i.done).length
const cs=day=>{const it=day.items||[];if(!it.length)return '';return it.every(i=>i.done)?'ok':'todo'}
const mapCls=day=>{const it=day.items||[];if(!it.length)return 'none';return it.every(i=>i.done)?'ok':'todo'}
const mapMirror=ref(null)
const thumb=reactive({top:0,h:16})
const thumbStyle=computed(()=>({top:thumb.top+'px',height:Math.max(10,thumb.h)+'px'}))
let mapRaf=0
const M={r:.5,top:0,mapH:0}
const clampN=(v,a,b)=>Math.max(a,Math.min(b,v))
function scheduleMap(){if(mapRaf)return;mapRaf=requestAnimationFrame(()=>{mapRaf=0;drawMap()})}
function drawMap(){
  const scr=scrollEl.value;const docEl=scr?.querySelector('.doc');const mapEl=document.querySelector('.docmap')
  const mw=mapMirror.value
  if(!scr||!docEl||!mapEl||!mw||!days.value.length)return
  const list=[...docEl.children].filter(el=>el.getBoundingClientRect().height>0)
  if(!list.length)return
  const dr=docEl.getBoundingClientRect()
  let top=Infinity,bottom=-Infinity
  list.forEach(el=>{const r=el.getBoundingClientRect();const t=r.top-dr.top;const b=r.bottom-dr.top;if(t<top)top=t;if(b>bottom)bottom=b})
  const cs=getComputedStyle(docEl)
  const contentW=Math.max(1,docEl.clientWidth-parseFloat(cs.paddingLeft||0)-parseFloat(cs.paddingRight||0))
  const mapW=Math.max(1,mapEl.clientWidth)
  const r=Math.max(0.04,Math.min(1,mapW/contentW))
  M.r=r;M.top=top;M.mapH=mapEl.clientHeight;M.sH=Math.max(bottom-top,0)*r
  mw.style.width=Math.round(contentW)+'px'
  mw.style.transform='scale('+r+')'
  updateMirror()
  mw.innerHTML=list.map(el=>el.outerHTML).join('')
  ;[...mw.querySelectorAll('.day-card')].forEach(card=>{
    const lis=[...card.querySelectorAll('ol>li')]
    const undone=lis.some(li=>!li.classList.contains('done'))
    card.style.background=undone?'rgba(255,149,0,0.16)':'transparent'
    card.style.borderRadius='6px'
  })
  computeMapThumb()}
function computeMapThumb(){const scr=scrollEl.value;if(!scr)return
  const H=document.querySelector('.docmap')?.clientHeight||Math.max(10,M.mapH)
  const max=scr.scrollHeight-scr.clientHeight
  const filled=Math.min(M.sH||H,H)
  if(max<=0||filled<=0){thumb.top=0;thumb.h=Math.max(10,Math.min(filled||H,H));return}
  const vr=Math.min(1,scr.clientHeight/scr.scrollHeight)
  thumb.h=Math.max(8, Math.min(filled, Math.max(10, filled*vr)))
  const range=Math.max(0, filled-thumb.h)
  thumb.top=clampN((scr.scrollTop/max)*range,0,range)}
function updateMirror(){const mw=mapMirror.value;const scr=scrollEl.value;if(!mw||!scr||!M.r)return
  const shift=(M.sH>M.mapH)?scr.scrollTop*M.r:0
  mw.style.top=Math.round(M.top*M.r-shift)+'px'}
function onDocScroll(){computeMapThumb();updateMirror()}
function startThumb(e){const scr=scrollEl.value;if(!scr||!M.r)return
  const max=scr.scrollHeight-scr.clientHeight;const startY=e.clientY;const startTop=scr.scrollTop
  const mv=ev=>{const dy=ev.clientY-startY;scr.scrollTop=clampN(startTop+dy/M.r,0,Math.max(0,max))}
  const up=()=>{window.removeEventListener('mousemove',mv);window.removeEventListener('mouseup',up)}
  window.addEventListener('mousemove',mv);window.addEventListener('mouseup',up)}
function thumbDown(e){e.preventDefault();startThumb(e)}
function mapDown(e){const scr=scrollEl.value;if(!scr)return
  const mapEl=document.querySelector('.docmap');if(!mapEl)return
  const y=e.clientY-mapEl.getBoundingClientRect().top
  const H=M.mapH||mapEl.clientHeight
  const filled=Math.min(M.sH||H,H)
  const frac=clampN(y/Math.max(1,filled),0,1)
  const max=Math.max(0,scr.scrollHeight-scr.clientHeight)
  scr.scrollTo({top:frac*max,behavior:'smooth'})}
function jumpDay(i){const d=days.value[i];if(!d||!scrollEl.value)return
  const el=document.querySelector(`.daybody[data-date="${d.date}"]`)?.closest('.day-card');if(!el)return
  const sr=scrollEl.value.getBoundingClientRect();const top=scrollEl.value.scrollTop+(el.getBoundingClientRect().top-sr.top)-12
  scrollEl.value.scrollTo({top:Math.max(0,top),behavior:'smooth'})}
function pastUnfinished(){const arr=days.value.filter(d=>d.date<tNow&&(d.items||[]).some(i=>!i.done))
  return {list:arr,total:arr.reduce((n,d)=>n+d.items.filter(i=>!i.done).length,0),count:arr.length}}
function ensureToday(){let today=findDay(tNow);if(!today){today=norm({date:tNow,weekday:wk(tNow),items:[]});days.value.push(today)}
  days.value.sort((x,y)=>x.date<y.date?-1:1);renderBody(today);return today}
function saveDays(arr){return Promise.all(arr.map(d=>projectApi.commit(pid.value,d.date,{weekday:d.weekday,items:d.items}).then(()=>{d._dirty=false;d._last=snapDay(d)}).catch(()=>{})))}
async function maybeRemind(){if(localStorage.getItem('dl_rem_off')==='1')return
  const u=pastUnfinished();if(!u.total)return
  pastPendingTotal.value=u.total;pastPendingCount.value=u.count;showRemind.value=true}
function closeRemind(){showRemind.value=false}
function scrollToBottomEntry(){const el=scrollEl.value;if(!el||!days.value.length)return
  const max=el.scrollHeight-el.clientHeight;if(max<=0)return
  el.scrollTop=Math.max(0,max-1000)
  requestAnimationFrame(()=>{el.scrollTo({top:max,behavior:'smooth'})})}
async function markAllPastDone(){pushSnap('全部标记完成')
  const u=pastUnfinished();if(!u.list.length){closeRemind();return}
  const changed=[];u.list.forEach(d=>{d.items.forEach(i=>i.done=true);changed.push(d)})
  await saveDays(changed);changed.forEach(renderBody);closeRemind();showToast('已全部标记完成')}
async function movePastToToday(){pushSnap('未完成搬到今天')
  const u=pastUnfinished();const today=ensureToday()
  const move=[];u.list.forEach(d=>{d.items.forEach(i=>{if(!i.done){move.push({text:i.text,done:false});i.done=true}})})
  today.items=today.items.concat(move.filter(i=>i.text&&i.text.trim()));renderBody(today)
  await saveDays([today,...u.list]);closeRemind();showToast('已将 '+move.length+' 条搬到今天')}
const dayLabel=d=>{const p=d.split('-');return `${p[0]}年${+p[1]}月${+p[2]}日`}
const wk=d=>WEEKS[new Date(d+'T00:00:00').getDay()]
const fmtTime=t=>{if(!t)return'';const d=new Date(t);return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`}
const hasDirty=computed(()=>days.value.some(d=>d._dirty))
const norm=l=>({date:l.date,weekday:l.weekday||wk(l.date),items:(l.items||[]).map(i=>({text:(i.text||'').replace(/^[。.]$/,'').trim(),done:!!i.done,img:Array.isArray(i.img)?i.img.slice():[]})),files:(Array.isArray(l.files)?l.files.map(f=>({name:f.name||'文件',type:f.type||'',url:f.url})):[]),_dirty:false,_last:null})
const findDay=date=>days.value.find(d=>d.date===date)
const snapDay=day=>{const a=day.items.map(i=>[i.text,i.done,JSON.stringify(i.img||[])]);a.push('F'+JSON.stringify(day.files||[]));return a}
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)

function appendMedia(li,it,day,idx){if(!day)return
  const box=document.createElement('div');box.className='li-media';box.setAttribute('contenteditable','false')
  const arr=Array.isArray(it.img)?it.img:[]
  arr.forEach((u,ii)=>{const w=document.createElement('span');w.className='thumb'
    const im=document.createElement('img');im.src=u;im.loading='lazy'
    im.addEventListener('click',()=>{window.open(u,'_blank')})
    const x=document.createElement('i');x.className='rm';x.textContent='×'
    x.addEventListener('mousedown',ev=>{ev.preventDefault();ev.stopPropagation()})
    x.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();(day.items[idx].img||[]).splice(ii,1);renderBody(day);afterAttach(day)})
    w.appendChild(im);w.appendChild(x);box.appendChild(w)})
  const add=document.createElement('button');add.type='button';add.className='add-im';add.setAttribute('contenteditable','false');add.tabIndex=-1
  add.innerHTML='<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>图片'
  add.addEventListener('mousedown',ev=>{ev.preventDefault();ev.stopPropagation()})
  add.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openImgPick(day,idx)})
  box.appendChild(add)
  li.appendChild(box)}
function afterAttach(day){day._dirty=true;unsavedPrompt.value=false;clearTimeout(timers[day.date]);timers[day.date]=setTimeout(()=>autosave(day),400)}
function openImgPick(day,i){imgPick={day,i};pickImg.value&&pickImg.value.click()}
function onPickImg(){showToast('读取图片中…')
  const inp=pickImg.value;if(!inp){showToast('未找到图片选择器');return}const fs=inp.files;inp.value='';if(!fs||!fs.length){showToast('未取到文件');return}
  const job=imgPick;imgPick=null;if(!job){showToast('未记录目标任务');return}
  const day=job.day,i=job.i
  if(!day.items[i])day.items[i]={text:'',done:false,img:[]}
  if(!day.items[i].img)day.items[i].img=[]
  const reads=[...fs].map(f=>new Promise(res=>{if(f.size>3*1024*1024)return res(null);const r=new FileReader();r.onload=()=>res(String(r.result));r.onerror=()=>res(null);r.readAsDataURL(f)}))
  Promise.all(reads).then(list=>{const ok=list.filter(Boolean);ok.forEach(u=>day.items[i].img.push(u));showToast('已读取 '+ok.length+' 张图片');renderBody(day);afterAttach(day);requestAnimationFrame(()=>{const els=document.querySelectorAll(`.daybody[data-date="${day.date}"] .thumb`);console.log('thumb count',els.length)})})}
function openFilePick(day){filePick=day;pickFile.value&&pickFile.value.click()}
function previewFile(f){if(f&&f.url){if(f.url.indexOf('data:image')===0||/^data:/.test(f.url)){const w=window.open('','_blank');if(w){w.document.write('<title>'+(f.name||'预览')+'</title><body style="margin:0"><img src="'+f.url+'" style="width:auto;max-width:100%;max-height:100vh"/></body>');w.document.close()}else{window.open(f.url,'_blank')}}else{window.open(f.url,'_blank')}}}
function onPickFile(){showToast('读取附件中…')
  const inp=pickFile.value;if(!inp){showToast('未找到附件选择器');return}const fs=inp.files;inp.value='';if(!fs||!fs.length){showToast('未取到文件');return}
  const day=filePick;filePick=null;if(!day){showToast('未记录目标卡片');return}
  if(!Array.isArray(day.files))day.files=[]
  const reads=[...fs].map(f=>new Promise(res=>{if(f.size>8*1024*1024)return res(null);const r=new FileReader();r.onload=()=>res({name:f.name,type:f.type||'',url:String(r.result)});r.onerror=()=>res(null);r.readAsDataURL(f)}))
  Promise.all(reads).then(list=>{const ok=list.filter(Boolean);ok.forEach(f=>day.files.push(f));showToast('已添加 '+ok.length+' 个附件');afterAttach(day)})}
function renderBody(day){nextTick(()=>{
  const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const ol=document.createElement('ol')
  day.items.forEach((it,idx)=>{const li=document.createElement('li');if(it.done)li.classList.add('done');li.appendChild(document.createTextNode(it.text||''));appendMedia(li,it,day,idx);ol.appendChild(li)})
  if(!ol.children.length){const li=document.createElement('li');ol.appendChild(li)}
  el.innerHTML='';el.appendChild(ol)
  layout(day)
  scheduleMap()
})}
function layout(day){const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const lis=[...el.querySelectorAll('ol>li')]
  let rail=el.querySelector(':scope > .rail');if(!rail){rail=document.createElement('div');rail.className='rail';rail.setAttribute('contenteditable','false');el.appendChild(rail)}
  while(rail.children.length<lis.length){rail.appendChild(document.createElement('button'))}
  while(rail.children.length>lis.length)rail.removeChild(rail.lastChild)
  lis.forEach((li,i)=>{const bt=rail.children[i];const on=li.classList.contains('done');bt.className='sw'+(on?' on':'');bt.style.top=(li.offsetTop+2)+'px'
    bt.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();day.items[i]=day.items[i]||{text:li.textContent||'',done:false};day.items[i].done=!day.items[i].done;li.classList.toggle('done',day.items[i].done);readBody(day);onInput(day)}})
}
function readBody(day){const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const lis=[...el.querySelectorAll(':scope ol > li')];const old=day.items||[]
  day.items=lis.map((li,idx)=>{const c=li.cloneNode(true);c.querySelectorAll('.li-imgs,.li-media').forEach(n=>n.remove())
    return {text:(c.textContent||'').replace(/\u00a0/g,'').trim(),done:li.classList.contains('done'),img:Array.isArray(old[idx]&&old[idx].img)?old[idx].img.slice():[]} })}
function onInput(day){readBody(day);if(!day.items.length){day.items=[{text:'',done:false}];renderBody(day)}requestAnimationFrame(()=>{layout(day);scheduleMap()});const key=snapDay(day)
  if(!day._last||!same(day._last,key)){day._dirty=true;unsavedPrompt.value=false;clearTimeout(timers[day.date]);timers[day.date]=setTimeout(()=>autosave(day),900);day._last=key}}
function onKey(e,day){
  if((e.key==='Backspace'||e.key==='Delete') && day.items.length===1 && !day.items[0].text.trim()){ e.preventDefault(); return }
}
function blurDay(day,e){
  const t=e?.relatedTarget
  if(t && t.nodeType===1 && (t.classList?.contains('sw') || t.closest?.('.rail')))return
  readBody(day)
  const prev=snapDay(day)
  day.items=cleanItems(day.items)
  if(!day.items.length)day.items=[{text:'',done:false}]
  renderBody(day)
  const key=snapDay(day)
  if(!same(prev,key)&&(!day._last||!same(day._last,key))){day._dirty=true;unsavedPrompt.value=false;clearTimeout(timers[day.date]);timers[day.date]=setTimeout(()=>autosave(day),900);day._last=key}
}
const delDay=ref(null)
function askDelete(day){delDay.value=day}
function doDelete(){const day=delDay.value;if(!day)return
  pushSnap('删除 '+dayLabel(day.date))
  const i=days.value.findIndex(d=>d.date===day.date);if(i>=0)days.value.splice(i,1)
  delDay.value=null
  clearTimeout(timers[day.date]);delete timers[day.date]
  projectApi.removeDay(pid.value,day.date).catch(()=>{})
  scheduleMap()
  showToast('已删除，无法恢复')}
function focusLi(day,idx){nextTick(()=>{const el=document.querySelector(`.daybody[data-date="${day.date}"]`);const lis=el?.querySelectorAll('ol>li');const d=lis&&lis[idx!=null?idx:0];if(!d)return
  d.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(d);r.collapse(false);s.removeAllRanges();s.addRange(r)})}
function addNextDay(){let date,day
  if(!findDay(tNow)){date=tNow}
  else{const last=days.value.reduce((m,d)=>d.date>m?d.date:m,'');const nd=new Date((last?last:tNow)+'T00:00:00');nd.setDate(nd.getDate()+1);date=dstr(nd)}
  pushSnap('新增 '+dayLabel(date))
  day=findDay(date)
  if(!day){day=norm({date,weekday:wk(date),items:[]});days.value.push(day)}
  days.value.sort((a,b)=>a.date<b.date?-1:1)
  renderBody(day);onInput(day);focusLi(day,0);document.querySelector('.daybody[data-date="'+date+'"]')?.scrollIntoView({behavior:'smooth',block:'center'})}
function showToast(m){toast.value=m;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2000)}
function clearAllTimers(){Object.values(timers).forEach(t=>clearTimeout(t))}
function curSnap(){days.value.forEach(readBody);return snapAll()}
function snapAll(){return days.value.map(d=>({date:d.date,items:cleanItems(d.items).map(i=>({text:i.text,done:!!i.done}))}))}
function pushSnap(tag){undoStack.value.push({tag,data:curSnap()});if(undoStack.value.length>40)undoStack.value.shift();redoStack.value=[]}
async function persistDoc(list){for(const d of list){d._dirty=false;d._last=snapDay(d);await projectApi.commit(pid.value,d.date,{weekday:d.weekday,items:d.items,files:d.files||[]}).catch(()=>{})}}
async function applyVersion(dir){const src=dir==='prev'?undoStack:redoStack;const dst=dir==='prev'?redoStack:undoStack
  if(!src.value.length)return
  clearAllTimers()
  const snap=src.value.pop()
  const curDates=days.value.map(d=>d.date)
  dst.value.push({tag:'当前',data:curSnap()})
  days.value=snap.data.map(r=>({date:r.date,weekday:wk(r.date),items:r.items.map(i=>({text:i.text,done:!!i.done})),_dirty:false,_last:null}))
  days.value.sort((a,b)=>a.date<b.date?-1:1)
  const keep=new Set(days.value.map(d=>d.date))
  for(const rem of curDates.filter(x=>!keep.has(x))){await projectApi.removeDay(pid.value,rem).catch(()=>{})}
  await persistDoc(days.value)
  days.value.forEach(renderBody)
  lastSaved.value=nowStamp()
  const tag=snap.tag?('（'+snap.tag+'）'):''
  showToast(dir==='prev'?('已回到上一版本'+tag):('已前进到下一版本'+tag))}
function verPrev(){applyVersion('prev')}
function verNext(){applyVersion('next')}

async function load(){loading.value=true;loadError.value=''
  try{const list=await projectApi.list();const arr=Array.isArray(list)?list:(list.projects||[])
    const p=arr.find(x=>x.id===pid.value);projectName.value=p?.name||'项目';projectSub.value=p?(p.type==='school'?'入学':'入职')+' '+p.startDate:''
    const logs=await projectApi.logs(pid.value,{full:1});const logArr=Array.isArray(logs)?logs:(logs.logs||[])
    days.value=logArr.map(norm);days.value.forEach(d=>{d._last=snapDay(d)})
    if(days.value.length){const last=days.value[days.value.length-1]
      try{const info=await projectApi.log(pid.value,last.date);if(info.dayLog&&info.lastVersion&&!same(snapDay(last),info.lastVersion.items.map(i=>[i.text||'',!!i.done])))unsavedPrompt.value=true}catch{}}
    days.value.forEach(renderBody)
    requestAnimationFrame(()=>{days.value.forEach(renderBody);maybeRemind();scrollToBottomEntry()})
  }catch(e){loadError.value=e?.error||'加载失败'}
  loading.value=false}
function cleanItems(a){return a.map(i=>({text:(i.text||'').replace(/^\s*[。.。]\s*$/,'').trim(),done:!!i.done,img:Array.isArray(i.img)?i.img.slice():[]})).filter(i=>i.text!==''||(i.img&&i.img.length))}
async function autosave(day){readBody(day);day.items=cleanItems(day.items);try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items,files:day.files||[]});day._dirty=false;day._last=snapDay(day);lastSaved.value=nowStamp()}catch{}}
async function saveDraft(day){try{await projectApi.draft(pid.value,day.date,{weekday:day.weekday,items:day.items})}catch{}}
async function saveAll(){saving.value=true
  for(const day of days.value){if(!day._dirty)continue;readBody(day)
    try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items,files:day.files||[]});day._last=snapDay(day);day._dirty=false;lastSaved.value=nowStamp()}catch(e){loadError.value=e?.error||'保存失败'}}
  unsavedPrompt.value=false;saving.value=false;showToast('已保存')}
async function discardAll(){unsavedPrompt.value=false
  for(const day of days.value){if(!day._dirty)continue;let arr=[]
    try{const info=await projectApi.log(pid.value,day.date);arr=(info.lastVersion?info.lastVersion.items:[]).map(i=>({text:i.text||'',done:!!i.done}))}catch{}
    day.items=arr;day._dirty=false;day._last=snapDay(day);renderBody(day)}showToast('已放弃修改')}

async function openVersions(){const day=days.value[days.value.length-1];if(!day)return
  showVersions.value=true;selVersion.value=null;confirmRollback.value=false
  try{versions.value=(await projectApi.versions(pid.value,day.date)).slice(0,5)}catch{versions.value=[]}}
function askRollback(){if(selVersion.value)confirmRollback.value=true}
async function doRollback(){confirmRollback.value=false;const v=selVersion.value;if(!v)return
  const day=days.value[days.value.length-1]
  try{await projectApi.rollback(pid.value,day.date,v.id!=null?v.id:v.version)
    day.items=(v.items||[]).map(i=>({text:i.text||'',done:!!i.done}));day._dirty=false;day._last=snapDay(day);renderBody(day);showVersions.value=false;showToast('已回退到 v'+v.version)}
  catch(e){loadError.value=e?.error||'回退失败'}}
const preview=items=>(items||[]).slice(0,3).map(i=>(i.done?'✓ ':'· ')+(i.text||'')).join('　')+((items||[]).length>3?'…':'')

// 导入解析
function fw(s){return s.replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0))}
function normDate(y,m,d){return `${pad(y)}-${pad(+m)}-${pad(+d)}`}
function validDate(ds){const t=new Date(ds+'T00:00:00');return !isNaN(t.getTime())&&ds===dstr(t)}
function resolveMd(mm,dd){const y0=new Date().getFullYear();let base=new Date(y0,mm-1,dd)
  if(base.getMonth()!==mm-1||base.getDate()!==dd)return null
  if(base>new Date())base=new Date(y0-1,mm-1,dd)
  return dstr(base)}
function parseLineDate(line){let s=fw(line).trim()
  s=s.replace(/^(?:日期|时间)\s*[:：]\s*/i,'')
  let m=s.match(/^(\d{4})\s*[年.\-\/]\s*(\d{1,2})\s*[月.\-\/]\s*(\d{1,2})\s*[日号]?/)
  if(m){const ds=normDate(m[1],m[2],m[3]);if(validDate(ds))return ds}
  m=s.match(/^(\d{4})(\d{2})(\d{2})/)
  if(m){const ds=normDate(m[1],m[2],m[3]);if(validDate(ds))return ds}
  m=s.match(/^(\d{1,2})\s*[月.\-\/]\s*(\d{1,2})\s*[日号]?/)
  if(m)return resolveMd(+m[1],+m[2])
  return null}
function stripMark(t){let s=fw(t).trim();let q
  do{q=s.replace(/^(\s*[-*•·]+\s+|\s*\d{1,3}\s*[.、)]\s+|\s*[#>]\s+)/,'');if(q===s)break;s=q}while(true)
  return s}
function isWeekdayHeading(t){return /^(星期[一二三四五六日天]|周[一二三四五六日天])$/.test(t)}
function isDoneLine(t){return /^[✓✔×x]|[\[（(]\s*(x|√|✓|完成)\s*[\]）)]|完成\s*$/.test(t)}
function cleanText(t){return t.replace(/^[✓✔×x]\s*|[\[（(]\s*(x|√|✓|完成)\s*[\]）)]\s*|\s*完成\s*$/,'').replace(/[。.]$/,'').trim()}
function detectDate(line){const forms=[];let base=fw(line).trim();if(!base)return null
  forms.push(base)
  const rmWk=t=>t.replace(/^(?:星期[一二三四五六日天]|周[一二三四五六日天])\s*[\s（(【]?/,'')
  forms.push(rmWk(base))
  let b=base.replace(/^[-*•·#>\s]*/,'').trim()
  forms.push(b);forms.push(rmWk(b))
  let n=base.replace(/^\d{1,3}\s*[.、)）]\s*/,'')
  if(n!==base)forms.push(n)
  forms.push(base.replace(/^[（(【\[『「]\s*/,''))
  for(const f of forms){const d=parseLineDate(f);if(d)return d}
  return null}
function parseImport(text){const map=new Map();let cur=null
  for(const raw of text.split(/\r?\n/)){let line=fw(raw).trim();if(!line)continue
    const body=stripMark(line).trim()
    const headDate=detectDate(line)||detectDate(body)
    if(headDate){if(!map.has(headDate))map.set(headDate,{date:headDate,weekday:wk(headDate),items:[]});cur=map.get(headDate);continue}
    if(!body||isWeekdayHeading(body))continue
    if(/^\d{4}\s*[年.\-\/]\s*\d{1,2}\s*[月.\-\/]\s*\d{1,2}/.test(body)||/^\d{1,2}\s*[月.\-\/]\s*\d{1,2}/.test(body))continue
    if(!cur){const d=tNow;if(!map.has(d)){map.set(d,{date:d,weekday:wk(d),items:[]})}cur=map.get(d)}
    const done=isDoneLine(body);const clean=cleanText(body)
    if(clean)cur.items.push({text:clean,done})}
  return [...map.values()].sort((a,b)=>a.date<b.date?-1:1)}
function previewImport(){parsed.value=parseImport(importText.value)
  importPreview.value=parsed.value.length?`解析到 ${parsed.value.length} 天，共 ${parsed.value.reduce((s,d)=>s+d.items.length,0)} 条任务`:'未识别到内容'}
function onFile(e){const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=ev=>{importText.value=String(ev.target.result||'');previewImport()};r.readAsText(f)}
async function doImport(){if(!parsed.value.length)return
  pushSnap('导入历史')
  clearAllTimers()
  const upserted=[];let added=0
  for(const d of parsed.value){
    let day=findDay(d.date)
    if(!day){day=norm({date:d.date,weekday:wk(d.date),items:[]});days.value.push(day)}
    const have=new Set((day.items||[]).map(i=>i.text))
    for(const it of d.items){if(it.text&&!have.has(it.text)){day.items.push({text:it.text,done:!!it.done});have.add(it.text);added++}}
    upserted.push(day)}
  days.value.sort((a,b)=>a.date<b.date?-1:1)
  await persistDoc(upserted)
  days.value.forEach(renderBody)
  importOpen.value=false;importText.value='';parsed.value=[];importPreview.value=''
  showToast('已导入 '+added+' 条任务，可点“上一版本”撤回')}
function cmd(c,val){try{document.execCommand(c,false,val)}catch{}}
function flushNow(){days.value.forEach(day=>{if(day._dirty){readBody(day);clearTimeout(timers[day.date]);autosave(day)}})}

onMounted(()=>{if(!user.isLoggedIn){router.push('/login');return}load();window.addEventListener('resize',relayoutAll);window.addEventListener('dl:flush',flushNow)})
function relayoutAll(){days.value.forEach(d=>{readBody(d);renderBody(d)});if(aiOpen.value)placeAi()}
watch(()=>route.params.projectId,()=>{if(!user.isLoggedIn)return;pid.value=Number(route.params.projectId);days.value=[];load()})
onBeforeUnmount(()=>{Object.values(timers).forEach(t=>clearTimeout(t));clearTimeout(toastTimer)})
</script>

<style scoped>
.editor{height:100%;display:flex}
.work{flex:1;min-width:0;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.t-left{display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap}
.back-m{display:none}.pn{font-weight:700;font-size:15px}
.t-sub{font-size:12px;color:var(--text-2);margin-left:10px}
.t-actions{display:flex;gap:8px;align-items:center}
.tb{padding:5px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:13px;cursor:pointer}
.tb.save.on{background:var(--accent);border-color:var(--accent);color:#fff}
.tb.blue{background:var(--accent);border-color:var(--accent);color:#fff}
.theme-round{width:38px;height:38px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:16px;cursor:pointer;flex-shrink:0;transition:all .2s}
.as-tip{font-size:13px;color:var(--text-2)}
.ver-grp{display:flex;align-items:center;gap:6px}
.vbtn{padding:3px 10px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:12px;cursor:pointer}
.vbtn:not(:disabled):hover{border-color:var(--accent);color:var(--accent)}
.vbtn:disabled{opacity:.45;cursor:default}
.vi-hint{position:relative;display:inline-flex;align-items:center;justify-content:center;width:17px;height:17px;border-radius:50%;border:1px solid var(--border);color:var(--text-2);font-size:10px;font-style:normal;cursor:help;background:var(--bg);margin-left:4px;transform:translateY(1px)}
.vi-q{font-style:normal;line-height:1}
.vi-tip{visibility:hidden;opacity:0;position:absolute;left:50%;top:calc(100% + 8px);transform:translateX(-50%) translateY(-4px);width:230px;padding:8px 10px;border-radius:8px;background:var(--text);color:var(--bg);font-size:12px;line-height:1.6;font-style:normal;text-align:left;z-index:40;transition:opacity .15s,transform .15s,visibility .15s;box-shadow:0 6px 20px rgba(0,0,0,.18)}
.vi-hint:hover .vi-tip,.vi-hint:focus .vi-tip{visibility:visible;opacity:1;transform:translateX(-50%) translateY(0)}
.fmt{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.sr-wrap{position:relative;margin-left:auto;flex:none}
.fmt-search{display:flex;align-items:center;gap:6px;width:220px;max-width:40vw;padding:8px 12px;border-radius:10px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);cursor:text}
.fmt-search:focus-within{border-color:var(--accent)}
.fmt-search svg{flex-shrink:0}
.fmt-search input{flex:1;min-width:0;border:none;background:transparent;color:var(--text);font-size:13px;outline:none}
.fmt-search:focus{border-color:var(--accent)}
.cal-btn{width:38px;height:38px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;transition:all .2s}
.cal-btn:hover{border-color:var(--accent);color:var(--accent)}
.search-pane,.cal-pane{position:absolute;z-index:97;background:var(--surface);border:1px solid var(--border);border-radius:14px;box-shadow:0 18px 50px rgba(0,0,0,.22);overflow:hidden;display:flex;flex-direction:column}
.search-pane{top:calc(100% + 8px);right:0;width:min(300px,60vw)}
.cal-wrap{position:relative;display:inline-flex}
.cal-pane{top:calc(100% + 8px);right:0}
.search-pane{width:min(340px,calc(100vw - 16px));max-height:60vh;overflow-y:auto}
.search-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;border-bottom:1px solid var(--border)}
.search-item:hover{background:var(--surface-2)}
.ss-day{font-size:12px;color:var(--text-2);flex-shrink:0;white-space:nowrap}
.ss-day em{font-style:normal;margin-left:2px}
.ss-text{font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ss-text.ok{color:var(--text-2);text-decoration:line-through}
.search-empty{padding:20px;text-align:center;color:var(--text-2);font-size:13px}
.cal-pane{width:min(196px,calc(100vw - 16px))}
.cal-head{display:flex;align-items:center;justify-content:space-between;padding:6px 8px;border-bottom:1px solid var(--border)}
.cal-title{font-size:12px;font-weight:600}
.cm{width:22px;height:22px;border:none;background:transparent;color:var(--text-2);font-size:13px;cursor:pointer;border-radius:5px}
.cm:hover{background:var(--surface-2)}
.cal-week{display:grid;grid-template-columns:repeat(7,1fr);padding:4px 6px 0}
.cal-week span{text-align:center;font-size:9px;color:var(--text-2)}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;padding:4px 6px 8px}
.cal-d{border:none;border-radius:6px;font-size:10px;color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative;aspect-ratio:1;width:100%}
.cal-d.dim{visibility:hidden}
.cal-d.today{box-shadow:inset 0 0 0 2px var(--accent)}
.cal-d:hover{outline:2px solid var(--accent)}
.fl{background:rgba(10,132,255,.22)!important}
.fsel{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);padding:5px 8px;font-size:13px;outline:none}
.fb{min-width:28px;height:26px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);cursor:pointer;line-height:1;font-weight:600;font-size:13px}
.fb.it{font-style:italic}.fb.u{text-decoration:underline}
.sep{width:1px;height:18px;background:var(--border);margin:0 4px}
.swatch{display:flex;gap:4px;flex-wrap:wrap}.dotc{width:16px;height:16px;border-radius:50%;cursor:pointer;border:1px solid rgba(0,0,0,.12)}
.swatch.hl .dotc{border-radius:4px}
.err{padding:6px 20px;color:var(--red);font-size:13px}
.hint-line{padding:8px 20px;background:var(--glow);color:var(--glow-border);font-size:13px}
.hint-line a{cursor:pointer;text-decoration:underline;margin-right:10px}
.swrap{position:relative;flex:1;min-height:0;display:flex;overflow:hidden}
.scroll{flex:1;min-width:0;overflow-y:auto}
.scroll{scrollbar-width:none}
.scroll::-webkit-scrollbar{display:none}
.docmap{position:absolute;right:12px;top:8px;bottom:8px;width:58px;background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;z-index:6;box-shadow:0 1px 6px rgba(0,0,0,.06)}
.map-mirror{position:absolute;left:0;top:0;transform-origin:0 0;pointer-events:none;opacity:.92;color:inherit}
.map-thumb{position:absolute;left:0;right:0;border-radius:6px;background:rgba(255,255,255,.3);backdrop-filter:blur(6px) saturate(1.6);-webkit-backdrop-filter:blur(6px) saturate(1.6);cursor:ns-resize;pointer-events:auto;border:1px solid rgba(255,255,255,.95);box-shadow:0 0 0 1px rgba(255,255,255,.35),inset 0 0 10px rgba(255,255,255,.45),0 2px 8px rgba(0,0,0,.14);box-sizing:border-box}
.dstat.todo{color:var(--glow-border)}.dstat.ok{color:var(--green)}
.cstat{width:9px;height:9px;border-radius:50%;background:var(--glow-border);display:inline-block}
.cstat.ok{background:var(--green)}
.doc{padding:20px clamp(86px,7vw,116px) 56px clamp(10px,2.5vw,36px)}
.center-card .col-btns{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.col-btns button{width:100%;padding:11px;border-radius:10px;font-size:14px;cursor:pointer;border:none}
.ghost-wide{background:transparent;border:1px solid var(--border);color:var(--text)}
.linkbtn{background:transparent;color:var(--text-2);font-size:13px}
.remind-chk{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);cursor:pointer;user-select:none}
.remind-chk input{width:14px;height:14px;accent-color:var(--accent)}
.day-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.dhead{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;user-select:none}
.dt{font-size:15px;font-weight:600}
.dt em{font-style:normal;color:inherit;font-weight:inherit;font-size:inherit;margin-left:4px}
.dtools{display:flex;align-items:center;gap:10px}
.dstat{font-size:12px;color:var(--text-2)}
.ddot{width:6px;height:6px;border-radius:50%;background:var(--glow-border)}
.del-day{border:none;background:var(--surface-2);color:var(--text-2);width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1}
.del-day:hover{background:var(--red);color:#fff}
.daybody{outline:none;min-height:46px;padding:8px 56px 18px 20px;position:relative}
.day-media{display:flex;align-items:center;gap:8px;padding:8px 20px 10px;border-top:1px solid var(--border)}
.mf-add{display:inline-flex;align-items:center;gap:4px;border:1px dashed var(--border);background:transparent;color:var(--text-2);font-size:12px;padding:4px 10px;border-radius:8px;cursor:pointer;height:26px}
.mf-add:hover{border-color:var(--accent);color:var(--accent)}
.mf-add svg{fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.mf-list{display:flex;flex-wrap:wrap;gap:6px}
.mf-chip{display:inline-flex;align-items:center;gap:5px;max-width:220px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:12px;padding:3px 8px;border-radius:8px;text-decoration:none}
.mf-chip svg{fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.mf-chip:hover{border-color:var(--accent);color:var(--accent)}
.daybody ol{list-style:none;counter-reset:item;margin:0;padding:0}
.daybody ol>li{list-style:none}
.daybody ol>li::marker{content:''}
.daybody ol>li{counter-increment:item;position:relative;padding:9px 56px 9px 1.5em;min-height:1.7em;color:var(--text)}
.daybody ol>li::after{content:'';display:block;clear:both}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:1.4em;text-align:right;padding-right:5px;color:var(--text-2);opacity:.55;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.75}
/* iOS 开关叠加层 */
 .dayph{color:var(--text-2);font-size:14px;padding:12px 4px;cursor:text;opacity:.75}
.rail{position:absolute;right:4px;top:0;width:46px;height:100%;pointer-events:none;z-index:5}
.rail button{pointer-events:auto;position:absolute;left:0;width:44px;height:24px;border-radius:13px;border:1px solid #dcdce0;background:#e8e8ed;cursor:pointer;transition:background .2s;outline:none;display:block}
.rail button::after{content:'';position:absolute;top:50%;transform:translateY(-50%);left:1px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}
.rail button.on{background:var(--accent)}
.rail button.on::after{left:22px}
.card-add-row{display:flex;justify-content:center;padding:8px 0 10px}
.add-card-btn{border:1px dashed var(--border);background:transparent;color:var(--text-2);border-radius:12px;padding:12px 30px;font-size:14px;cursor:pointer}
.add-card-btn:hover{border-color:var(--accent);color:var(--accent)}
.ph{padding:50px 0;color:var(--text-2);text-align:center}

/* AI 小纸：并入格式栏右侧，与右上角主题圆钮同尺寸 */
.fmt-ai{margin-left:6px;flex:none;width:38px;height:38px;border-radius:50%;background:var(--accent);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;cursor:pointer;box-shadow:0 4px 14px rgba(0,122,255,.35);border:none;line-height:1;transition:background .2s,color .2s}
.fmt-ai.open{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:0 4px 14px rgba(0,0,0,.2)}
.fa-tag{font-style:normal;font-size:8px;font-weight:700;background:rgba(255,255,255,.3);border-radius:3px;padding:0 3px;line-height:1.5}
.fmt-ai.open .fa-tag{background:var(--surface-2)}
.fa-name{font-size:11px;font-weight:700;line-height:1}
.fa-x{font-size:17px;line-height:1;font-weight:400}
.ai-dialog{position:fixed;z-index:96;width:min(390px,calc(100vw - 16px));height:min(560px,68vh);background:var(--surface);border:1px solid var(--border);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.28);overflow:hidden;display:flex}

.center-mask{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3);z-index:120;padding:20px}
.center-card{width:340px;background:var(--surface);border-radius:16px;padding:22px;box-shadow:0 18px 60px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:12px}
.center-card.wide{width:480px;max-width:94vw}
.center-card h3{margin:0}
.center-card .tip{color:var(--text-2);font-size:12px;margin:0}
.center-card .row{display:flex;gap:10px}.center-card .row button{flex:1;padding:10px;border-radius:10px;font-size:14px;cursor:pointer}
.vl{max-height:300px;overflow-y:auto;display:flex;flex-direction:column;gap:8px}
.vi{border:1px solid var(--border);border-radius:10px;padding:9px 12px;cursor:pointer;transition:all .15s}
.vi.sel{border-color:var(--accent);background:var(--accent);color:#fff}
.vi.sel .vn{color:#fff}
.vm{display:flex;justify-content:space-between;font-size:12px;color:var(--text-2)}
.vi.sel .vm{color:rgba(255,255,255,.8)}
.vn{font-weight:600}
.vp{font-size:13px;margin-top:5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ve{text-align:center;color:var(--text-2);padding:20px}
.primary{background:var(--accent);color:#fff;border:none}
.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.danger{background:var(--red);color:#fff;border:none}
.uprow{margin:2px 0}.upfile{border:1px solid var(--accent);color:var(--accent);background:transparent;border-radius:8px;padding:6px 12px;font-size:13px;cursor:pointer}
.imp{width:100%;height:150px;resize:vertical;border:1px solid var(--border);border-radius:10px;background:var(--bg);color:var(--text);padding:10px;font-size:13px;outline:none;line-height:1.6}
.toast{position:fixed;left:50%;bottom:44px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 22px;border-radius:22px;font-size:14px;z-index:200}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}
@media(max-width:768px){.back-m{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--border);background:var(--bg);border-radius:50%;font-size:16px;cursor:pointer;color:var(--text);margin-right:6px}.fmt{padding:6px 10px}.doc{padding:12px 8px 150px}.t-sub{display:none}.docmap{display:none} .daybody{padding:8px 40px 16px 14px}.center-card.wide{width:94vw}.ai-dialog{right:8px;bottom:84px;width:calc(100vw - 16px);height:72vh}}
</style>
<style>
/* 运行时注入节点必须用全局样式（scoped 不影响动态元素） */
.daybody{outline:none}
.daybody ol{list-style:none!important;counter-reset:item;margin:0;padding:0}
.daybody ol>li{list-style:none!important;counter-increment:item;position:relative;padding:9px 56px 9px 1.5em;min-height:1.7em;color:var(--text)}
.daybody ol>li::marker{content:''!important}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:1.4em;text-align:right;padding-right:6px;color:var(--text-2);opacity:.6;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.72}
.daybody .rail{position:absolute;right:4px;top:0;width:46px;height:100%;pointer-events:none;z-index:6}
.daybody .rail button{pointer-events:auto;position:absolute;left:0;width:44px;height:24px;border-radius:13px;border:1px solid rgba(0,0,0,.14);background:#e8e8ed;cursor:pointer;transition:background .2s;outline:none}
.daybody .rail button::after{content:'';position:absolute;top:50%;transform:translateY(-50%);left:1px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}
.daybody .rail button.on{background:#007aff}
.daybody .rail button.on::after{left:22px}
.daybody ol>li .li-media{display:flex;flex-wrap:wrap;gap:6px;align-items:center;min-height:0;opacity:1;margin:2px 0 0}
.li-media .thumb{position:relative;display:inline-block}
.li-media .thumb img{height:56px;max-width:220px;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:zoom-in;display:block}
.li-media .thumb .rm{position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-style:normal;font-size:12px;line-height:15px;text-align:center;cursor:pointer;display:none}
.li-media .thumb:hover .rm{display:block}
.li-media .add-im{display:inline-flex;align-items:center;gap:4px;border:1px dashed var(--border);background:transparent;color:var(--text-2);font-size:12px;padding:4px 10px;border-radius:8px;cursor:pointer;height:26px}
.li-media .add-im svg{width:11px;height:11px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
.li-media .add-im:hover{border-color:var(--accent);color:var(--accent)}
</style>
