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
          <button class="tb blue" @click="importOpen = true">导入历史</button>
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
      </div>

      <div v-if="loadError" class="err">{{ loadError }}</div>
      
      <div class="scroll">
        <div class="docmap" v-if="days.length > 1">
          <button v-for="(d,i) in days" :key="'m' + d.date" class="map-slot"
            :class="mapCls(d)" :title="dayLabel(d.date) + ' · ' + doneOf(d) + '/' + (d.items.length||0)" @click="jumpDay(i)"></button>
        </div>
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
          </section>

          <div v-if="!loading && !days.length" class="ph"><p>还没有记录。</p></div>

          <div class="card-add-row">
            <button class="add-card-btn" @click="addNextDay">＋ 新增明天 · 提前安排</button>
          </div>
        </div>
      </div>
    </div>

    <button class="ai-ball" :class="{ open: aiOpen }" @click="aiOpen = !aiOpen">
      <template v-if="!aiOpen"><i class="bl-tag">AI</i><span class="bl-name">小纸</span></template><span v-else class="bl-x">×</span>
    </button>
    <transition name="fade">
      <div v-show="aiOpen" class="ai-dialog"><AiPanel :project-id="pid" @close="aiOpen = false" /></div>
    </transition>

    <!-- 导入历史 -->
    <div v-if="importOpen" class="center-mask">
      <div class="center-card wide">
        <h3>导入历史记录</h3>
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
        <div class="center-card">
          <h3>有几条任务还没完成哦</h3>
          <p class="tip">你在过去的 {{ pastPendingCount }} 个日子里还有 {{ pastPendingTotal }} 条任务未勾选完成。</p>
          <p class="tip">可以选择一次性把它们都标为完成，或把未完成的搬到今天继续跟进：</p>
          <div class="col-btns">
            <button class="primary" @click="markAllPastDone">全部标为完成</button>
            <button class="ghost-wide" @click="movePastToToday">把未完成搬到今天</button>
            <button class="linkbtn" @click="closeRemind">暂不处理</button>
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
const scrollEl=ref(null)
const showRemind=ref(false)
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
function jumpDay(i){const d=days.value[i];if(!d||!scrollEl.value)return
  const el=document.querySelector(`.daybody[data-date="${d.date}"]`)?.closest('.day-card');if(!el)return
  const sr=scrollEl.value.getBoundingClientRect();const top=scrollEl.value.scrollTop+(el.getBoundingClientRect().top-sr.top)-12
  scrollEl.value.scrollTo({top:Math.max(0,top),behavior:'smooth'})}
function pastUnfinished(){const arr=days.value.filter(d=>d.date<tNow&&(d.items||[]).some(i=>!i.done))
  return {list:arr,total:arr.reduce((n,d)=>n+d.items.filter(i=>!i.done).length,0),count:arr.length}}
function ensureToday(){let today=findDay(tNow);if(!today){today=norm({date:tNow,weekday:wk(tNow),items:[]});days.value.push(today)}
  days.value.sort((x,y)=>x.date<y.date?-1:1);renderBody(today);return today}
function saveDays(arr){return Promise.all(arr.map(d=>projectApi.commit(pid.value,d.date,{weekday:d.weekday,items:d.items}).then(()=>{d._dirty=false;d._last=snapDay(d)}).catch(()=>{})))}
async function maybeRemind(){if(localStorage.getItem('dl_rem_'+pid.value)===tNow)return
  const u=pastUnfinished();if(!u.total)return
  pastPendingTotal.value=u.total;pastPendingCount.value=u.count;showRemind.value=true}
function closeRemind(){showRemind.value=false;localStorage.setItem('dl_rem_'+pid.value,tNow)}
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
const norm=l=>({date:l.date,weekday:l.weekday||wk(l.date),items:(l.items||[]).map(i=>({text:(i.text||'').replace(/^[。.]$/,'').trim(),done:!!i.done})),_dirty:false,_last:null})
const findDay=date=>days.value.find(d=>d.date===date)
const snapDay=day=>day.items.map(i=>[i.text,i.done])
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)

function renderBody(day){nextTick(()=>{
  const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const ol=document.createElement('ol')
  day.items.forEach(it=>{const li=document.createElement('li');if(it.done)li.classList.add('done');li.appendChild(document.createTextNode(it.text||''));ol.appendChild(li)})
  if(!ol.children.length){const li=document.createElement('li');ol.appendChild(li)}
  el.innerHTML='';el.appendChild(ol)
  layout(day)
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
  const lis=[...el.querySelectorAll(':scope ol > li')];day.items=lis.map(li=>({text:li.textContent.replace(/\u00a0/g,'').trim(),done:li.classList.contains('done')}))}
function onInput(day){readBody(day);requestAnimationFrame(()=>layout(day));const key=snapDay(day)
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
  showToast('已删除，无法恢复')}
function focusLi(day,idx){nextTick(()=>{const el=document.querySelector(`.daybody[data-date="${day.date}"]`);const lis=el?.querySelectorAll('ol>li');const d=lis&&lis[idx!=null?idx:0];if(!d)return
  d.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(d);r.collapse(false);s.removeAllRanges();s.addRange(r)})}
function addNextDay(){const last=days.value.reduce((m,d)=>d.date>m?d.date:m,'');let base=last?last:tNow
  if(base<tNow)base=tNow
  const nd=new Date(base+'T00:00:00');nd.setDate(nd.getDate()+1);const date=dstr(nd)
  pushSnap('新增 '+dayLabel(date))
  let day=findDay(date);if(!day){day=norm({date,weekday:wk(date),items:[]});days.value.push(day)}
  renderBody(day);onInput(day);focusLi(day,0);document.querySelector('.daybody[data-date="'+date+'"]')?.scrollIntoView({behavior:'smooth',block:'center'})}
function showToast(m){toast.value=m;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2000)}
function clearAllTimers(){Object.values(timers).forEach(t=>clearTimeout(t))}
function curSnap(){days.value.forEach(readBody);return snapAll()}
function snapAll(){return days.value.map(d=>({date:d.date,items:cleanItems(d.items).map(i=>({text:i.text,done:!!i.done}))}))}
function pushSnap(tag){undoStack.value.push({tag,data:curSnap()});if(undoStack.value.length>40)undoStack.value.shift();redoStack.value=[]}
async function persistDoc(list){for(const d of list){d._dirty=false;d._last=snapDay(d);await projectApi.commit(pid.value,d.date,{weekday:d.weekday,items:d.items}).catch(()=>{})}}
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
    requestAnimationFrame(()=>{days.value.forEach(renderBody);maybeRemind()})
  }catch(e){loadError.value=e?.error||'加载失败'}
  loading.value=false}
function cleanItems(a){return a.map(i=>({text:(i.text||'').replace(/^\s*[。.。]\s*$/,'').trim(),done:!!i.done})).filter(i=>i.text!=='')}
async function autosave(day){readBody(day);day.items=cleanItems(day.items);try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items});day._dirty=false;day._last=snapDay(day);lastSaved.value=nowStamp()}catch{}}
async function saveDraft(day){try{await projectApi.draft(pid.value,day.date,{weekday:day.weekday,items:day.items})}catch{}}
async function saveAll(){saving.value=true
  for(const day of days.value){if(!day._dirty)continue;readBody(day)
    try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items});day._last=snapDay(day);day._dirty=false;lastSaved.value=nowStamp()}catch(e){loadError.value=e?.error||'保存失败'}}
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
function relayoutAll(){days.value.forEach(d=>{readBody(d);renderBody(d)})}
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
.theme-round{width:40px;height:40px;border-radius:50%;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:17px;cursor:pointer;flex-shrink:0;transition:all .2s}
.as-tip{font-size:13px;color:var(--text-2)}
.ver-grp{display:flex;gap:6px}
.vbtn{padding:3px 10px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:12px;cursor:pointer}
.vbtn:not(:disabled):hover{border-color:var(--accent);color:var(--accent)}
.vbtn:disabled{opacity:.45;cursor:default}
.vi-hint{position:relative;display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;border:1px solid var(--border);color:var(--text-2);font-size:10px;font-style:normal;cursor:help;background:var(--bg)}
.vi-q{font-style:normal;line-height:1}
.vi-tip{visibility:hidden;opacity:0;position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%) translateY(4px);width:230px;padding:8px 10px;border-radius:8px;background:var(--text);color:var(--bg);font-size:12px;line-height:1.6;font-style:normal;text-align:left;z-index:30;transition:opacity .15s,transform .15s,visibility .15s;box-shadow:0 6px 20px rgba(0,0,0,.18)}
.vi-hint:hover .vi-tip,.vi-hint:focus .vi-tip{visibility:visible;opacity:1;transform:translateX(-50%) translateY(0)}
.fmt{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.fsel{border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);padding:5px 8px;font-size:13px;outline:none}
.fb{min-width:28px;height:26px;border:1px solid var(--border);border-radius:8px;background:var(--bg);color:var(--text);cursor:pointer;line-height:1;font-weight:600;font-size:13px}
.fb.it{font-style:italic}.fb.u{text-decoration:underline}
.sep{width:1px;height:18px;background:var(--border);margin:0 4px}
.swatch{display:flex;gap:4px;flex-wrap:wrap}.dotc{width:16px;height:16px;border-radius:50%;cursor:pointer;border:1px solid rgba(0,0,0,.12)}
.swatch.hl .dotc{border-radius:4px}
.err{padding:6px 20px;color:var(--red);font-size:13px}
.hint-line{padding:8px 20px;background:var(--glow);color:var(--glow-border);font-size:13px}
.hint-line a{cursor:pointer;text-decoration:underline;margin-right:10px}
.scroll{flex:1;overflow-y:auto;position:relative}
.docmap{position:absolute;right:4px;top:10px;bottom:14px;width:8px;display:flex;flex-direction:column;gap:2px;z-index:5;opacity:.85}
.map-slot{flex:1;min-height:3px;border:none;border-radius:3px;cursor:pointer;padding:0;background:var(--surface-2);transition:background .2s}
.map-slot.ok{background:var(--green)}.map-slot.todo{background:var(--glow-border)}.map-slot.none{background:var(--surface-2)}
.map-slot:hover{box-shadow:0 0 0 1px var(--text-2)}
.dstat.todo{color:var(--glow-border)}.dstat.ok{color:var(--green)}
.cstat{width:9px;height:9px;border-radius:50%;background:var(--glow-border);display:inline-block}
.cstat.ok{background:var(--green)}
.doc{padding:20px clamp(26px,4vw,52px) 200px}
.center-card .col-btns{display:flex;flex-direction:column;gap:8px;margin-top:6px}
.col-btns button{width:100%;padding:11px;border-radius:10px;font-size:14px;cursor:pointer;border:none}
.ghost-wide{background:transparent;border:1px solid var(--border);color:var(--text)}
.linkbtn{background:transparent;color:var(--text-2);font-size:13px}

.day-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;margin-bottom:14px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.dhead{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;user-select:none}
.dt{font-size:15px;font-weight:600}
.dt em{font-style:normal;color:inherit;font-weight:inherit;font-size:inherit;margin-left:4px}
.dtools{display:flex;align-items:center;gap:10px}
.dstat{font-size:12px;color:var(--text-2)}
.ddot{width:6px;height:6px;border-radius:50%;background:var(--glow-border)}
.del-day{border:none;background:var(--surface-2);color:var(--text-2);width:22px;height:22px;border-radius:50%;cursor:pointer;font-size:14px;line-height:1}
.del-day:hover{background:var(--red);color:#fff}
.daybody{outline:none;min-height:46px;padding:8px 56px 18px;position:relative}
.daybody ol{list-style:none;counter-reset:item;margin:0;padding:0}
.daybody ol>li{list-style:none}
.daybody ol>li::marker{content:''}
.daybody ol>li{counter-increment:item;position:relative;padding:9px 56px 9px 1.8em;min-height:1.7em;color:var(--text)}
.daybody ol>li::after{content:'';display:block;clear:both}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:1.5em;text-align:right;padding-right:5px;color:var(--text-2);opacity:.55;font-size:.92em}
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

/* AI 小纸（悬浮、可拖、吸附） */
.ai-ball{position:fixed;right:20px;bottom:32px;z-index:95;width:58px;height:58px;border-radius:50%;background:var(--accent);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,122,255,.45);line-height:1.15;border:none}
.ai-ball.open{background:var(--surface);color:var(--text);border:1px solid var(--border);box-shadow:0 8px 24px rgba(0,0,0,.28)}
.bl-name{font-size:13px;font-weight:700;line-height:1}
.bl-tag{font-style:normal;font-size:9px;font-weight:700;background:rgba(255,255,255,.28);border-radius:4px;padding:0 4px;line-height:1.5}
.bl-x{font-size:22px;line-height:1;font-weight:400}
.ai-ball{gap:3px}
.ai-dialog{position:fixed;right:20px;bottom:96px;z-index:96;width:min(420px,94vw);height:min(620px,72vh);background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.25);overflow:hidden;display:flex}

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
@media(max-width:768px){.back-m{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--border);background:var(--bg);border-radius:50%;font-size:16px;cursor:pointer;color:var(--text);margin-right:6px}.fmt{padding:6px 10px}.doc{padding:12px 8px 150px}.t-sub{display:none}.docmap{display:none}.daybody{padding:8px 40px 16px}.center-card.wide{width:94vw}.ai-dialog{right:8px;bottom:84px;width:calc(100vw - 16px);height:72vh}}
</style>
<style>
/* 运行时注入节点必须用全局样式（scoped 不影响动态元素） */
.daybody{outline:none}
.daybody ol{list-style:none!important;counter-reset:item;margin:0;padding:0}
.daybody ol>li{list-style:none!important;counter-increment:item;position:relative;padding:9px 56px 9px 1.8em;min-height:1.7em;color:var(--text)}
.daybody ol>li::marker{content:''!important}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:1.6em;text-align:right;padding-right:6px;color:var(--text-2);opacity:.6;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.72}
.daybody .rail{position:absolute;right:4px;top:0;width:46px;height:100%;pointer-events:none;z-index:6}
.daybody .rail button{pointer-events:auto;position:absolute;left:0;width:44px;height:24px;border-radius:13px;border:1px solid rgba(0,0,0,.14);background:#e8e8ed;cursor:pointer;transition:background .2s;outline:none}
.daybody .rail button::after{content:'';position:absolute;top:50%;transform:translateY(-50%);left:1px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}
.daybody .rail button.on{background:#007aff}
.daybody .rail button.on::after{left:22px}
</style>
