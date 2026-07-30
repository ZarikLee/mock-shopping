import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, '../database.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    nickname TEXT,
    avatar TEXT,
    phone TEXT,
    balance REAL DEFAULT 10000,
    points INTEGER DEFAULT 5000,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT,
    category TEXT,
    categoryId INTEGER,
    price REAL,
    originalPrice REAL,
    sales INTEGER,
    rating REAL,
    image TEXT,
    images TEXT,
    specs TEXT,
    colors TEXT,
    brand TEXT,
    shop TEXT,
    shopId INTEGER,
    description TEXT,
    stock INTEGER
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY,
    orderNo TEXT,
    userId INTEGER,
    totalAmount REAL,
    discountAmount REAL,
    payAmount REAL,
    status INTEGER DEFAULT 0,
    address TEXT,
    createTime TEXT,
    payTime TEXT,
    shipTime TEXT,
    completeTime TEXT,
    logistics TEXT
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY,
    orderId INTEGER,
    productId INTEGER,
    name TEXT,
    price REAL,
    quantity INTEGER,
    image TEXT,
    selectedSpec TEXT,
    selectedColor TEXT
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY,
    productId INTEGER,
    userId INTEGER,
    username TEXT,
    avatar TEXT,
    rating REAL,
    content TEXT,
    images TEXT,
    specs TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS addresses (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    name TEXT,
    phone TEXT,
    province TEXT,
    city TEXT,
    district TEXT,
    detail TEXT,
    isDefault INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    name TEXT,
    amount REAL,
    minConsume REAL,
    expireTime TEXT,
    used INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS game_scores (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    gameType TEXT,
    score INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY,
    userId INTEGER,
    date TEXT,
    points INTEGER,
    created_at TEXT
  );
`);

export default db;
