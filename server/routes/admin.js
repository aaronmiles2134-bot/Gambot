import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/health', (req, res) => {
  try {
    const sessionCount = db.prepare('SELECT COUNT(*) as n FROM sessions').get().n;
    const gameCount = db.prepare('SELECT COUNT(*) as n FROM games').get().n;
    const spinCount = db.prepare('SELECT COUNT(*) as n FROM spins').get().n;
    res.json({
      status: 'ok',
      db: { sessions: sessionCount, games: gameCount, spins: spinCount },
      uptime: process.uptime(),
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

router.post('/recalibrate', (req, res) => {
  const { gameId } = req.body;
  if (!gameId) return res.status(400).json({ error: 'gameId required' });
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json({ message: `Recalibration queued for ${game.name}`, gameId });
});

export default router;
