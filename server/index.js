import app from './src/app.js';
import { seed } from './src/seed.js';

const PORT = process.env.PORT || 3001;

process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason && reason.stack ? reason.stack : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err && err.stack ? err.stack : err);
});

seed();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
