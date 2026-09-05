<template>
  <div class="projects-page">
    <div class="ph">
      <button class="theme-round" @click="theme.toggle" :title="theme.theme === 'dark' ? '切换到日间' : '切换到暗色'">{{ theme.theme === 'dark' ? '☀' : '☾' }}</button>
      <h1 class="ph-title">{{ user.roleText === '学生' ? '我的学校' : user.roleText === '职场人' ? '我的企业' : '我的项目' }}</h1>
      <p class="ph-sub">选择一个项目，进入写记录</p>
    </div>

    <div v-if="loading" class="empty">加载中…</div>

    <div v-else class="p-list">
      <button v-for="p in projects" :key="p.id" class="p-card" @click="open(p)">
        <div class="p-icon">{{ p.type === 'school' ? '学' : '企' }}</div>
        <div class="p-info">
          <div class="p-name">{{ p.name }}</div>
          <div class="p-meta">{{ p.type === 'school' ? '入学' : '入职' }} {{ p.startDate }}<template v-if="p.logCount"> · {{ p.logCount }} 天</template></div>
        </div>
        <span class="p-arrow">›</span>
      </button>

      <div v-if="!projects.length" class="empty">
        <p>还没有{{ user.roleText === '学生' ? '学校' : '企业' }}</p>
        <p class="hint">点下方按钮新建一个，开始记录</p>
      </div>
    </div>

    <button class="add-card" @click="dialog = true">
      ＋ 新建{{ user.roleText === '学生' ? '学校' : '企业' }}
    </button>

    <div v-if="dialog" class="mask" @click.self="dialog = false">
      <div class="sheet">
        <h3>新建{{ user.roleText === '学生' ? '学校' : '企业' }}</h3>
        <label class="field"><span class="f-label">名称</span>
          <input v-model.trim="form.name" class="f-input" :placeholder="user.roleText === '学生' ? '如：中山大学' : '如：某某科技'" /></label>
        <label class="field"><span class="f-label">{{ user.roleText === '学生' ? '入学日期' : '入职日期' }}</span>
          <input v-model="form.startDate" type="date" class="f-input" /></label>
        <p class="err" v-if="error">{{ error }}</p>
        <div class="btns"><button class="ghost" @click="dialog = false">取消</button>
          <button class="primary" :disabled="!form.name.trim() || !form.startDate" @click="create">创建并进入</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { useThemeStore } from '../stores/theme'
import { projectApi } from '../api/projects'

const router = useRouter()
const user = useUserStore()
const theme = useThemeStore()
const projects = ref([])
const loading = ref(true)
const dialog = ref(false)
const error = ref('')
const form = ref({ name: '', startDate: '' })

const open = p => router.push('/log/' + p.id)
const create = async () => {
  error.value = ''
  try {
    const res = await projectApi.create({ name: form.value.name.trim(), startDate: form.value.startDate })
    const id = res?.id || res?.project?.id
    dialog.value = false
    form.value = { name: '', startDate: '' }
    router.push('/log/' + id)
  } catch (e) { error.value = e?.error || '创建失败' }
}
onMounted(async () => {
  loading.value = true
  try { const res = await projectApi.list(); projects.value = Array.isArray(res) ? res : (res.projects || []) }
  catch { projects.value = [] }
  loading.value = false
})
</script>

<style scoped>
.projects-page { padding: 26px 30px 50px; max-width: 1000px; position: relative; }
.theme-round { position: absolute; top: 20px; right: 30px; width: 40px; height: 40px; border-radius: 50%; border: 1px solid var(--border); background: var(--surface); color: var(--text); font-size: 17px; cursor: pointer; transition: all .2s; }
.ph-title { font-size: 24px; font-weight: 700; padding-right: 60px; }
.ph-sub { color: var(--text-2); font-size: 14px; margin: 4px 0 22px; }
.p-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.p-card { display: flex; align-items: center; gap: 14px; padding: 18px; border-radius: 12px; border: 1px solid var(--border); background: var(--surface); cursor: pointer; text-align: left; transition: transform .15s, box-shadow .15s; }
.p-card:hover { transform: translateY(-2px); box-shadow: var(--shadow); }
.p-icon { width: 46px; height: 46px; border-radius: 12px; background: var(--accent); color: #fff; font-size: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.p-info { flex: 1; min-width: 0; }
.p-name { font-size: 17px; font-weight: 600; }
.p-meta { font-size: 13px; color: var(--text-2); margin-top: 3px; }
.p-arrow { font-size: 22px; color: var(--text-2); }
.add-card { width: 100%; margin-top: 18px; padding: 15px; border-radius: 12px; border: 2px dashed var(--border); background: transparent; color: var(--text-2); font-size: 15px; cursor: pointer; }
.add-card:hover { border-color: var(--accent); color: var(--accent); }
.empty { text-align: center; color: var(--text-2); padding: 50px 0 10px; }
.hint { font-size: 13px; margin-top: 6px; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.4); display: flex; align-items: flex-end; justify-content: center; z-index: 100; }
.sheet { width: 100%; max-width: 560px; background: var(--surface); border-radius: 20px 20px 0 0; padding: 22px 20px 26px; display: flex; flex-direction: column; gap: 14px; }
.sheet h3 { text-align: center; }
.field { display: flex; flex-direction: column; gap: 6px; }
.f-label { font-size: 13px; color: var(--text-2); }
.f-input { padding: 13px 14px; border-radius: 10px; border: 1px solid var(--border); background: var(--bg); color: var(--text); font-size: 15px; outline: none; }
.btns { display: flex; gap: 10px; }
.btns button { flex: 1; padding: 13px; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; }
.ghost { background: transparent; border: 1px solid var(--border); color: var(--text); }
.primary { background: var(--accent); border: none; color: #fff; }
.primary:disabled { opacity: .5; }
.err { color: var(--red); font-size: 13px; text-align: center; }
</style>
