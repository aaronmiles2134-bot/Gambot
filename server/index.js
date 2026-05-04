import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config.js';
import db from './db.js';
import apiRouter from './routes/api.js';
import adminRouter from './routes/admin.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use(express.json());
app.use(express.static(join(__dirname, '..', 'public')));

app.use('/api', apiRouter);
app.use('/api/admin', adminRouter);

// Seed games on first boot if table is empty
const gameCount = db.prepare('SELECT COUNT(*) as n FROM games').get().n;
if (gameCount === 0) {
  console.log('[db] No games found — running seed…');
  const { default: seed } = await import('../scripts/seedGames.js');
}

app.listen(config.port, () => {
  console.log(`[gambot] Server running at http://localhost:${config.port}`);
  console.log(`[gambot] Test console: http://localhost:${config.port}/`);
  console.log(`[gambot] Health check: http://localhost:${config.port}/api/admin/health`);
});

export default app;
