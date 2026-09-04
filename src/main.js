import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './styles/global.css'

const app = createApp(App)

// 全局错误兜底：显示错误而不是黑屏
app.config.errorHandler = (err, _instance, info) => {
  console.error('[vue]', err, info)
  let div = document.getElementById('err-overlay')
  if (!div) {
    div = document.createElement('div')
    div.id = 'err-overlay'
    div.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#ff3b30;color:#fff;padding:14px 18px;font:13px/1.5 system-ui;white-space:pre-wrap;max-height:40vh;overflow:auto'
    document.body.appendChild(div)
  }
  div.textContent = '出错: ' + (err?.message || err) + '\n' + (info || '')
}
window.addEventListener('error', e => {
  console.error('[window]', e.message)
  let div = document.getElementById('err-overlay')
  if (!div) {
    div = document.createElement('div')
    div.id = 'err-overlay'
    div.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#ff3b30;color:#fff;padding:14px 18px;font:13px/1.5 system-ui;white-space:pre-wrap;max-height:40vh;overflow:auto'
    document.body.appendChild(div)
  }
  div.textContent = '出错: ' + (e.message || '未知错误')
})

app.use(createPinia()).use(router).mount('#app')
