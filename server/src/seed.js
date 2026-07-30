import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDb, queryAll, queryOne, execute, lastInsertRowId } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function seed() {
  await getDb();

  const count = queryOne('SELECT COUNT(*) as count FROM products');
  if (count.count > 0) return;

  const productsPath = join(__dirname, '../../src/data/products.json');
  const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

  const insertSql = `
    INSERT INTO products (id, name, category, categoryId, price, originalPrice, sales, rating, image, images, specs, colors, brand, shop, shopId, description, stock)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const item of products) {
    execute(insertSql, [
      item.id, item.name, item.category, item.categoryId,
      item.price, item.originalPrice, item.sales, item.rating,
      item.image, JSON.stringify(item.images), JSON.stringify(item.specs), JSON.stringify(item.colors),
      item.brand, item.shop, item.shopId, item.description, item.stock
    ]);
  }

  console.log(`Seeded ${products.length} products`);
}
