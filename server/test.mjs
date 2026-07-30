import('./src/db.js').then(m => {
  console.log('DB loaded OK');
  try {
    const count = m.default.prepare('SELECT COUNT(*) as c FROM products').get();
    console.log('Products:', count.c);
  } catch(e) {
    console.log('No products table yet (needs seed):', e.message);
  }
}).catch(e => console.error(e));
