import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'database.sqlite');

let db = null;

export async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA journal_mode=WAL');
  db.run('PRAGMA foreign_keys=ON');

  createTables();
  saveDb();

  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function createTables() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      nickname TEXT,
      avatar TEXT,
      phone TEXT,
      balance REAL DEFAULT 10000,
      points INTEGER DEFAULT 5000,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT, category TEXT, categoryId INTEGER,
      price REAL, originalPrice REAL,
      sales INTEGER DEFAULT 0, rating REAL,
      image TEXT, images TEXT,
      specs TEXT, colors TEXT,
      brand TEXT, shop TEXT, shopId INTEGER,
      description TEXT, stock INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderNo TEXT, userId INTEGER,
      totalAmount REAL, discountAmount REAL, payAmount REAL,
      status INTEGER DEFAULT 0,
      address TEXT, createTime TEXT, payTime TEXT,
      shipTime TEXT, completeTime TEXT,
      logistics TEXT,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      orderId INTEGER, productId INTEGER,
      name TEXT, price REAL, quantity INTEGER,
      image TEXT, selectedSpec TEXT, selectedColor TEXT,
      FOREIGN KEY (orderId) REFERENCES orders(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      productId INTEGER, userId INTEGER,
      username TEXT, avatar TEXT,
      rating REAL, content TEXT,
      images TEXT, specs TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER, name TEXT, phone TEXT,
      province TEXT, city TEXT, district TEXT,
      detail TEXT, isDefault INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER, name TEXT,
      amount REAL, minConsume REAL,
      expireTime TEXT, used INTEGER DEFAULT 0,
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER, gameType TEXT,
      score INTEGER, result TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS checkins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER, date TEXT,
      points INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    )
  `);
}

// Helper: run a query and return all rows
export function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

// Helper: run a query and return first row
export function queryOne(sql, params = []) {
  const rows = queryAll(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

// Helper: execute a write query, auto-save
export function execute(sql, params = []) {
  if (params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  saveDb();
}

// Helper: get last insert rowid
export function lastInsertRowId() {
  return queryOne('SELECT last_insert_rowid() as id').id;
}

export function closeDb() {
  if (db) {
    saveDb();
    db.close();
    db = null;
  }
}

export default { getDb, queryAll, queryOne, execute, lastInsertRowId, closeDb, saveDb };
