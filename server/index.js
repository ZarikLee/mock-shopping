import app from './src/app.js';
import { seed } from './src/seed.js';
import { migrateJsonToPgIfNeeded } from './src/db.js';

const PORT = process.env.PORT || 3001;

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});

seed();
try {
  const res = await migrateJsonToPgIfNeeded();
  if (res && res.migrated > 0) console.log(`[pg] 已从 JSON 迁入 ${res.migrated} 行`);
  else if (res) console.log('[pg] 无待迁移数据');
} catch (e) {
  console.error('[pg] 启动迁移跳过：', e.message);
}
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
