<template>
  <div class="guide">
    <header class="top">
      <a class="brand" href="/"><img src="/papertodo_logo.png?v=2" alt="纸上" /><span>纸上 · Paper Todo</span></a>
      <nav>
        <a class="lnk" @click="go('/')">首页</a>
        <a class="lnk" @click="go('/faq')">常见问题</a>
        <span class="cur">用户手册</span>
      </nav>
      <button class="start" @click="go('/login')">开始使用</button>
    </header>

    <div class="layout">
      <aside class="toc">
        <div class="toc-title">目录</div>
        <div v-for="g in tree" :key="g.k" class="toc-grp">
          <div class="toc-g">{{ g.t }}</div>
          <a v-for="c in g.ch" :key="c.id" class="toc-i" :class="{ on: active === c.id }" @click="jump(c.id)">{{ c.t }}</a>
        </div>
      </aside>

      <main class="doc-body">
        <section v-for="g in tree" :key="g.k" class="chapter">
          <h2 class="ch-t" :id="'sec-' + g.k">{{ g.t }}</h2>
          <div v-for="c in g.ch" :key="c.id" class="article" :id="c.id">
            <h3>{{ c.t }}</h3>
            <div v-if="c.p" class="p" v-for="(pp, i) in c.p" :key="i">{{ pp }}</div>
            <ol v-if="c.steps"><li v-for="(s, i) in c.steps" :key="i">{{ s }}</li></ol>
            <ul v-if="c.tips" class="tips"><li v-for="(s, i) in c.tips" :key="'t' + i">💡 {{ s }}</li></ul>
          </div>
        </section>
      </main>
    </div>

    <footer class="foot">纸上 · Paper Todo © 2026</footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const go = p => router.push(p)
const active = ref('')
const tree = [
  {
    k: 'start', t: '开始使用',
    ch: [
      { id: 'reg', t: '注册与登录', steps: ['用手机号注册：输入手机号 → 获取验证码 → 填 6 位验证码与密码', '登录用手机号 + 密码；忘记密码点「忘记密码」用验证码重置', '首次进入先选身份（学生/职场人）并填写用户名', '同意《用户隐私协议》后即可使用'] },
      { id: 'project', t: '创建与管理项目', p: ['学校/公司或生活都可作为一个“项目”，每个项目独立保存记录与文件。'], steps: ['登录后在左侧点「＋ 新建项目」或在顶部“当前项目”下拉底部新建', '填写名称与开始日期（入学/入职等）', '用下拉框切换项目；左侧页签切换「每日待办 / 云文件管理 / 回顾与成就」'] },
    ],
  },
  {
    k: 'daily', t: '每日待办',
    ch: [
      { id: 'write', t: '写任务', steps: ['点「＋ 新增记录」新建日期，从今天或之后任选', '直接在卡片里打字，回车自动续写下一项', '字体、字号、行距与颜色都可在顶部格式栏调整', '「已自动保存」显示最近保存时间，输入即自动保存'] },
      { id: 'done', t: '完成与删除', steps: ['点任务右侧开关标记完成（iOS 式滑动开关）', '第 1 行永远保留：文字删光也只会留一个可写的 1. 空行', '删除某天：点卡片右上角 ×，二次确认后不可恢复', '顶栏「上一版本/下一版本」可撤销最近操作'] },
      { id: 'nav', t: '快速定位', p: ['右侧是代码编辑器风格的缩略图：绿色/橙色区分完成与未完，拖动或点击可跳到对应日期。'], steps: ['顶栏日历按钮可看月历热力（完成度深浅）', '顶栏搜索框可全文搜任务或按日期搜索', '点卡片底部“＋ 图片/附件”给任务配图、给当天挂文件'] },
    ],
  },
  {
    k: 'files', t: '图片与云文件',
    ch: [
      { id: 'media', t: '任务图片与当天文件', steps: ['鼠标移到某任务下方点「图片」传图，缩略图统一尺寸、可放大与删除', '卡片底部「附件」可传任意文件并在线预览/下载', '点击右上角消息/日历等面板会自动收起其它面板'] },
      { id: 'cloud', t: '云文件管理', steps: ['左侧「云文件管理」查看该项目全部图片与附件', '支持「全部 / 图片 / 附件」筛选，选择日期后上传', '悬停图片/文件右上角 × 可删除', '容量默认 100MB，可用积分在右上角「扩容」永久增加'] },
    ],
  },
  {
    k: 'ai', t: 'AI 小纸',
    ch: [
      { id: 'chat', t: '使用 AI', steps: ['点格式栏右侧的小纸圆钮打开对话', '直接说需求：如“帮我写周报”“总结这周”“统计进度”“规划明天”', '功能类请求会整段成稿输出；闲聊也会保留上下文', 'AI 免费 30 次/天，超出每次扣 1 积分；悬停次数可看说明'] },
    ],
  },
  {
    k: 'review', t: '回顾与成就',
    ch: [
      { id: 'review2', t: '回顾', steps: ['进入「回顾与成就」，查看记录天数、任务、全完成天数与连续记录', '切「本月/上月/今年」点“生成回顾”得到带鼓励的总结'] },
      { id: 'achieve', t: '成就徽章', steps: ['完成并坚持会自动解锁徽章（连续天数/满分日/任务数量等）', '新解锁会有高亮提示，数据越多成就越多'] },
    ],
  },
  {
    k: 'points', t: '积分与导出',
    ch: [
      { id: 'pts', t: '积分规则', steps: ['每日登录 +10、当天完成任务 +5（各一次/天）', '删除当天记录会扣回任务奖励，防刷分', '积分用途：云盘永久扩容（1 积分=+1MB）、AI 超额按次扣 1 分', '点侧栏积分可查看收支明细'] },
      { id: 'import', t: '导入', steps: ['「导入任务」粘贴文本或上传 txt/md', '每行以日期开头即识别为一天，任务自动去重合并', '导入后可用「上一版本」撤销'] },
      { id: 'export', t: '导出记录', steps: ['点「导出记录」，可选日期范围', '导出为 txt 文本（已完成带 ✓）', '建议定期导出留底'] },
    ],
  },
  {
    k: 'settings', t: '设置与账号',
    ch: [
      { id: 'profile', t: '个人资料', steps: ['「设置 → 个人信息」修改昵称与身份', '账号为注册手机号，不可修改'] },
      { id: 'feedback2', t: '反馈与通知', steps: ['「设置 → 建议反馈」提交建议，可多次提交', '管理员回复后，右上角铃铛出现红点并可“一键已读”', '点页面空白可收起弹出的面板'] },
    ],
  },
]
function jump(id) {
  active.value = id
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function onScroll() {
  let cur = ''
  document.querySelectorAll('.article').forEach(el => { if (el.getBoundingClientRect().top <= 90) cur = el.id })
  if (cur) active.value = cur
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))
</script>

<style scoped>
.guide { min-height: 100vh; background: var(--bg); color: var(--text); }
.top { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 18px; padding: 12px 22px; max-width: 1200px; margin: 0 auto; backdrop-filter: blur(12px); background: color-mix(in srgb, var(--bg) 72%, transparent); border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 9px; font-weight: 700; text-decoration: none; color: var(--text); }
.brand img { width: 28px; height: 28px; border-radius: 8px; }
.top nav { display: flex; gap: 14px; flex: 1; justify-content: center; font-size: 14px; }
.lnk { color: var(--text-2); cursor: pointer; }
.lnk:hover { color: var(--text); }
.cur { color: var(--accent); font-weight: 600; }
.start { border: none; border-radius: 9px; background: var(--accent); color: #fff; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.layout { display: flex; max-width: 1200px; margin: 0 auto; }
.toc { width: 230px; flex-shrink: 0; padding: 28px 16px 60px; position: sticky; top: 62px; align-self: flex-start; max-height: calc(100vh - 80px); overflow-y: auto; }
.toc-title { font-size: 12px; color: var(--text-2); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
.toc-g { font-size: 12px; color: var(--text-2); margin: 12px 0 4px; }
.toc-i { display: block; padding: 5px 9px; border-radius: 7px; color: var(--text); font-size: 13px; cursor: pointer; }
.toc-i:hover { background: var(--surface-2); }
.toc-i.on { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
.doc-body { flex: 1; min-width: 0; padding: 30px 26px 90px; }
.chapter { margin-bottom: 34px; }
.ch-t { font-size: 22px; margin: 0 0 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border); }
.article { margin: 18px 0 26px; scroll-margin-top: 76px; }
.article h3 { font-size: 16px; margin: 0 0 10px; }
.p { font-size: 14px; color: var(--text); line-height: 1.8; margin: 6px 0; }
.article ol { margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 6px; }
.article li { font-size: 14px; color: var(--text-2); line-height: 1.7; }
.tips { margin: 8px 0 0; padding-left: 0; list-style: none; }
.tips li { color: var(--text-2); font-size: 13px; line-height: 1.6; }
.foot { text-align: center; color: var(--text-2); font-size: 13px; padding: 10px 20px 40px; }
@media (max-width: 820px) { .toc { display: none; } .top { flex-wrap: wrap; } .top nav { font-size: 13px; gap: 10px; } }
</style>
