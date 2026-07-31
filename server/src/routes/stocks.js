import { Router } from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const stocksPath = join(__dirname, '..', '..', '..', 'src', 'data', 'stocks.json');
let stocks = [];
try {
  stocks = JSON.parse(readFileSync(stocksPath, 'utf-8'));
} catch {
  console.log('No stocks.json found at', stocksPath);
}

const router = Router();

router.get('/', (req, res) => {
  res.json({ stocks, total: stocks.length });
});

router.get('/:symbol', (req, res) => {
  const stock = stocks.find(s => s.symbol === req.params.symbol);
  if (!stock) return res.status(404).json({ error: 'Stock not found' });
  res.json(stock);
});

export default router;
