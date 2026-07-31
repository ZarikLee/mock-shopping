import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initTable } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function seed() {
  const productsPath = join(__dirname, 'data', 'products.json');
  let productsData = [];
  try {
    productsData = JSON.parse(readFileSync(productsPath, 'utf-8'));
  } catch {
    console.log('No products.json found at', productsPath);
  }

  initTable('products', productsData);
  initTable('users', []);
  initTable('orders', []);
  initTable('order_items', []);
  initTable('reviews', []);
  initTable('addresses', []);
  initTable('coupons', []);
  initTable('game_scores', []);
  initTable('checkins', []);
  initTable('messages', []);
  initTable('reports', []);

  if (productsData.length > 0) {
    console.log(`Seeded ${productsData.length} products`);
  }
}
