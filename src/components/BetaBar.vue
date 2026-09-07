<template>
  <div class="beta">
    <span class="tag">公测中</span>
    <span class="txt">当前处于全民公测阶段，更新较频繁，体验可能偶有波动；有任何建议或需求，欢迎到「设置 → 建议反馈」告诉我们，感谢您的大力支持！</span>
  </div>
</template>

<style scoped>
.beta { position: fixed; left: 50%; bottom: 12px; transform: translateX(-50%); z-index: 300; display: inline-flex; align-items: center; gap: 8px; max-width: calc(100vw - 24px); background: color-mix(in srgb, var(--surface) 78%, transparent); backdrop-filter: blur(10px); border: 1px solid var(--border); box-shadow: 0 10px 30px rgba(0,0,0,.16); border-radius: 999px; padding: 6px 14px; color: var(--text-2); font-size: 12px; line-height: 1.4; }
.tag { flex-shrink: 0; background: linear-gradient(100deg,#0a84ff,#7b6cff); color:#fff; font-size: 10px; font-weight:700; padding: 1px 7px; border-radius: 999px; }
.txt { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
@media (max-width: 640px){ .beta { border-radius: 12px; width: calc(100vw - 20px); } .txt{ white-space: normal; } }
</style>
