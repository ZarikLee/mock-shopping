import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const tables = ['users', 'projects', 'day_logs', 'log_versions'];

const data = {};

function loadTable(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  if (fs.existsSync(file)) {
    try {
      data[name] = JSON.parse(fs.readFileSync(file, 'utf-8'));
    } catch {
      data[name] = [];
    }
  } else {
    data[name] = [];
  }
}

function saveTable(name) {
  const file = path.join(DATA_DIR, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(data[name], null, 2));
}

tables.forEach(loadTable);

let autoId = {};

export function queryAll(table, filter = {}) {
  let rows = data[table] || [];
  const keys = Object.keys(filter);
  if (keys.length > 0) {
    rows = rows.filter(row => keys.every(k => row[k] === filter[k]));
  }
  return rows;
}

export function queryOne(table, filter = {}) {
  const rows = queryAll(table, filter);
  return rows.length > 0 ? rows[0] : null;
}

export function insert(table, row) {
  if (!data[table]) data[table] = [];
  if (!autoId[table]) {
    autoId[table] = data[table].reduce((max, r) => Math.max(max, r.id || 0), 0);
  }
  autoId[table]++;
  row.id = autoId[table];
  data[table].push(row);
  saveTable(table);
  return row;
}

export function update(table, id, updates) {
  const rows = data[table];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return null;
  rows[idx] = { ...rows[idx], ...updates };
  saveTable(table);
  return rows[idx];
}

export function remove(table, id) {
  const rows = data[table];
  const idx = rows.findIndex(r => r.id === id);
  if (idx === -1) return false;
  rows.splice(idx, 1);
  saveTable(table);
  return true;
}

export function initTable(table, rows) {
  if (!data[table] || data[table].length === 0) {
    data[table] = rows;
    saveTable(table);
    autoId[table] = rows.reduce((max, r) => Math.max(max, r.id || 0), 0);
  }
}

export function getNextId(table) {
  if (!autoId[table]) {
    autoId[table] = (data[table] || []).reduce((max, r) => Math.max(max, r.id || 0), 0);
  }
  return ++autoId[table];
}

export default { queryAll, queryOne, insert, update, remove, initTable, getNextId };
