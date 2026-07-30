import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export function seed() {
  const count = db.prepare('SELECT COUNT(*) as count FROM products').get();
  if (count.count > 0) return;

  const productsPath = join(__dirname, '../../src/data/products.json');
  const products = JSON.parse(readFileSync(productsPath, 'utf-8'));

  const insert = db.prepare(`
    INSERT INTO products (id, name, category, categoryId, price, originalPrice, sales, rating, image, images, specs, colors, brand, shop, shopId, description, stock)
    VALUES (@id, @name, @category, @categoryId, @price, @originalPrice, @sales, @rating, @image, @images, @specs, @colors, @brand, @shop, @shopId, @description, @stock)
  `);

  const insertMany = db.transaction((items) => {
    for (const item of items) {
      insert.run({
        ...item,
        images: JSON.stringify(item.images),
        specs: JSON.stringify(item.specs),
        colors: JSON.stringify(item.colors),
      });
    }
  });

  insertMany(products);
  console.log(`Seeded ${products.length} products`);
}

seed();
