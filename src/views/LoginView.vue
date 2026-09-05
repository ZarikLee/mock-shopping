<template>
  <div class="auth-screen">
    <button class="theme-btn" @click="theme.toggle" :title="theme.theme === 'dark' ? '切换到日间' : '切换到暗色'">
      {{ theme.theme === 'dark' ? '☀' : '☾' }}
    </button>

    <div class="auth-card">
      <div class="logo-mark">
        <svg viewBox="0 0 48 48" width="34" height="34" aria-hidden="true">
          <rect x="13" y="10" width="16" height="26" rx="2" fill="#fff"/>
          <g stroke="#9ecbff" stroke-width="1.6" stroke-linecap="round"><path d="M16.5 16h9"/><path d="M16.5 21h9"/><path d="M16.5 26h5.5"/></g>
          <path d="M26 33 L40 19" stroke="#ffd60a" stroke-width="5" stroke-linecap="round"/>
          <path d="M35.6 23.4 L40 19" stroke="#2a2a2a" stroke-width="4.6" stroke-linecap="round"/>
        </svg>
      </div>
      <h1 class="title">纸上 - Paper Todo</h1>
      <p class="subtitle">像写日记一样，记录每天的 todo</p>

      <div class="tabs">
        <span class="tab-slide" :class="mode"></span>
        <button :class="['tab', { active: mode === 'login' }]" @click="switchMode('login')">登录</button>
        <button :class="['tab', { active: mode === 'register' }]" @click="switchMode('register')">注册</button>
      </div>

      <form @submit.prevent="submit" class="form">
        <label class="field">
          <span class="f-label">账号</span>
          <input v-model.trim="form.account" class="f-input" placeholder="输入账号" autocomplete="username" />
        </label>
        <label v-if="mode === 'register'" class="field">
          <span class="f-label">昵称</span>
          <input v-model.trim="form.nickname" class="f-input" placeholder="怎么称呼你" />
        </label>
        <label class="field">
          <span class="f-label">密码</span>
          <input v-model="form.password" type="password" class="f-input" placeholder="输入密码" autocomplete="current-password" />
        </label>
        <label class="agree">
          <input type="checkbox" v-model="consent" />
          <span class="ag-text">我已阅读并同意<a class="ag-link" @click.prevent="ppOpen = true">《纸上用户隐私协议》</a></span>
        </label>
        <button class="submit-btn" :disabled="loading" :class="{ loading }">
          {{ mode === 'login' ? '登录' : '注册' }}
        </button>
      </form>
      <p class="err" v-if="error">{{ error }}</p>
    </div>

    <!-- 用户隐私协议 -->
    <transition name="fade">
      <div v-if="ppOpen" class="pp-mask" @click.self="ppOpen = false">
        <div class="pp-card">
          <h3>纸上 · 用户隐私协议</h3>
          <div class="pp-body">
            <p>欢迎使用「纸上 · Paper Todo」（以下简称"本服务"）。我们深知个人信息对你的重要性，并承诺按照本协议所述方式，合法、正当、必要地收集和使用你的信息。请在使用前仔细阅读本协议，当你勾选"我已阅读并同意"即视为你已充分理解并接受全部条款。</p>
            <p class="clause">第一条 适用范围</p>
            <p>本协议适用于你通过网页端访问和使用本服务时，我们所进行的全部信息处理活动，包括注册、登录、日常任务记录、数据同步、AI 智能助手交互及相关增值功能。</p>
            <p class="clause">第二条 我们收集的信息</p>
            <p>为向你提供本服务，我们仅收集实现服务功能所必需的信息，包括：（1）注册信息：账号、昵称及你自行设置的密码；（2）身份与项目信息：你所填写的身份类型（学生／职场人）及项目名称；（3）内容数据：你在服务内创建、编辑和保存的任务记录及其完成状态；（4）设备基础信息：用于保障服务安全的浏览器类型与网络访问日志。</p>
            <p class="clause">第三条 信息的使用</p>
            <p>我们收集的信息将仅用于以下目的：（1）实现账号登录与身份识别；（2）提供任务记录的新建、编辑、自动保存与回顾功能；（3）在你明确发起会话时，为 AI 助手生成回复所需的内容分析与总结；（4）改进产品体验、排查故障与保障账户安全。除上述用途外，我们不会将你的个人信息用于与提供本服务无关的用途。</p>
            <p class="clause">第四条 信息的共享与披露</p>
            <p>我们不会出售、出租或向任何无关第三方提供你的个人信息。为实现 AI 智能助手功能，在你主动发起对话时，相应的记录内容将传输至经严格评估的大语言模型服务商（如 DeepSeek）用于生成即时回复，该等传输仅以完成本次对话为限。除以下情形外，我们不会对外披露你的信息：（1）获得你的明确同意；（2）依照法律法规、监管要求或司法机关、行政机关的强制性要求；（3）为维护国家安全、社会公共利益或你的合法权益所合理必需。</p>
            <p class="clause">第五条 信息的存储与保护</p>
            <p>你的数据将通过安全加密的方式传输，并存储于采用行业标准安全防护措施的服务器中。我们建立了访问控制、加密存储、日志审计等管理措施，以防止信息被未经授权地访问、篡改或泄露。但请你理解，任何互联网传输或存储方式均无法保证百分之百的安全。</p>
            <p class="clause">第六条 你的权利</p>
            <p>你享有以下权利：（1）访问权：随时查看你名下已保存的任务记录；（2）更正权：修改昵称、身份等个人资料；（3）删除权：删除任意日期的记录，删除后不可恢复；（4）注销权：可随时停止使用本服务；如需注销账号，可通过页面反馈渠道联系我们处理。你可以自主决定是否继续使用本服务，你的选择不会影响你依法享有的其他权利。</p>
            <p class="clause">第七条 未成年人保护</p>
            <p>本服务面向具有完全民事行为能力的用户。若你为未成年人，应在监护人陪同并同意本协议的前提下使用本服务，监护人应对未成年人的使用行为承担相应责任。</p>
            <p class="clause">第八条 协议变更</p>
            <p>我们可能根据法律法规及产品发展需要适时修订本协议。修订后的协议将在本页面公布，并自公布之日起生效。若你在协议修订后继续使用本服务，即视为接受修订后的协议；重大变更我们将通过显著方式另行提示。</p>
            <p class="clause">第九条 联系我们</p>
            <p>如你对本协议或个人信息保护有任何疑问、意见或建议，可通过"设置 — 建议反馈"渠道与我们联系，我们将在收到反馈后尽快予以答复。</p>
            <p class="date">生效日期：本协议自你首次使用本服务之日起生效。</p>
          </div>
          <button class="pp-ok" @click="consent = true; ppOpen = false">我已阅读并同意</button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()

const mode = ref('login')
const loading = ref(false)
const error = ref('')
const consent = ref(false)
const ppOpen = ref(false)
const form = reactive({ account: '', nickname: '', password: '' })

const switchMode = m => { mode.value = m; error.value = '' }

const submit = async () => {
  error.value = ''
  if (!form.account || !form.password) { error.value = '请输入账号和密码'; return }
  if (!consent.value) { error.value = '请先阅读并勾选同意《纸上用户隐私协议》'; return }
  loading.value = true
  try {
    const u = mode.value === 'login'
      ? await user.login(form.account, form.password)
      : await user.register(form.account, form.password, form.nickname || form.account)
    router.push(u.role ? '/projects' : '/onboarding')
  } catch (e) {
    error.value = e?.error || (mode.value === 'login' ? '登录失败' : '注册失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-screen { min-height: 100vh; display: flex; align-items: center; justify-content: center; position: relative; padding: 20px; }
.theme-btn { position: fixed; top: 18px; right: 18px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 18px; cursor: pointer; transition: all .2s; }
.auth-card { width: 100%; max-width: 360px; text-align: center; }
.logo-mark { width: 64px; height: 64px; margin: 0 auto 16px; border-radius: 16px; background: var(--accent); color: #fff; font-size: 30px; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 24px rgba(0,122,255,.3); }
.title { font-size: 23px; font-weight: 700; letter-spacing: .5px; }
.subtitle { color: var(--text-2); font-size: 14px; margin: 6px 0 30px; }
.tabs { position: relative; display: flex; background: var(--surface-2); border-radius: 10px; padding: 4px; margin-bottom: 24px; }
.tab-slide { position: absolute; top: 4px; left: 4px; width: calc(50% - 4px); height: calc(100% - 8px); background: var(--accent); border-radius: 8px; transition: transform .25s ease; }
.tab-slide.register { transform: translateX(100%); }
.tab { position: relative; flex: 1; padding: 10px; border: none; background: transparent; color: var(--text-2); font-size: 14px; border-radius: 8px; cursor: pointer; transition: color .2s; z-index: 1; }
.tab.active { color: #fff; font-weight: 600; }
.form { text-align: left; display: flex; flex-direction: column; gap: 16px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 15px; outline: none; transition: border .2s; }
.f-input:focus { border-color: var(--accent); }
.agree { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: var(--text-2); line-height: 1.5; cursor: pointer; user-select: none; }
.agree input { margin-top: 2px; accent-color: var(--accent); width: 14px; height: 14px; flex-shrink: 0; }
.ag-link { color: var(--accent); cursor: pointer; text-decoration: none; }
.submit-btn { margin-top: 6px; padding: 14px; border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: opacity .2s; }
.submit-btn:hover { opacity: .9; }
.submit-btn.loading { opacity: .6; }
.err { color: var(--red); font-size: 13px; margin-top: 12px; text-align: center; }
.pp-mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 200; display: flex; align-items: center; justify-content: center; padding: 20px; }
.pp-card { width: 100%; max-width: 600px; max-height: 82vh; background: var(--surface); border-radius: 16px; padding: 22px 24px 20px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 20px 60px rgba(0,0,0,.3); }
.pp-card h3 { margin: 0; font-size: 17px; }
.pp-body { overflow-y: auto; padding-right: 8px; font-size: 13px; line-height: 1.75; color: var(--text); }
.pp-body p { margin: 0 0 10px; text-align: justify; }
.pp-body .clause { font-weight: 600; margin: 8px 0 4px; color: var(--text); }
.pp-body .date { color: var(--text-2); margin-top: 8px; }
.pp-ok { padding: 12px; border: none; border-radius: 10px; background: var(--accent); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
.fade-enter-active,.fade-leave-active{transition:opacity .2s}.fade-enter-from,.fade-leave-to{opacity:0}
</style>
