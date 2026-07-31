import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import orderRoutes from './routes/orders.js';
import reviewRoutes from './routes/reviews.js';
import addressRoutes from './routes/addresses.js';
import couponRoutes from './routes/coupons.js';
import gameRoutes from './routes/games.js';
import leaderboardRoutes from './routes/leaderboard.js';
import userProfileRoutes from './routes/userProfile.js';
import checkinRoutes from './routes/checkin.js';
import stockRoutes from './routes/stocks.js';

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userProfileRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/stocks', stockRoutes);

const distPath = join(__dirname, '..', '..', 'dist');
app.use(express.static(distPath));
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(join(distPath, 'index.html'));
  } else {
    next();
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

export default app;
