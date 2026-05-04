import express from 'express';
import db from '../db.js';
import * as stats from '../stats/index.js';

const router = express.Router();

// ─── GAMES ───────────────────────────────────────────────────────────────────

router.get('/games', (req, res) => {
  const games = db.prepare('SELECT * FROM games ORDER BY name').all();
  res.json(games);
});

router.get('/games/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

router.patch('/games/:id', (req, res) => {
  const allowed = [
    'name', 'provider', 'rtp', 'volatility', 'avg_spins_to_bonus',
    'avg_bonus_multiplier', 'bonus_buy_available', 'bonus_buy_cost_x',
    'bonus_buy_rtp', 'notes'
  ];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });

  const set = fields.map(f => `${f} = @${f}`).join(', ');
  db.prepare(`UPDATE games SET ${set} WHERE id = @id`).run({ ...req.body, id: req.params.id });
  res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id));
});

// ─── SESSIONS ────────────────────────────────────────────────────────────────

router.post('/sessions', (req, res) => {
  const { startBalance, streamTitle } = req.body;
  if (startBalance == null) return res.status(400).json({ error: 'startBalance required' });

  const info = db.prepare(
    `INSERT INTO sessions (start_balance, stream_title, peak_balance, lowest_balance)
     VALUES (?, ?, ?, ?)`
  ).run(startBalance, streamTitle || null, startBalance, startBalance);

  res.status(201).json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(info.lastInsertRowid));
});

router.get('/sessions/:id', (req, res) => {
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
});

router.patch('/sessions/:id', (req, res) => {
  const { status, endBalance, notes } = req.body;
  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const updates = {};
  if (status) updates.status = status;
  if (endBalance != null) updates.end_balance = endBalance;
  if (notes) updates.notes = notes;
  if (status === 'ended') updates.ended_at = Math.floor(Date.now() / 1000);

  if (Object.keys(updates).length > 0) {
    const set = Object.keys(updates).map(k => `${k} = @${k}`).join(', ');
    db.prepare(`UPDATE sessions SET ${set} WHERE id = @id`).run({ ...updates, id: req.params.id });
  }

  res.json(db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id));
});

// ─── GAME STINTS ─────────────────────────────────────────────────────────────

router.post('/stints', (req, res) => {
  const { sessionId, gameName, startBalance } = req.body;
  if (!sessionId || !gameName || startBalance == null) {
    return res.status(400).json({ error: 'sessionId, gameName, startBalance required' });
  }

  const game = db.prepare('SELECT * FROM games WHERE name = ?').get(gameName);
  if (!game) return res.status(404).json({ error: `Game not found: ${gameName}` });

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const info = db.prepare(
    `INSERT INTO game_stints (session_id, game_id, start_balance)
     VALUES (?, ?, ?)`
  ).run(sessionId, game.id, startBalance);

  res.status(201).json(db.prepare('SELECT * FROM game_stints WHERE id = ?').get(info.lastInsertRowid));
});

router.patch('/stints/:id', (req, res) => {
  const allowed = ['end_balance', 'ended_at', 'observed_rtp', 'spins_since_bonus'];
  const fields = Object.keys(req.body).filter(k => allowed.includes(k));
  if (fields.length === 0) return res.status(400).json({ error: 'No valid fields' });

  const set = fields.map(f => `${f} = @${f}`).join(', ');
  db.prepare(`UPDATE game_stints SET ${set} WHERE id = @id`).run({ ...req.body, id: req.params.id });
  res.json(db.prepare('SELECT * FROM game_stints WHERE id = ?').get(req.params.id));
});

// ─── SPINS ────────────────────────────────────────────────────────────────────

router.get('/sessions/:id/spins', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || '50', 10), 500);
  const spins = db.prepare(
    `SELECT s.*, g.name as game_name
     FROM spins s
     JOIN games g ON s.game_id = g.id
     WHERE s.session_id = ?
     ORDER BY s.spin_number DESC
     LIMIT ?`
  ).all(req.params.id, limit);
  res.json(spins);
});

router.post('/spins', (req, res) => {
  const {
    sessionId, stintId, gameId, betSize, winAmount = 0,
    balanceBefore, balanceAfter, featureTriggered = 0,
    featureType, featureWin, isBonusBuy = 0, ocrConfidence, rawOcrPayload
  } = req.body;

  if (!sessionId || !stintId || !gameId || betSize == null || balanceAfter == null) {
    return res.status(400).json({ error: 'sessionId, stintId, gameId, betSize, balanceAfter required' });
  }

  const session = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  if (!session) return res.status(404).json({ error: 'Session not found' });

  const stint = db.prepare('SELECT * FROM game_stints WHERE id = ?').get(stintId);
  if (!stint) return res.status(404).json({ error: 'Stint not found' });

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(gameId);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const spinCount = db.prepare('SELECT COUNT(*) as n FROM spins WHERE session_id = ?').get(sessionId);
  const spinNumber = spinCount.n + 1;

  const insertSpin = db.transaction(() => {
    const info = db.prepare(
      `INSERT INTO spins
         (session_id, stint_id, game_id, spin_number, bet_size, win_amount,
          balance_before, balance_after, feature_triggered, feature_type,
          feature_win, is_bonus_buy, ocr_confidence, raw_ocr_payload)
       VALUES
         (@sessionId, @stintId, @gameId, @spinNumber, @betSize, @winAmount,
          @balanceBefore, @balanceAfter, @featureTriggered, @featureType,
          @featureWin, @isBonusBuy, @ocrConfidence, @rawOcrPayload)`
    ).run({
      sessionId, stintId, gameId, spinNumber, betSize,
      winAmount, balanceBefore: balanceBefore ?? null,
      balanceAfter, featureTriggered, featureType: featureType ?? null,
      featureWin: featureWin ?? null, isBonusBuy, ocrConfidence: ocrConfidence ?? null,
      rawOcrPayload: rawOcrPayload ? JSON.stringify(rawOcrPayload) : null
    });

    const newSpinsSinceBonus = featureTriggered ? 0 : stint.spins_since_bonus + 1;
    db.prepare(
      `UPDATE game_stints SET
         spins = spins + 1,
         total_wagered = total_wagered + @bet,
         total_returned = total_returned + @win,
         spins_since_bonus = @spinsSinceBonus,
         bonuses_hit = bonuses_hit + @bonusHit,
         bonus_buys = bonus_buys + @bonusBuy,
         end_balance = @balanceAfter,
         observed_rtp = CASE WHEN (total_wagered + @bet) > 0
           THEN (total_returned + @win) / (total_wagered + @bet)
           ELSE NULL END
       WHERE id = @stintId`
    ).run({
      bet: betSize, win: winAmount, spinsSinceBonus: newSpinsSinceBonus,
      bonusHit: featureTriggered ? 1 : 0, bonusBuy: isBonusBuy ? 1 : 0,
      balanceAfter, stintId
    });

    const peakBalance = Math.max(session.peak_balance ?? balanceAfter, balanceAfter);
    const lowestBalance = Math.min(session.lowest_balance ?? balanceAfter, balanceAfter);
    db.prepare(
      `UPDATE sessions SET
         total_spins = total_spins + 1,
         total_wagered = total_wagered + @bet,
         total_returned = total_returned + @win,
         bonuses_hit = bonuses_hit + @bonusHit,
         bonus_buys = bonus_buys + @bonusBuy,
         peak_balance = @peak,
         lowest_balance = @lowest
       WHERE id = @sessionId`
    ).run({
      bet: betSize, win: winAmount,
      bonusHit: featureTriggered ? 1 : 0, bonusBuy: isBonusBuy ? 1 : 0,
      peak: peakBalance, lowest: lowestBalance, sessionId
    });

    return info.lastInsertRowid;
  });

  const spinId = insertSpin();
  const savedSpin = db.prepare('SELECT * FROM spins WHERE id = ?').get(spinId);

  const freshStint = db.prepare('SELECT * FROM game_stints WHERE id = ?').get(stintId);
  const freshSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
  const snapshot = stats.buildStatsSnapshot({ spin: savedSpin, stint: freshStint, session: freshSession, game });

  res.status(201).json({ spin: savedSpin, stats: snapshot });
});

// ─── POLLS ────────────────────────────────────────────────────────────────────

router.get('/polls/:id', (req, res) => {
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  res.json({ ...poll, options: JSON.parse(poll.options), votes: JSON.parse(poll.votes) });
});

router.post('/polls/:id/vote', (req, res) => {
  const { optionIndex } = req.body;
  const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(req.params.id);
  if (!poll) return res.status(404).json({ error: 'Poll not found' });
  if (poll.status !== 'active') return res.status(409).json({ error: 'Poll is not active' });

  const options = JSON.parse(poll.options);
  if (optionIndex < 0 || optionIndex >= options.length) {
    return res.status(400).json({ error: 'Invalid optionIndex' });
  }

  const votes = JSON.parse(poll.votes);
  votes[optionIndex] = (votes[optionIndex] || 0) + 1;
  db.prepare('UPDATE polls SET votes = ? WHERE id = ?').run(JSON.stringify(votes), poll.id);

  res.json({ votes });
});

export default router;
