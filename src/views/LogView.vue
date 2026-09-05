<template>
  <div class="editor">
    <div class="work">
      <div class="top">
        <div class="t-name"><button class="back-m" @click="router.push('/projects')">‹</button>
          <span class="pn">{{ projectName }}</span><span class="t-sub">{{ projectSub }}</span></div>
        <div class="t-actions">
          <button class="tb blue" @click="importOpen = true">导入历史</button>
          <span class="as-tip" :class="{ on: hasDirty }">{{ status }}</span>
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
        <div class="doc" :style="{ fontFamily: prefs.font, fontSize: prefs.size + 'px', lineHeight: prefs.lh }">
          <section v-for="day in days" :key="day.date" class="day-card">
            <div class="dhead">
              <span class="dt">{{ dayLabel(day.date) }}<em> {{ day.weekday }}</em></span>
              <span class="dtools">
                <span v-if="day.items.length" class="dstat">{{ doneOf(day) }}/{{ day.items.length }}</span>
                <span v-if="day._dirty" class="ddot"></span>
                <button v-if="day.date > tNow" class="del-day" @click="removeFutureDay(day)" title="删除这天的计划">×</button>
              </span>
            </div>
            <div class="daybody" contenteditable="true" spellcheck="false" :data-date="day.date"
              @input="e => onInput(day)" @keydown="e => onKey(e, day)"></div>
          </section>

          <div v-if="!loading && !days.length" class="ph"><p>还没有记录。</p></div>

          <div class="card-add-row">
            <button class="add-card-btn" @click="addNextDay">＋ 新增明天 · 提前安排</button>
          </div>
        </div>
      </div>
    </div>

    <button class="ai-ball" :class="{ open: aiOpen }" @click="aiOpen = !aiOpen">
      <span class="bl-name">{{ aiOpen ? '×' : '小纸' }}</span><i class="bl-tag">AI</i>
    </button>
    <transition name="fade"><div v-if="aiOpen" class="ai-dialog"><AiPanel :key="'p' + pid" :project-id="pid" @close="aiOpen = false" /></div></transition>

    <!-- 导入历史 -->
    <div v-if="importOpen" class="center-mask">
      <div class="center-card wide">
        <h3>导入历史记录</h3>
        <p class="tip">支持 txt / Markdown。每行开头是日期即开新一天，其余行是该天任务；任务前加 [x]/✔ 视为已完成。</p>
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
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { projectApi } from '../api/projects'
import AiPanel from '../components/AiPanel.vue'

const route=useRoute();const router=useRouter();const user=useUserStore()
const pid=ref(Number(route.params.projectId))
const loading=ref(true);const loadError=ref('')
const projectName=ref('…');const projectSub=ref('')
const days=ref([]);const saving=ref(false)
const unsavedPrompt=ref(false)
const status=ref('已自动保存')
const versions=ref([]);const showVersions=ref(false);const selVersion=ref(null);const confirmRollback=ref(false)
const importOpen=ref(false);const importText=ref('');const parsed=ref([]);const importPreview=ref('')
const aiOpen=ref(false)

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
function compact(day){const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const lis=[...el.querySelectorAll(':scope ol > li')];let changed=false
  // 删除空行，但始终保留末尾一个用于继续输入
  lis.forEach(li=>{if(!li.textContent.trim()){li.remove();changed=true}})
  if(changed)readBody(day)}
function onInput(day){readBody(day);compact(day);requestAnimationFrame(()=>layout(day));const key=snapDay(day)
  if(!day._last||!same(day._last,key)){day._dirty=true;unsavedPrompt.value=false;clearTimeout(timers[day.date]);timers[day.date]=setTimeout(()=>autosave(day),900);day._last=key}}
function onKey(e,day){
  if((e.key==='Backspace'||e.key==='Delete') && day.items.length===1 && !day.items[0].text.trim()){ e.preventDefault(); return }
  if(e.key==='Backspace'||e.key==='Delete'){
    setTimeout(()=>{ readBody(day); compact(day); const k=snapDay(day)
      if(!day._last||!same(day._last,k)){ day._dirty=true; unsavedPrompt.value=false; clearTimeout(timers[day.date]); timers[day.date]=setTimeout(()=>autosave(day),900); day._last=k } },0)
  }
}
function removeFutureDay(day){
  const i=days.value.findIndex(d=>d.date===day.date);if(i<0)return
  days.value.splice(i,1)
  projectApi.removeDay(pid.value,day.date).catch(()=>{})
  showToast('已删除这天的计划')
}
function focusLi(day,idx){nextTick(()=>{const el=document.querySelector(`.daybody[data-date="${day.date}"]`);const lis=el?.querySelectorAll('ol>li');const d=lis&&lis[idx!=null?idx:0];if(!d)return
  d.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(d);r.collapse(false);s.removeAllRanges();s.addRange(r)})}
function addNextDay(){const last=days.value.reduce((m,d)=>d.date>m?d.date:m,'');let base=last?last:tNow
  if(base<tNow)base=tNow
  const nd=new Date(base+'T00:00:00');nd.setDate(nd.getDate()+1);const date=dstr(nd)
  let day=findDay(date);if(!day){day=norm({date,weekday:wk(date),items:[]});days.value.push(day)}
  renderBody(day);onInput(day);focusLi(day,0);document.querySelector('.daybody[data-date="'+date+'"]')?.scrollIntoView({behavior:'smooth',block:'center'})}
function showToast(m){toast.value=m;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',2000)}

async function load(){loading.value=true;loadError.value=''
  try{const list=await projectApi.list();const arr=Array.isArray(list)?list:(list.projects||[])
    const p=arr.find(x=>x.id===pid.value);projectName.value=p?.name||'项目';projectSub.value=p?(p.type==='school'?'入学':'入职')+' '+p.startDate:''
    const logs=await projectApi.logs(pid.value,{full:1});const logArr=Array.isArray(logs)?logs:(logs.logs||[])
    days.value=logArr.map(norm);days.value.forEach(d=>{d._last=snapDay(d)})
    if(days.value.length){const last=days.value[days.value.length-1]
      try{const info=await projectApi.log(pid.value,last.date);if(info.dayLog&&info.lastVersion&&!same(snapDay(last),info.lastVersion.items.map(i=>[i.text||'',!!i.done])))unsavedPrompt.value=true}catch{}}
    days.value.forEach(renderBody)
    requestAnimationFrame(()=>{days.value.forEach(renderBody)})
  }catch(e){loadError.value=e?.error||'加载失败'}
  loading.value=false}
async function autosave(day){readBody(day);try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items});day._dirty=false;day._last=snapDay(day);status.value='已保存'}catch{}}
async function saveDraft(day){try{await projectApi.draft(pid.value,day.date,{weekday:day.weekday,items:day.items})}catch{}}
async function saveAll(){saving.value=true
  for(const day of days.value){if(!day._dirty)continue;readBody(day)
    try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items});day._last=snapDay(day);day._dirty=false}catch(e){loadError.value=e?.error||'保存失败'}}
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
function normDate(y,m,d){return `${y}-${pad(+m)}-${pad(+d)}`}
function parseLineDate(line){let m=line.match(/^\s*(\d{4})[年.\/-](\d{1,2})[月.\/-](\d{1,2})日?/);if(m)return normDate(m[1],m[2],m[3])
  m=line.match(/^\s*(\d{1,2})[月.\/-](\d{1,2})日?/);if(m){const n=new Date();let mm=+m[1],dd=+m[2];let yy=n.getFullYear();let base=new Date(yy,mm-1,dd);if(base>n)base=new Date(yy-1,mm-1,dd);return dstr(base)}
  return null}
function isDoneLine(t){return /^[✓✔×x]|[\[（(]\s*(x|√|✓|完成)\s*[\]）)]|完成\s*$/.test(t)}
function parseImport(text){const map=new Map();let cur=null
  const lines=text.split(/\r?\n/)
  for(const raw of lines){const line=raw.replace(/^\s*([-*•\d]+\.?)\s*/,'')
    const dl=parseLineDate(line);if(dl){if(!map.has(dl))map.set(dl,{date:dl,weekday:wk(dl),items:[]});cur=map.get(dl);continue}
    if(!cur){const d=tNow;if(!map.has(d)){map.set(d,{date:d,weekday:wk(d),items:[]})}cur=map.get(d)}
    const t=line.trim();if(!t)continue
    const done=isDoneLine(t);const clean=t.replace(/^[✓✔×x]\s*|[\[（(]\s*(x|√|✓|完成)\s*[\]）)]\s*|\s*完成\s*$/,'').trim()
    if(clean)cur.items.push({text:clean,done})}
  return [...map.values()].sort((a,b)=>a.date<b.date?-1:1)}
function previewImport(){parsed.value=parseImport(importText.value)
  importPreview.value=parsed.value.length?`解析到 ${parsed.value.length} 天，共 ${parsed.value.reduce((s,d)=>s+d.items.length,0)} 条任务`:'未识别到内容'}
function onFile(e){const f=e.target.files&&e.target.files[0];e.target.value='';if(!f)return;const r=new FileReader();r.onload=ev=>{importText.value=String(ev.target.result||'');previewImport()};r.readAsText(f)}
async function doImport(){if(!parsed.value.length)return
  let ok=0
  for(const d of parsed.value){try{await projectApi.commit(pid.value,d.date,{weekday:d.weekday,items:d.items});ok++}catch{}}
  importOpen.value=false;importText.value='';parsed.value=[];importPreview.value=''
  showToast('已导入 '+ok+' 天');load()}
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
.top{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.back-m{display:none}.pn{font-weight:700;font-size:15px}
.t-sub{font-size:12px;color:var(--text-2);margin-left:10px}
.t-actions{display:flex;gap:8px}
.tb{padding:5px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:13px;cursor:pointer}
.tb.save.on{background:var(--accent);border-color:var(--accent);color:#fff}
.tb.blue{background:var(--accent);border-color:var(--accent);color:#fff}
.as-tip{font-size:13px;color:var(--text-2)}
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
.scroll{flex:1;overflow-y:auto}
.doc{padding:20px clamp(14px,4vw,52px) 200px}
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
.daybody ol>li{counter-increment:item;position:relative;padding:9px 56px 9px 2.2em;min-height:1.7em;color:var(--text)}
.daybody ol>li::after{content:'';display:block;clear:both}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:1.6em;text-align:right;padding-right:8px;color:var(--text-2);opacity:.55;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.75}
/* iOS 开关叠加层 */
 .dayph{color:var(--text-2);font-size:14px;padding:12px 4px;cursor:text;opacity:.75}
.rail{position:absolute;right:4px;top:0;width:46px;height:100%;pointer-events:none;z-index:5}
.rail button{pointer-events:auto;position:absolute;left:0;width:44px;height:24px;border-radius:13px;border:1px solid #dcdce0;background:#e8e8ed;cursor:pointer;transition:background .2s;outline:none;display:block}
.rail button::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}
.rail button.on{background:var(--accent)}
.rail button.on::after{left:18px}
.card-add-row{display:flex;justify-content:center;padding:8px 0 10px}
.add-card-btn{border:1px dashed var(--border);background:transparent;color:var(--text-2);border-radius:12px;padding:12px 30px;font-size:14px;cursor:pointer}
.add-card-btn:hover{border-color:var(--accent);color:var(--accent)}
.ph{padding:50px 0;color:var(--text-2);text-align:center}

/* AI 小纸（悬浮、可拖、吸附） */
.ai-ball{position:fixed;right:20px;bottom:32px;z-index:95;width:58px;height:58px;border-radius:50%;background:var(--accent);color:#fff;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;box-shadow:0 8px 24px rgba(0,122,255,.45);line-height:1.15;border:none}
.ai-ball.open{background:var(--text)}
.bl-name{font-size:14px;font-weight:700;line-height:1}
.bl-tag{font-style:normal;font-size:9px;font-weight:700;background:rgba(255,255,255,.25);border-radius:4px;padding:0 4px;line-height:1.4}
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
@media(max-width:768px){.back-m{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--border);background:var(--bg);border-radius:50%;font-size:16px;cursor:pointer;color:var(--text);margin-right:6px}.fmt{padding:6px 10px}.doc{padding:12px 8px 150px}.t-sub{display:none}.daybody{padding:8px 40px 16px}.center-card.wide{width:94vw}.ai-dialog{right:8px;bottom:84px;width:calc(100vw - 16px);height:72vh}}
</style>
<style>
/* 运行时注入节点必须用全局样式（scoped 不影响动态元素） */
.daybody{outline:none}
.daybody ol{list-style:none!important;counter-reset:item;margin:0;padding:0}
.daybody ol>li{list-style:none!important;counter-increment:item;position:relative;padding:9px 56px 9px 2.4em;min-height:1.7em;color:var(--text)}
.daybody ol>li::marker{content:''!important}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:9px;width:2em;text-align:right;padding-right:8px;color:var(--text-2);opacity:.6;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.72}
.daybody .rail{position:absolute;right:4px;top:0;width:46px;height:100%;pointer-events:none;z-index:6}
.daybody .rail button{pointer-events:auto;position:absolute;left:0;width:42px;height:24px;border-radius:13px;border:1px solid rgba(0,0,0,.12);background:#e8e8ed;cursor:pointer;transition:background .2s;outline:none}
.daybody .rail button::after{content:'';position:absolute;top:2px;left:2px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.25);transition:left .2s}
.daybody .rail button.on{background:#007aff}
.daybody .rail button.on::after{left:20px}
</style>
