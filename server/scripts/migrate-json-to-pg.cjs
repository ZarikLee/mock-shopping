/* 纸上 Paper Todo · JSON → PostgreSQL 数据迁移
 *
 * 前提：
 *   1) 已创建好数据库并执行过 server/sql/schema.sql
 *   2) 设置环境变量 DATABASE_URL（如 postgres://user:pass@host:5432/dbname）
 * 用法：
 *   cd server && DATABASE_URL=... node scripts/migrate-json-to-pg.cjs
 *
 * 说明：读取 server/data/*.json，按原 id 写入 PG（存在则覆盖），不删除本地 JSON。
 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const TABLES = ['users', 'projects', 'day_logs', 'log_versions', 'feedback', 'sms_codes', 'notifications'];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('缺少 DATABASE_URL 环境变量');
    process.exit(1);
  }
  const client = new Client({ connectionString: url });
  await client.connect();

  let total = 0;
  for (const table of TABLES) {
    const file = path.join(DATA_DIR, `${table}.json`);
    if (!fs.existsSync(file)) continue;
    let rows = [];
    try { rows = JSON.parse(fs.readFileSync(file, 'utf-8')); } catch (e) {
      console.warn(`[${table}] 解析失败，跳过：`, e.message);
      continue;
    }
    if (!Array.isArray(rows)) { console.warn(`[${table}] 非数组，跳过`); continue; }
    for (const row of rows) {
      if (!row || row.id == null) { console.warn(`[${table}] 缺 id 的行，跳过`); continue; }
      const id = Number(row.id);
      const payload = JSON.stringify(row);
      await client.query(
        `INSERT INTO ${table} (id, payload) VALUES ($1, $2)
         ON CONFLICT (id) DO UPDATE SET payload = EXCLUDED.payload`,
        [id, payload]
      );
      total++;
    }
    console.log(`[${table}] 迁移 ${rows.length} 行`);
  }
  console.log(`\n完成，共写入 ${total} 行。`);
  await client.end();
}

main().catch(err => {
  console.error('迁移失败：', err.message);
  process.exit(1);
});
