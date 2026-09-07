import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const TABLES = ['users', 'projects', 'day_logs', 'log_versions', 'feedback', 'sms_codes', 'notifications'];

const PG_URL = process.env.DATABASE_URL || '';

/* ---------- JSON 存储（无 DATABASE_URL 时使用，作为回退/开发） ---------- */
const data = {};
const autoId = {};
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
function loadTable(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  try { data[name] = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : []; }
  catch { data[name] = []; }
}
function saveTable(name) {
  fs.writeFileSync(path.join(DATA_DIR, `${name}.json`), JSON.stringify(data[name], null, 2));
}
TABLES.forEach(loadTable);
function jsonAll(table, filter) {
  let rows = data[table] || [];
  const keys = Object.keys(filter);
  if (keys.length) rows = rows.filter(row => keys.every(k => row[k] === filter[k]));
  return rows;
}
function jsonInsert(table, row) {
  if (!data[table]) data[table] = [];
  if (!autoId[table]) autoId[table] = data[table].reduce((m, r) => Math.max(m, r.id || 0), 0);
  autoId[table]++;
  row.id = autoId[table];
  data[table].push(row);
  saveTable(table);
  return row;
}

/* ---------- PostgreSQL（设置 DATABASE_URL 时启用） ---------- */
let pool = null;
let pgReady = false;
async function ensurePool() {
  if (pool) return pool;
  const { default: pg } = await import('pg');
  pool = new pg.Pool({ connectionString: PG_URL, max: 5 });
  return pool;
}
function ident(table) {
  if (!TABLES.includes(table)) throw new Error('未知表 ' + table);
  return table;
}
/* ---------- PostgreSQL 规范列映射（payload key -> 列） ---------- */
const SCHEMA = {
  users: { account: { c: 'account', k: 'text' }, password: { c: 'password', k: 'text' }, nickname: { c: 'nickname', k: 'text' }, role: { c: 'role', k: 'text' }, createdAt: { c: 'created_at', k: 'text' } },
  projects: { userId: { c: 'user_id', k: 'bigint' }, name: { c: 'name', k: 'text' }, type: { c: 'type', k: 'text' }, startDate: { c: 'start_date', k: 'text' }, createdAt: { c: 'created_at', k: 'text' } },
  day_logs: { projectId: { c: 'project_id', k: 'bigint' }, date: { c: 'date', k: 'text' }, weekday: { c: 'weekday', k: 'text' }, items: { c: 'items', k: 'json' }, files: { c: 'files', k: 'json' }, images: { c: 'images', k: 'json' }, createdAt: { c: 'created_at', k: 'text' }, updatedAt: { c: 'updated_at', k: 'text' } },
  log_versions: { logId: { c: 'log_id', k: 'bigint' }, version: { c: 'version', k: 'bigint' }, items: { c: 'items', k: 'json' }, createdAt: { c: 'created_at', k: 'text' } },
  feedback: { userId: { c: 'user_id', k: 'bigint' }, account: { c: 'account', k: 'text' }, nickname: { c: 'nickname', k: 'text' }, text: { c: 'text', k: 'text' }, replies: { c: 'replies', k: 'json' }, status: { c: 'status', k: 'text' }, createdAt: { c: 'created_at', k: 'bigint' } },
  sms_codes: { phone: { c: 'phone', k: 'text' }, code: { c: 'code', k: 'text' }, createdAt: { c: 'created_at', k: 'bigint' }, expiresAt: { c: 'expires_at', k: 'bigint' } },
  notifications: { userId: { c: 'user_id', k: 'bigint' }, kind: { c: 'kind', k: 'text' }, title: { c: 'title', k: 'text' }, text: { c: 'text', k: 'text' }, at: { c: 'at', k: 'bigint' }, read: { c: 'read', k: 'bool' } },
};
function cast(k, v) {
  if (k === 'json') return JSON.stringify(v);
  if (k === 'bigint') return Number(v);
  if (k === 'bool') return !!v;
  return v == null ? null : String(v);
}
function uncast(k, v) {
  if (k === 'json') { try { return v == null ? null : JSON.parse(v); } catch { return v == null ? null : v; } }
  if (k === 'bigint') return v == null ? null : Number(v);
  if (k === 'bool') return v == null ? false : !!v;
  return v;
}
function rowToPayload(table, row) {
  const out = {};
  for (const key of Object.keys(SCHEMA[table])) {
    const col = SCHEMA[table][key];
    out[key] = uncast(col.k, row[col.c]);
  }
  out.id = Number(row.id);
  return out;
}
function filterToSql(table, filter) {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', params: [] };
  const segs = [];
  const params = [];
  keys.forEach((key, i) => {
    const col = SCHEMA[table] && SCHEMA[table][key];
    const colName = col ? col.c : key;
    params.push(String(filter[key]));
    segs.push(`${colName}::text = $${i + 1}`);
  });
  return { clause: ' WHERE ' + segs.join(' AND '), params };
}
async function pgQuery(sql, vals) {
  const p = await ensurePool();
  return p.query(sql, vals);
}
async function pgAll(table, filter) {
  const { clause, params } = filterToSql(table, filter);
  const r = await pgQuery(`SELECT * FROM ${ident(table)}${clause}`, params);
  return r.rows.map(row => rowToPayload(table, row));
}
async function pgInsert(table, row) {
  const map = SCHEMA[table];
  const keys = Object.keys(row).filter(key => key !== 'id' && map[key]);
  const cols = keys.map(key => map[key].c);
  const vals = keys.map(key => map[key].k === 'json' ? JSON.stringify(row[key]) : cast(map[key].k, row[key]));
  const ph = vals.map((_, i) => map[keys[i]].k === 'json' ? `$${i + 1}::jsonb` : map[keys[i]].k === 'bigint' ? `$${i + 1}::bigint` : map[keys[i]].k === 'bool' ? `$${i + 1}::boolean` : `$${i + 1}`);
  const r = await pgQuery(`INSERT INTO ${ident(table)} (${cols.join(',')}) VALUES (${ph.join(',')}) RETURNING *`, vals);
  return rowToPayload(table, r.rows[0]);
}
async function pgUpdate(table, id, updates) {
  const map = SCHEMA[table];
  const keys = Object.keys(updates).filter(key => map[key]);
  if (!keys.length) {
    const cur = await pgQuery(`SELECT * FROM ${ident(table)} WHERE id = $1`, [id]);
    return cur.rows.length ? rowToPayload(table, cur.rows[0]) : null;
  }
  const set = [];
  const vals = [];
  keys.forEach((key, i) => {
    const def = map[key];
    vals.push(def.k === 'json' ? JSON.stringify(updates[key]) : cast(def.k, updates[key]));
    set.push(`${def.c} = ${def.k === 'json' ? `$${i + 1}::jsonb` : def.k === 'bigint' ? `$${i + 1}::bigint` : def.k === 'bool' ? `$${i + 1}::boolean` : `$${i + 1}`}`);
  });
  vals.push(id);
  const r = await pgQuery(`UPDATE ${ident(table)} SET ${set.join(',')} WHERE id = $${keys.length + 1} RETURNING *`, vals);
  return r.rows.length ? rowToPayload(table, r.rows[0]) : null;
}
async function pgRemove(table, id) {
  const r = await pgQuery(`DELETE FROM ${ident(table)} WHERE id = $1`, [id]);
  return r.rowCount > 0;
}

/* ---------- 对外 API（统一 async，兼容两种模式） ---------- */
export async function queryAll(table, filter = {}) {
  if (PG_URL) { await ensurePool(); await ensureTables(); return pgAll(table, filter); }
  return jsonAll(table, filter);
}
export async function queryOne(table, filter = {}) {
  const rows = await queryAll(table, filter);
  return rows.length ? rows[0] : null;
}
export async function insert(table, row) {
  if (PG_URL) { await ensurePool(); await ensureTables(); return pgInsert(table, row); }
  return jsonInsert(table, row);
}
export async function update(table, id, updates) {
  if (PG_URL) { await ensurePool(); return pgUpdate(table, id, updates); }
  const rows = data[table];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  saveTable(table);
  return rows[idx];
}
export async function remove(table, id) {
  if (PG_URL) { await ensurePool(); return pgRemove(table, id); }
  const rows = data[table];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  saveTable(table);
  return true;
}
export async function initTable(table, rows) {
  if (PG_URL) { await ensurePool(); await ensureTables(); const cnt = await pgQuery(`SELECT count(*)::int c FROM ${ident(table)}`); if (cnt.rows[0].c === 0) for (const r of rows) await pgInsert(table, r); return; }
  if (!data[table] || data[table].length === 0) { data[table] = rows; saveTable(table); autoId[table] = rows.reduce((m, r) => Math.max(m, r.id || 0), 0); }
}
export async function getNextId(table) {
  if (PG_URL) { const r = await pgQuery(`SELECT COALESCE(max(id),0)+1 AS n FROM ${ident(table)}`); return r.rows[0].n; }
  if (!autoId[table]) autoId[table] = data[table].reduce((m, r) => Math.max(m, r.id || 0), 0);
  return ++autoId[table];
}

/* ---------- 启动时：PG 模式下建表 + 把 JSON 一次性迁入 ---------- */
let tablesEnsured = false;
async function ensureTables() {
  if (tablesEnsured || !PG_URL) return;
  const sql = fs.readFileSync(path.join(__dirname, '..', 'sql', 'schema.sql'), 'utf-8');
  const p = await ensurePool();
  await p.query(sql);
  tablesEnsured = true;
}
export async function migrateJsonToPgIfNeeded() {
  if (!PG_URL) return { migrated: 0 };
  await ensurePool();
  await ensureTables();
  let migrated = 0;
  for (const t of TABLES) {
    const file = path.join(DATA_DIR, `${t}.json`);
    let rows = [];
    try { rows = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : []; } catch { rows = []; }
    if (!Array.isArray(rows) || !rows.length) continue;
    const map = SCHEMA[t];
    for (const row of rows) {
      if (!row || row.id == null) continue;
      const cols = ['id'];
      const casts = ['$1::bigint'];
      const vals = [Number(row.id)];
      for (const key of Object.keys(map)) {
        if (row[key] === undefined || row[key] === null) continue;
        const def = map[key];
        cols.push(def.c);
        vals.push(def.k === 'json' ? JSON.stringify(row[key]) : cast(def.k, row[key]));
        casts.push(def.k === 'json' ? `$${vals.length}::jsonb` : def.k === 'bigint' ? `$${vals.length}::bigint` : def.k === 'bool' ? `$${vals.length}::boolean` : `$${vals.length}`);
      }
      if (cols.length === 1) continue;
      await pgQuery(`INSERT INTO ${ident(t)} (${cols.join(',')}) VALUES (${casts.join(',')}) ON CONFLICT (id) DO NOTHING`, vals);
      migrated++;
    }
  }
  return { migrated };
}
export default { queryAll, queryOne, insert, update, remove, initTable, getNextId, migrateJsonToPgIfNeeded };
