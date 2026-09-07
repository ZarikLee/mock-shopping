<template>
  <div class="doc">
    <header class="top">
      <a class="brand" href="/"><img src="/papertodo_logo.png?v=2" alt="纸上" /><span>纸上 · Paper Todo</span></a>
      <nav>
        <a class="lnk" @click="go('/')">首页</a>
        <span class="cur">常见问题</span>
        <a class="lnk" @click="go('/guide')">用户手册</a>
      </nav>
      <button class="start" @click="go('/login')">开始使用</button>
    </header>

    <main class="wrap">
      <h1>常见问题</h1>
      <p class="sub">关于收费、容量、积分、数据与使用的一切，全部展开可直接查看。</p>
      <section v-for="(g, gi) in groups" :key="gi" class="grp">
        <h2>{{ g.t }}</h2>
        <div v-for="f in g.items" :key="f.q" class="qa">
          <h3>{{ f.q }}</h3>
          <p>{{ f.a }}</p>
        </div>
      </section>
    </main>

    <footer class="foot">纸上 · Paper Todo © 2026 · <a @click="go('/')">返回官网</a></footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
const go = p => router.push(p)
const groups = [
  {
    t: '关于产品',
    items: [
      { q: '纸上是什么？', a: '一款以“日子”为单位的每日记录工具：把待办写成日志，自动保存、可回看、能统计，并用 AI 帮你产出周报、月度与年度回顾。' },
      { q: '收费吗？', a: '当前为全民公测，基础使用免费。云盘有默认容量、AI 有每日免费次数；正式商业化前会提前公告，积分制用于资源的公平分配。' },
      { q: '可以自己在哪些设备用？', a: '电脑与手机的浏览器都能直接使用，无需安装；建议移动端把页面“添加到主屏幕”。' },
    ],
  },
  {
    t: '容量 / AI / 积分',
    items: [
      { q: '云盘容量是多少？不够怎么办？', a: '默认 100MB。可以用积分永久扩容：1 积分 = +1MB，路径在“云文件管理”右上角「扩容」。' },
      { q: 'AI 每天能聊多少次？', a: '每天免费 30 次；超过后每问一次消耗 1 积分。次数与积分会实时显示在对话顶部。' },
      { q: '积分怎么获得？', a: '每日登录 +10；当天有完成任务 +5（登录与任务奖励每天各一次，删除当天记录会扣回以防刷分）。可在侧栏点击积分查看明细。' },
    ],
  },
  {
    t: '数据与隐私',
    items: [
      { q: '数据存在哪里、安全吗？', a: '数据存储在云端 PostgreSQL 数据库，连接加密。建议定期用「导出记录」备份为 txt 留底。' },
      { q: '我不想用了，怎么删数据？', a: '可逐日删除记录、删除整个项目；如需彻底注销账号请联系管理员处理（设置→建议反馈）。' },
      { q: '会上传我的记录去训练 AI 吗？', a: '不会用于训练。AI 仅在明确发起对话时为生成回复而读取该项目的近期记录，不对外留存传播。' },
    ],
  },
  {
    t: '使用技巧',
    items: [
      { q: '怎么把微信/备忘录的旧记录导入？', a: '把文本贴进「导入任务」或选择文件：每行以日期开头即被识别为一天，任务自动去重合并；导入后可点“上一版本”撤销。' },
      { q: '不小心删了记录还能找回吗？', a: '顶栏的「上一版本 / 下一版本」可以回到操作前；但彻底删除某天后数据不可恢复，请谨慎。' },
      { q: '遇到 bug 或想要新功能？', a: '到「设置 → 建议反馈」提交，管理员会逐条回复，并通过右上角消息铃铛提醒你。' },
    ],
  },
]
</script>

<style scoped>
.doc { min-height: 100vh; background: var(--bg); color: var(--text); }
.top { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 18px; padding: 12px 22px; max-width: 1080px; margin: 0 auto; backdrop-filter: blur(12px); background: color-mix(in srgb, var(--bg) 70%, transparent); border-bottom: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: 9px; font-weight: 700; text-decoration: none; color: var(--text); }
.brand img { width: 28px; height: 28px; border-radius: 8px; }
.top nav { display: flex; gap: 14px; flex: 1; justify-content: center; font-size: 14px; }
.lnk { color: var(--text-2); cursor: pointer; text-decoration: none; }
.lnk:hover { color: var(--text); }
.cur { color: var(--accent); font-weight: 600; }
.start { border: none; border-radius: 9px; background: var(--accent); color: #fff; padding: 8px 16px; font-size: 14px; cursor: pointer; }
.wrap { max-width: 800px; margin: 0 auto; padding: 40px 22px 80px; }
.wrap h1 { font-size: 30px; margin: 0 0 8px; }
.sub { color: var(--text-2); margin: 0 0 26px; }
.grp { margin-bottom: 28px; }
.grp h2 { font-size: 18px; border-left: 4px solid var(--accent); padding-left: 10px; margin: 0 0 12px; }
.qa { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 14px 16px; margin-bottom: 10px; }
.qa h3 { font-size: 14px; margin: 0 0 6px; }
.qa p { font-size: 13px; color: var(--text-2); line-height: 1.7; margin: 0; }
.foot { text-align: center; color: var(--text-2); font-size: 13px; padding: 30px 20px 50px; }
.foot a { color: var(--accent); cursor: pointer; }
@media (max-width: 720px) { .top nav { gap: 10px; font-size: 13px; } .top { flex-wrap: wrap; } }
</style>
