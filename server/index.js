import app from './src/app.js';
import { seed } from './src/seed.js';

const PORT = process.env.PORT || 3001;

seed();
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
