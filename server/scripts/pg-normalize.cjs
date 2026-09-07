/* 一次性：jsonb(payload) 老表 -> 规范列。步骤：改名→建规范表→拷贝→删老表→重建视图 */
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const c = new Client({ connectionString: process.env.DATABASE_URL });
  await c.connect();
  const old = ['users', 'projects', 'day_logs', 'log_versions', 'feedback', 'sms_codes', 'notifications'];

  // 1) 若表仍是 jsonb(payload) 结构则改名
  for (const t of old) {
    const col = await c.query(`SELECT column_name FROM information_schema.columns WHERE table_name='${t}' AND column_name='payload'`);
    if (col.rows.length) await c.query(`ALTER TABLE ${t} RENAME TO ${t}_old`);
  }
  // 2) 建规范表
  const schema = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf-8');
  await c.query(schema);

  // 3) 拷贝
  const T = {
    users: `INSERT INTO users (id, account, password, nickname, role, created_at)
      SELECT id, payload->>'account', payload->>'password', payload->>'nickname', payload->>'role', payload->>'createdAt' FROM users_old`,
    projects: `INSERT INTO projects (id, user_id, name, type, start_date, created_at)
      SELECT id, (payload->>'userId')::bigint, payload->>'name', payload->>'type', payload->>'startDate', payload->>'createdAt' FROM projects_old`,
    day_logs: `INSERT INTO day_logs (id, project_id, date, weekday, items, files, images, created_at, updated_at)
      SELECT id, (payload->>'projectId')::bigint, payload->>'date', payload->>'weekday', COALESCE(payload->'items','[]'::jsonb), COALESCE(payload->'files','[]'::jsonb), COALESCE(payload->'images','[]'::jsonb), payload->>'createdAt', payload->>'updatedAt' FROM day_logs_old`,
    log_versions: `INSERT INTO log_versions (id, log_id, version, items, created_at)
      SELECT id, (payload->>'logId')::bigint, COALESCE((payload->>'version')::int, 0), COALESCE(payload->'items','[]'::jsonb), payload->>'createdAt' FROM log_versions_old`,
    feedback: `INSERT INTO feedback (id, user_id, account, nickname, text, replies, status, created_at)
      SELECT id, (payload->>'userId')::bigint, payload->>'account', payload->>'nickname', payload->>'text', COALESCE(payload->'replies','[]'::jsonb), payload->>'status', (payload->>'createdAt')::bigint FROM feedback_old`,
    sms_codes: `INSERT INTO sms_codes (id, phone, code, created_at, expires_at)
      SELECT id, payload->>'phone', payload->>'code', (payload->>'createdAt')::bigint, (payload->>'expiresAt')::bigint FROM sms_codes_old`,
    notifications: `INSERT INTO notifications (id, user_id, kind, title, text, at, read)
      SELECT id, (payload->>'userId')::bigint, payload->>'kind', payload->>'title', payload->>'text', (payload->>'at')::bigint, COALESCE((payload->>'read')::boolean, false) FROM notifications_old`,
  };
  for (const t of old) {
    const exists = await c.query(`SELECT to_regclass('public.${t}_old') AS r`);
    if (!exists.rows[0].r) continue;
    const cnt = await c.query(`SELECT count(*)::int c FROM ${t}`);
    if (cnt.rows[0].c > 0) {
      await c.query(`DROP TABLE ${t}_old CASCADE`);
      console.log('skip(already):', t);
      continue;
    }
    await c.query(T[t]);
    await c.query(`DROP TABLE ${t}_old CASCADE`);
    console.log('normalized:', t);
  }
  const views = fs.readFileSync(path.join(__dirname, '..', 'sql', 'views.sql'), 'utf-8');
  await c.query(views);
  await c.end();
  console.log('OK: 规范化完成');
}

main().catch(e => { console.error('FAIL', e.message); process.exit(1); });
