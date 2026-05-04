import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { mkdirSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_DIR = join(__dirname, '..', 'db');
const DB_PATH = join(DB_DIR, 'analyst.db');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS games (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    provider TEXT,
    rtp REAL DEFAULT 0.96,
    volatility TEXT DEFAULT 'high',
    avg_spins_to_bonus REAL DEFAULT 100,
    avg_bonus_multiplier REAL DEFAULT 50,
    bonus_buy_available INTEGER DEFAULT 0,
    bonus_buy_cost_x REAL,
    bonus_buy_rtp REAL,
    notes TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at INTEGER DEFAULT (unixepoch()),
    ended_at INTEGER,
    start_balance REAL NOT NULL,
    end_balance REAL,
    peak_balance REAL,
    lowest_balance REAL,
    total_wagered REAL DEFAULT 0,
    total_returned REAL DEFAULT 0,
    total_spins INTEGER DEFAULT 0,
    bonuses_hit INTEGER DEFAULT 0,
    bonus_buys INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    stream_title TEXT,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS game_stints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    started_at INTEGER DEFAULT (unixepoch()),
    ended_at INTEGER,
    start_balance REAL NOT NULL,
    end_balance REAL,
    spins INTEGER DEFAULT 0,
    total_wagered REAL DEFAULT 0,
    total_returned REAL DEFAULT 0,
    bonuses_hit INTEGER DEFAULT 0,
    bonus_buys INTEGER DEFAULT 0,
    observed_rtp REAL,
    spins_since_bonus INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS spins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    stint_id INTEGER NOT NULL REFERENCES game_stints(id),
    game_id INTEGER NOT NULL REFERENCES games(id),
    spin_number INTEGER NOT NULL,
    bet_size REAL NOT NULL,
    win_amount REAL DEFAULT 0,
    balance_before REAL,
    balance_after REAL NOT NULL,
    feature_triggered INTEGER DEFAULT 0,
    feature_type TEXT,
    feature_win REAL,
    is_bonus_buy INTEGER DEFAULT 0,
    ocr_confidence REAL,
    raw_ocr_payload TEXT,
    timestamp INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS analysis_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    stint_id INTEGER REFERENCES game_stints(id),
    spin_id INTEGER REFERENCES spins(id),
    trigger_type TEXT NOT NULL,
    audience TEXT NOT NULL,
    stats_snapshot TEXT NOT NULL,
    claude_request TEXT,
    claude_response TEXT,
    verdict TEXT,
    mascot_state TEXT,
    audio_cue TEXT,
    confidence INTEGER,
    shown INTEGER DEFAULT 0,
    timestamp INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    analysis_event_id INTEGER REFERENCES analysis_events(id),
    question TEXT NOT NULL,
    options TEXT NOT NULL,
    votes TEXT DEFAULT '{}',
    status TEXT DEFAULT 'active',
    duration_seconds INTEGER DEFAULT 30,
    created_at INTEGER DEFAULT (unixepoch()),
    closed_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS streamer_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INTEGER NOT NULL REFERENCES sessions(id),
    analysis_event_id INTEGER REFERENCES analysis_events(id),
    category TEXT NOT NULL,
    headline TEXT NOT NULL,
    body TEXT,
    ev_data TEXT,
    acknowledged INTEGER DEFAULT 0,
    timestamp INTEGER DEFAULT (unixepoch())
  );

  CREATE INDEX IF NOT EXISTS idx_spins_stint ON spins(stint_id, spin_number);
  CREATE INDEX IF NOT EXISTS idx_events_session ON analysis_events(session_id, timestamp);
  CREATE INDEX IF NOT EXISTS idx_polls_session ON polls(session_id, status);
`);

export default db;
