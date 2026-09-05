<template>
  <div class="editor">
    <!-- 左侧书写区 -->
    <div class="work">
      <div class="top">
        <div class="t-name"><button class="back-m" @click="router.push('/projects')">‹</button>
          <span class="pn">{{ projectName }}</span><span class="t-sub">{{ projectSub }}</span></div>
        <div class="t-actions">
          <button class="tb" @click="openVersions">版本</button>
          <button class="tb save" :class="{ on: hasDirty }" @click="saveAll">{{ hasDirty ? '保存修改' : '已保存' }}</button>
        </div>
      </div>

      <div class="fmt">
        <select class="fsel" v-model="prefs.font" @change="applyPrefs" title="字体">
          <option value="-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif">系统</option>
          <option value="'Songti SC','SimSun',serif">宋体</option>
          <option value="'Times New Roman',serif">Times</option>
          <option value="ui-monospace,Menlo,Consolas,monospace">等宽</option>
        </select>
        <select class="fsel" v-model.number="prefs.size" @change="applyPrefs" title="字号">
          <option v-for="s in sizes" :key="s" :value="s">{{ s }}</option>
        </select>
        <select class="fsel" v-model.number="prefs.lh" @change="applyPrefs" title="行距">
          <option :value="1.2">1.2</option><option :value="1.4">1.4</option><option :value="1.6">1.6</option>
          <option :value="1.8">1.8</option><option :value="2">2.0</option><option :value="2.2">2.2</option>
        </select>
        <span class="sep"></span>
        <button class="fb" @mousedown.prevent="cmd('bold')">B</button>
        <button class="fb it" @mousedown.prevent="cmd('italic')">I</button>
        <button class="fb u" @mousedown.prevent="cmd('underline')">U</button>
        <span class="sep"></span>
        <div class="swatch"><template v-for="c in colors" :key="c"><i class="dotc" :style="{background:c}" @mousedown.prevent="cmd('foreColor',c)"></i></template></div>
        <div class="swatch hl"><template v-for="c in hl" :key="c"><i class="dotc" :style="{background:c}" @mousedown.prevent="cmd('hiliteColor',c)"></i></template></div>
      </div>

      <div v-if="loadError" class="err">{{ loadError }}</div>
      <div v-if="unsavedPrompt" class="hint-line">有未提交修改 — <a @click="saveAll">保存为版本</a> · <a @click="discardAll">放弃</a></div>

      <div class="scroll">
        <div class="doc" :style="{ fontFamily: prefs.font, fontSize: prefs.size + 'px', lineHeight: prefs.lh }">
          <section v-for="day in days" :key="day.date" class="day-card">
            <div class="dhead">
              <span class="dt">{{ dayLabel(day.date) }} <em>{{ day.weekday }}</em></span>
              <span class="dtools">
                <span v-if="day.items.length" class="dstat">{{ doneOf(day) }}/{{ day.items.length }}</span>
                <span v-if="day._dirty" class="ddot"></span>
                <span class="mini" @click="markCurrentDone(day)" title="标记光标所在行完成">✓</span>
                <button class="plus-t" @click="addLine(day)">＋</button>
              </span>
            </div>
            <div class="daybody" contenteditable="true" spellcheck="false" :data-date="day.date"
              @input="e => onInput(day, e)" @keydown="e => onKey(e, day)"></div>
          </section>
          <div v-if="!loading && !days.length" class="ph">
            <p>还没有记录。</p>
            <button class="plus-big" @click="addTodayDay">＋ 开始记录今天</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧 AI 搭子（悬浮卡片，不占布局） -->
    <button class="ai-fab" :class="{ open: aiOpen }" @click="aiOpen = !aiOpen">
      {{ aiOpen ? '×' : 'AI' }}
    </button>
    <transition name="fade">
      <div v-if="aiOpen" class="ai-dialog">
        <AiPanel :key="'p' + pid" :project-id="pid" @close="aiOpen = false" />
      </div>
    </transition>

    <div v-if="showVersions" class="mask" @click.self="showVersions = false">
      <div class="vs"><h3>版本记录</h3>
        <div class="vl" v-if="versions.length"><div v-for="(v,i) in versions" :key="i" class="vi">
          <div class="vm"><span class="vn">v{{ v.version }}</span><span>{{ fmtTime(v.createdAt) }}</span></div>
          <div class="vp">{{ preview(v.items) }}</div>
          <button class="ghost" @click="rollback(v)">回退到此处</button></div></div>
        <div v-else class="ve">暂无版本</div>
        <button class="primary full" @click="showVersions = false">关闭</button></div>
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
const unsavedPrompt=ref(false);const versions=ref([]);const showVersions=ref(false)
const toast=ref('');let toastTimer=null;const timers={}
const isSmall=ref(window.innerWidth<=1080);const aiOpen=ref(false)
const onResize=()=>{isSmall.value=window.innerWidth<=1080}
const sizes=[12,13,14,15,16,18,20,22,24,28,32]
const colors=['#1d1d1f','#ff3b30','#ff9500','#ffcc00','#34c759','#0a84ff','#af52de','#ffffff']
const hl=['#ffe08a','#b1ff9e','#9ecbff','#ffd1d1','#e0d0ff','transparent']
function lp(){try{return JSON.parse(localStorage.getItem('dl_prefs')||'null')}catch{return null}}
const prefs=reactive(lp()||{font:"-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif",size:16,lh:1.6})
function applyPrefs(){localStorage.setItem('dl_prefs',JSON.stringify(prefs))}

const WEEKS=['周日','周一','周二','周三','周四','周五','周六']
const pad=n=>String(n).padStart(2,'0')
const nowD=new Date();const tNow=`${nowD.getFullYear()}-${pad(nowD.getMonth()+1)}-${pad(nowD.getDate())}`
const isToday=d=>d===tNow
const doneOf=day=>(day.items||[]).filter(i=>i.done).length
const dayLabel=d=>{const p=d.split('-');return `${p[0]}年${+p[1]}月${+p[2]}日`}
const wk=d=>WEEKS[new Date(d+'T00:00:00').getDay()]
const fmtTime=t=>{if(!t)return'';const d=new Date(t);return `${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`}
const hasDirty=computed(()=>days.value.some(d=>d._dirty))
const norm=l=>({date:l.date,weekday:l.weekday||wk(l.date),items:(l.items||[]).map(i=>({text:i.text||'',done:!!i.done})),_dirty:false,_last:null})
const findDay=date=>days.value.find(d=>d.date===date)
const snapDay=day=>day.items.map(i=>[i.text,i.done])
const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b)

function renderBody(day){nextTick(()=>{
  const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const ol=document.createElement('ol');const arr=day.items.length?day.items:[{text:'',done:false}]
  arr.forEach(it=>{
    const li=document.createElement('li');if(it.done)li.classList.add('done')
    li.appendChild(document.createTextNode(it.text||''))
    const dot=document.createElement('button');dot.type='button';dot.setAttribute('contenteditable','false')
    dot.className='line-dot'+(it.done?' on':'')
    dot.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();const idx=[...ol.children].indexOf(li)
      if(idx<0)return;day.items[idx]=day.items[idx]||{text:li.textContent||'',done:false}
      day.items[idx].done=!day.items[idx].done
      li.classList.toggle('done',day.items[idx].done);dot.classList.toggle('on',day.items[idx].done)
      readBody(day);onInput(day)}
    li.appendChild(dot);ol.appendChild(li)
  })
  el.innerHTML='';el.appendChild(ol)
})}
function readBody(day){
  const el=document.querySelector(`.daybody[data-date="${day.date}"]`);if(!el)return
  const lis=el.querySelectorAll(':scope ol > li');const arr=[]
  lis.forEach(li=>arr.push({text:li.textContent.replace(/\u00a0/g,''),done:li.classList.contains('done')}))
  day.items=arr
  if(lis.length===0){const ol=el.querySelector('ol')||el.appendChild(document.createElement('ol'));ol.appendChild(document.createElement('li'));day.items=[{text:'',done:false}]}
}
function onInput(day){readBody(day);const key=snapDay(day)
  if(!day._last||!same(day._last,key)){day._dirty=true;unsavedPrompt.value=false;clearTimeout(timers[day.date]);timers[day.date]=setTimeout(()=>saveDraft(day),600);day._last=key}}
function onKey(){}
function addLine(day){const el=document.querySelector(`.daybody[data-date="${day.date}"]`)
  day.items.push({text:'',done:false});renderBody(day);onInput(day)
  nextTick(()=>{const lis=el?.querySelectorAll('ol>li');const d=lis&&lis[lis.length-1]
    if(d){d.focus();const s=window.getSelection();const r=document.createRange();r.selectNodeContents(d);r.collapse(false);s.removeAllRanges();s.addRange(r)}})}
function addTodayDay(){let day=findDay(tNow);if(!day){day=norm({date:tNow,weekday:wk(tNow),items:[]});days.value.push(day)}renderBody(day);addLine(day)
  document.querySelector('.daybody[data-date="'+tNow+'"]')?.scrollIntoView({behavior:'smooth',block:'center'})}
function markCurrentDone(day){const el=document.querySelector(`.daybody[data-date="${day.date}"]`);const sel=window.getSelection()
  if(!el||!sel||!sel.anchorNode){showToast('先把光标放在某一行');return}
  let node=sel.anchorNode;if(node.nodeType===3)node=node.parentElement
  while(node&&node!==el&&node.tagName!=='LI')node=node.parentElement
  if(!node||node.tagName!=='LI'){showToast('先把光标放在某一行');return}
  const i=[...node.parentElement.children].indexOf(node);if(i<0)return
  day.items[i]=day.items[i]||{text:node.textContent||'',done:false};day.items[i].done=!day.items[i].done
  node.classList.toggle('done',day.items[i].done);readBody(day);onInput(day)}
function showToast(m){toast.value=m;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.value='',1800)}

async function load(){loading.value=true;loadError.value=''
  try{const list=await projectApi.list();const arr=Array.isArray(list)?list:(list.projects||[])
    const p=arr.find(x=>x.id===pid.value);projectName.value=p?.name||'项目';projectSub.value=p?(p.type==='school'?'入学':'入职')+' '+p.startDate:''
    const logs=await projectApi.logs(pid.value,{full:1});const logArr=Array.isArray(logs)?logs:(logs.logs||[])
    days.value=logArr.map(norm);days.value.forEach(d=>{d._last=snapDay(d)})
    if(days.value.length){const last=days.value[days.value.length-1]
      try{const info=await projectApi.log(pid.value,last.date);if(info.dayLog&&info.lastVersion&&!same(snapDay(last),info.lastVersion.items.map(i=>[i.text||'',!!i.done])))unsavedPrompt.value=true}catch{}}
    days.value.forEach(renderBody)
  }catch(e){loadError.value=e?.error||'加载失败'}
  loading.value=false}
async function saveDraft(day){try{await projectApi.draft(pid.value,day.date,{weekday:day.weekday,items:day.items})}catch{}}
async function saveAll(){saving.value=true
  for(const day of days.value){if(!day._dirty)continue;readBody(day)
    try{await projectApi.commit(pid.value,day.date,{weekday:day.weekday,items:day.items});day._last=snapDay(day);day._dirty=false}catch(e){loadError.value=e?.error||'保存失败'}}
  unsavedPrompt.value=false;saving.value=false;showToast('已保存')}
async function discardAll(){unsavedPrompt.value=false
  for(const day of days.value){if(!day._dirty)continue;let arr=[]
    try{const info=await projectApi.log(pid.value,day.date);arr=(info.lastVersion?info.lastVersion.items:[]).map(i=>({text:i.text||'',done:!!i.done}))}catch{}
    day.items=arr;day._dirty=false;day._last=snapDay(day);renderBody(day)}showToast('已放弃修改')}
async function openVersions(){const day=days.value[days.value.length-1];if(!day)return;showVersions.value=true
  try{versions.value=await projectApi.versions(pid.value,day.date)}catch{versions.value=[]}}
async function rollback(v){const day=days.value[days.value.length-1];if(!day)return
  try{await projectApi.rollback(pid.value,day.date,v.id!=null?v.id:v.version)
    day.items=(v.items||[]).map(i=>({text:i.text||'',done:!!i.done}));day._dirty=false;day._last=snapDay(day);renderBody(day);showVersions.value=false;showToast('已回退 v'+v.version)}catch(e){loadError.value=e?.error||'回退失败'}}
const preview=items=>(items||[]).slice(0,3).map(i=>(i.done?'✓ ':'· ')+(i.text||'')).join('　')+((items||[]).length>3?'…':'')
function cmd(c,val){try{document.execCommand(c,false,val)}catch{}}

onMounted(()=>{if(!user.isLoggedIn){router.push('/login');return}load();window.addEventListener('resize',onResize)})
watch(()=>route.params.projectId,()=>{if(!user.isLoggedIn)return;pid.value=Number(route.params.projectId);days.value=[];load()})
onBeforeUnmount(()=>{Object.values(timers).forEach(t=>clearTimeout(t));clearTimeout(toastTimer);window.removeEventListener('resize',onResize)})
</script>

<style scoped>
.editor{height:100%;display:flex}
.work{flex:1;min-width:0;display:flex;flex-direction:column}
.top{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
.back-m{display:none}.pn{font-weight:700;font-size:15px}
.t-sub{font-size:12px;color:var(--text-2);margin-left:10px}
.t-actions{display:flex;gap:8px}
.tb{padding:5px 12px;border-radius:7px;border:1px solid var(--border);background:var(--bg);color:var(--text-2);font-size:13px;cursor:pointer;transition:all .2s}
.tb.save.on{background:var(--accent);border-color:var(--accent);color:#fff}
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
.doc{padding:20px clamp(14px,4vw,52px) 180px}

.day-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;margin-bottom:16px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.03)}
.dhead{display:flex;align-items:center;justify-content:space-between;padding:12px 20px;user-select:none}
.dt{font-size:15px;font-weight:600;color:var(--text)}
.dt em{font-style:normal;color:var(--text-2);font-weight:400;font-size:12px;margin-left:8px}
.dtools{display:flex;align-items:center;gap:10px}
.dstat{font-size:12px;color:var(--text-2)}
.ddot{width:6px;height:6px;border-radius:50%;background:var(--glow-border)}
.mini{border:1px solid var(--border);background:var(--bg);color:var(--text-2);border-radius:6px;padding:2px 8px;font-size:11px;cursor:pointer}
.mini:hover{color:var(--green);border-color:var(--green)}
.plus-t{border:none;background:transparent;color:var(--accent);font-size:16px;cursor:pointer;line-height:1}

.daybody{outline:none;min-height:46px;padding:10px 40px 18px}
.daybody ol{list-style:none;counter-reset:item;margin:0;padding:0}
.daybody ol>li{counter-increment:item;position:relative;padding:6px 52px 6px 2.4em;min-height:1.7em;border-radius:6px;color:var(--text)}
.daybody ol>li::before{content:counter(item);position:absolute;left:0;top:6px;width:1.6em;text-align:right;padding-right:8px;color:var(--text-2);font-variant-numeric:tabular-nums;opacity:.6;font-size:.92em}
.daybody ol>li.done{text-decoration:line-through;color:var(--text-2);opacity:.75}
.line-dot{float:right;margin-top:6px;width:15px;height:15px;border-radius:50%;border:2px solid var(--red);background:transparent;cursor:pointer;flex:none}
.line-dot.on{border-color:var(--green);background:var(--green)}
.line-dot:hover{opacity:.85}

.ph{padding:50px 0;color:var(--text-2);text-align:center}
.plus-big{margin-top:12px;padding:11px 24px;border:none;border-radius:22px;background:var(--accent);color:#fff;cursor:pointer;font-size:14px;box-shadow:0 6px 16px rgba(0,122,255,.28)}

/* AI 悬浮气泡窗口 */
.ai-fab{position:fixed;right:22px;bottom:26px;z-index:95;min-width:52px;height:52px;border-radius:26px;border:none;background:var(--accent);color:#fff;font-size:16px;font-weight:700;cursor:pointer;box-shadow:0 10px 28px rgba(0,122,255,.4);padding:0 18px}
.ai-fab.open{background:var(--text);box-shadow:var(--shadow)}
.ai-dialog{position:fixed;right:22px;bottom:92px;z-index:96;width:min(420px,94vw);height:min(620px,78vh);background:var(--surface);border:1px solid var(--border);border-radius:18px;box-shadow:0 18px 60px rgba(0,0,0,.25);overflow:hidden;display:flex;flex-direction:column}

.mask{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:flex-end;justify-content:center;z-index:90}
.vs{width:100%;max-width:560px;background:var(--surface);border-radius:20px 20px 0 0;padding:22px 20px 26px}
.vs h3{margin-bottom:14px}.vl{max-height:50vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.vi{border:1px solid var(--border);border-radius:10px;padding:10px 12px}
.vm{display:flex;justify-content:space-between;font-size:12px;color:var(--text-2)}.vn{color:var(--accent);font-weight:600}
.vp{font-size:13px;margin:6px 0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ve{text-align:center;color:var(--text-2);padding:20px}
.primary{background:var(--accent);color:#fff;border:none}.ghost{background:transparent;border:1px solid var(--border);color:var(--text)}
.primary.full{width:100%;padding:13px;border-radius:10px;font-size:15px;cursor:pointer;margin-top:4px}
.toast{position:fixed;left:50%;bottom:40px;transform:translateX(-50%);background:var(--text);color:var(--bg);padding:10px 20px;border-radius:22px;font-size:14px;z-index:120}
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}

@media(max-width:768px){.back-m{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border:1px solid var(--border);background:var(--bg);border-radius:50%;font-size:16px;cursor:pointer;color:var(--text);margin-right:6px}.fmt{padding:6px 10px}.doc{padding:12px 8px 130px}.t-sub{display:none}.ai-dialog{right:10px;bottom:80px;width:calc(100vw - 20px);height:76vh}.ai-fab{right:14px}}
</style>
