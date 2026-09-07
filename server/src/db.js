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
function pgWhere(filter) {
  const keys = Object.keys(filter || {});
  if (!keys.length) return { clause: '', params: [] };
  const params = keys.map(k => String(filter[k]));
  const segs = keys.map((k, i) => `payload->>'${k}' = $${i + 1}`);
  return { clause: ' WHERE ' + segs.join(' AND '), params };
}
async function pgQuery(sql, vals) {
  const p = await ensurePool();
  return p.query(sql, vals);
}
async function pgAll(table, filter) {
  const { clause, params } = pgWhere(filter);
  const r = await pgQuery(`SELECT id, payload FROM ${ident(table)}${clause}`, params);
  return r.rows.map(x => x.payload && x.payload.id == null ? { ...x.payload, id: x.id } : x.payload);
}
async function pgInsert(table, row) {
  const payload = { ...row };
  delete payload.id;
  const r = await pgQuery(`INSERT INTO ${ident(table)} (payload) VALUES ($1::jsonb) RETURNING id`, [JSON.stringify(payload)]);
  const id = r.rows[0].id;
  payload.id = id;
  await pgQuery(`UPDATE ${ident(table)} SET payload = $2::jsonb WHERE id = $1`, [id, JSON.stringify(payload)]);
  return payload;
}
async function pgUpdate(table, id, updates) {
  const r = await pgQuery(`SELECT id, payload FROM ${ident(table)} WHERE id = $1`, [id]);
  if (!r.rows.length) return null;
  const merged = { ...(r.rows[0].payload || {}), ...updates, id: r.rows[0].id };
  await pgQuery(`UPDATE ${ident(table)} SET payload = $2::jsonb WHERE id = $1`, [id, JSON.stringify(merged)]);
  return merged;
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
    for (const row of rows) {
      if (row && row.id != null) {
        await pgQuery(`INSERT INTO ${t} (id, payload) VALUES ($1, $2::jsonb) ON CONFLICT (id) DO NOTHING`, [Number(row.id), JSON.stringify(row)]);
        migrated++;
      }
    }
  }
  return { migrated };
}
export default { queryAll, queryOne, insert, update, remove, initTable, getNextId, migrateJsonToPgIfNeeded };
