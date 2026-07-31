import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { queryOne, update } from '../db.js';
import { authMiddleware } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stocksPath = join(__dirname, '..', 'data', 'stocks.json');
let stocks = [];
try {
  stocks = JSON.parse(readFileSync(stocksPath, 'utf-8'));
} catch {
  console.log('No stocks.json found at', stocksPath);
}

function initTrends() {
  stocks.forEach(s => {
    if (s.trend === undefined) s.trend = (Math.random() * 2 - 1) * 0.3
  })
}
initTrends()

function simulatePrice(stock) {
  // Randomly shift trend occasionally
  if (Math.random() < 0.1) {
    stock.trend = Math.max(-0.8, Math.min(0.8, stock.trend + (Math.random() * 2 - 1) * 0.3))
  }
  // Price moves with momentum + random noise, ±2-4%
  const move = stock.trend * 0.02 + (Math.random() - 0.5) * 0.03
  stock.price = Math.max(0.01, stock.price * (1 + move))
  stock.changePercent = Math.round(((stock.price - stock.prevClose) / stock.prevClose) * 10000) / 100
  stock.price = Math.round(stock.price * 100) / 100
  return stock
}

function parseHoldings(user) {
  if (!user.stocks) return {};
  try {
    return JSON.parse(user.stocks);
  } catch {
    return {};
  }
}

function parseTransactions(user) {
  if (!user.stockTransactions) return [];
  try {
    return JSON.parse(user.stockTransactions);
  } catch {
    return [];
  }
}

const router = Router();

router.get('/', (req, res) => {
  stocks.forEach(simulatePrice);
  res.json({ stocks, total: stocks.length });
});

router.get('/holdings', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });
  stocks.forEach(simulatePrice);
  const holdings = parseHoldings(user);
  const result = Object.entries(holdings).map(([symbol, pos]) => {
    const stock = stocks.find(s => s.symbol === symbol);
    const price = stock ? stock.price : 0;
    return {
      symbol,
      name: stock ? stock.name : symbol,
      shares: pos.shares,
      avgCost: pos.avgCost,
      currentPrice: price,
      currentValue: Math.round(pos.shares * price * 100) / 100,
      profit: Math.round((pos.shares * price - pos.avgCost * pos.shares) * 100) / 100,
      profitPercent: pos.avgCost ? Math.round((price - pos.avgCost) / pos.avgCost * 10000) / 100 : 0,
    };
  });
  res.json(result);
});

router.get('/stats', authMiddleware, (req, res) => {
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const transactions = parseTransactions(user);
  const holdings = parseHoldings(user);

  // Total buy spend (cost + fee)
  let totalBuySpend = 0;
  let totalBuyCost = 0;
  // Total sell net (proceeds - fee)
  let totalSellNet = 0;
  // Total fees
  let totalFees = 0;

  transactions.forEach(t => {
    if (t.type === 'buy') { totalBuySpend += t.total || 0; totalBuyCost += t.cost || 0; }
    if (t.type === 'sell') { totalSellNet += t.net || 0; }
    if (t.type === '交易手续费' || (t.fee)) { totalFees += t.fee || t.amount || 0; }
  });

  // Current holdings value
  let currentValue = 0;
  let holdingCost = 0;
  stocks.forEach(stock => {
    const pos = holdings[stock.symbol];
    if (pos) {
      currentValue += pos.shares * stock.price;
      holdingCost += pos.shares * pos.avgCost;
    }
  });
  currentValue = Math.round(currentValue * 100) / 100;
  holdingCost = Math.round(holdingCost * 100) / 100;

  // P&L calculations
  const realizedPnL = Math.round((totalSellNet - (totalBuyCost - holdingCost)) * 100) / 100;
  const unrealizedPnL = Math.round((currentValue - holdingCost) * 100) / 100;
  const totalPnL = Math.round((realizedPnL + unrealizedPnL) * 100) / 100;
  const invested = Math.round((totalBuySpend - totalSellNet) * 100) / 100;
  const pnlPercent = invested !== 0 ? Math.round((totalPnL / Math.abs(invested)) * 10000) / 100 : 0;

  res.json({
    totalBuySpend: Math.round(totalBuySpend * 100) / 100,
    totalSellNet: Math.round(totalSellNet * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    currentValue,
    holdingCost,
    realizedPnL,
    unrealizedPnL,
    totalPnL,
    invested,
    pnlPercent,
    tradeCount: transactions.filter(t => t.type === 'buy' || t.type === 'sell').length
  });
});

router.get('/:symbol/positions', authMiddleware, (req, res) => {
  const stock = stocks.find(s => s.symbol === req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });

  simulatePrice(stock);
  const holdings = parseHoldings(user);
  const pos = holdings[stock.symbol];
  res.json({
    symbol: stock.symbol,
    shares: pos ? pos.shares : 0,
    avgCost: pos ? pos.avgCost : 0,
    currentPrice: stock.price,
    currentValue: Math.round((pos ? pos.shares : 0) * stock.price * 100) / 100,
  });
});

router.post('/:symbol/buy', authMiddleware, (req, res) => {
  const stock = stocks.find(s => s.symbol === req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  const shares = Math.floor(Number(req.body.shares));
  if (!shares || shares <= 0) return res.status(400).json({ error: '请输入有效的股数' });
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });

  simulatePrice(stock);
  const price = stock.price;
  const cost = Math.round(price * shares * 100) / 100;
  const fee = Math.round(cost * 0.015 * 100) / 100;
  const total = Math.round((cost + fee) * 100) / 100;

  const balance = Number(user.balance) || 0;
  if (balance < total) return res.status(400).json({ error: '余额不足' });

  const holdings = parseHoldings(user);
  const pos = holdings[stock.symbol] || { shares: 0, avgCost: 0 };
  const newShares = pos.shares + shares;
  const avgCost = Math.round(((pos.avgCost * pos.shares + cost) / newShares) * 100) / 100;
  holdings[stock.symbol] = { shares: newShares, avgCost };

  const transactions = parseTransactions(user);
  transactions.push({ type: 'buy', symbol: stock.symbol, shares, price, cost, fee, total, createdAt: new Date().toISOString() });
  transactions.push({ type: '交易手续费', symbol: stock.symbol, amount: fee, createdAt: new Date().toISOString() });

  const newBalance = Math.round((balance - total) * 100) / 100;
  update('users', user.id, {
    balance: newBalance,
    stocks: JSON.stringify(holdings),
    stockTransactions: JSON.stringify(transactions),
    exp: (Number(user.exp) || 0) + 1,
  });

  res.json({ success: true, price, shares, cost, fee, total, balance: newBalance });
});

router.post('/:symbol/sell', authMiddleware, (req, res) => {
  const stock = stocks.find(s => s.symbol === req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  const shares = Math.floor(Number(req.body.shares));
  if (!shares || shares <= 0) return res.status(400).json({ error: '请输入有效的股数' });
  const user = queryOne('users', { id: req.user.id });
  if (!user) return res.status(404).json({ error: '用户不存在' });

  const holdings = parseHoldings(user);
  const pos = holdings[stock.symbol];
  if (!pos || pos.shares < shares) return res.status(400).json({ error: '持仓不足' });

  simulatePrice(stock);
  const price = stock.price;
  const proceeds = Math.round(price * shares * 100) / 100;
  const fee = Math.round(proceeds * 0.03 * 100) / 100;
  const net = Math.round((proceeds - fee) * 100) / 100;

  const balance = Number(user.balance) || 0;
  const remaining = pos.shares - shares;
  if (remaining > 0) {
    holdings[stock.symbol] = { shares: remaining, avgCost: pos.avgCost };
  } else {
    delete holdings[stock.symbol];
  }

  const transactions = parseTransactions(user);
  transactions.push({ type: 'sell', symbol: stock.symbol, shares, price, proceeds, fee, net, createdAt: new Date().toISOString() });
  transactions.push({ type: '交易手续费', symbol: stock.symbol, amount: fee, createdAt: new Date().toISOString() });

  const newBalance = Math.round((balance + net) * 100) / 100;
  update('users', user.id, {
    balance: newBalance,
    stocks: JSON.stringify(holdings),
    stockTransactions: JSON.stringify(transactions),
  });

  res.json({ success: true, price, shares, proceeds, fee, net, balance: newBalance });
});

router.get('/:symbol', (req, res) => {
  const stock = stocks.find(s => s.symbol === req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  simulatePrice(stock);
  res.json(stock);
});

export default router;
