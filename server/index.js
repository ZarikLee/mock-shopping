import app from './src/app.js';
import { getDb } from './src/db.js';
import { seed } from './src/seed.js';

const PORT = process.env.PORT || 3001;

async function start() {
  await getDb();
  await seed();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
start();
