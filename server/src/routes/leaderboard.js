import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { queryAll } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = Router();

function parseStockTransactions(user) {
  if (!user.stockTransactions) return [];
  try { return JSON.parse(user.stockTransactions); } catch { return []; }
}

function parseStockHoldings(user) {
  if (!user.stocks) return {};
  try { return JSON.parse(user.stocks); } catch { return {}; }
}

function calcStockPnL(user, stocks) {
  const transactions = parseStockTransactions(user);
  const holdings = parseStockHoldings(user);
  let totalBuySpend = 0;
  let totalSellNet = 0;
  transactions.forEach(t => {
    if (t.type === 'buy') totalBuySpend += t.total || 0;
    if (t.type === 'sell') totalSellNet += t.net || 0;
  });
  let currentValue = 0;
  let holdingCost = 0;
  stocks.forEach(s => {
    const pos = holdings[s.symbol];
    if (pos) {
      currentValue += pos.shares * (s.price || 0);
      holdingCost += pos.shares * pos.avgCost;
    }
  });
  const realizedPnL = totalSellNet - (totalBuySpend - currentValue - (totalBuySpend - currentValue));
  // Simpler: total P&L = current value + sell net - buy spend
  const totalPnL = currentValue + totalSellNet - totalBuySpend;
  return Math.round(totalPnL * 100) / 100;
}

router.get('/', (req, res) => {
  const users = queryAll('users')
    .sort((a, b) => (b.balance || 0) - (a.balance || 0))
    .slice(0, 50)
    .map((u, i) => ({ id: u.id, username: u.username, nickname: u.nickname, avatar: u.avatar, balance: u.balance, rank: i + 1 }));
  res.json(users);
});

router.get('/spending', (req, res) => {
  const users = queryAll('users');
  const orders = queryAll('orders').filter(o => o.status >= 1);
  const spending = {};
  orders.forEach(o => {
    spending[o.userId] = (spending[o.userId] || 0) + (o.payAmount || 0);
  });
  const result = users.map(u => ({
    id: u.id,
    username: u.username,
    nickname: u.nickname,
    avatar: u.avatar,
    totalSpent: spending[u.id] || 0,
  }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 50)
    .map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

router.get('/stocks', (req, res) => {
  // Load stocks for current prices
  let stocks = [];
  try {
    const path = join(__dirname, '..', 'data', 'stocks.json');
    stocks = JSON.parse(readFileSync(path, 'utf-8'));
  } catch { stocks = []; }

  const users = queryAll('users');
  const result = users
    .map(u => ({
      id: u.id,
      username: u.username,
      nickname: u.nickname,
      avatar: u.avatar,
      stockPnL: calcStockPnL(u, stocks),
    }))
    .sort((a, b) => b.stockPnL - a.stockPnL)
    .slice(0, 50)
    .map((u, i) => ({ ...u, rank: i + 1 }));
  res.json(result);
});

export default router;
