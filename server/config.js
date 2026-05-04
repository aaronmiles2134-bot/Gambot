import 'dotenv/config';

export default {
  port: parseInt(process.env.PORT || '4174', 10),
  wsPort: parseInt(process.env.WS_PORT || '4175', 10),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModelLive: process.env.CLAUDE_MODEL_LIVE || 'claude-sonnet-4-6',
  claudeModelSummary: process.env.CLAUDE_MODEL_SUMMARY || 'claude-opus-4-7',

  obs: {
    wsUrl: process.env.OBS_WS_URL || 'ws://localhost:4455',
    wsPassword: process.env.OBS_WS_PASSWORD || '',
    casinoSourceName: process.env.OBS_CASINO_SOURCE_NAME || 'Betzillo'
  },

  ocr: {
    pollIntervalMs: parseInt(process.env.OCR_POLL_INTERVAL_MS || '500', 10),
    confidenceThreshold: parseFloat(process.env.OCR_CONFIDENCE_THRESHOLD || '0.70')
  },

  defaultPersonaIntensity: parseInt(process.env.DEFAULT_PERSONA_INTENSITY || '3', 10),

  pollRateLimit: parseInt(process.env.POLL_RATE_LIMIT_PER_IP_PER_MIN || '5', 10),

  overlay: {
    width: parseInt(process.env.OVERLAY_WIDTH || '1000', 10),
    height: parseInt(process.env.OVERLAY_HEIGHT || '190', 10),
    innerPanel: process.env.OVERLAY_INNER_PANEL !== 'false'
  },

  cooldowns: {
    drought_deep: 180,
    drought_extreme: 120,
    running_hot: 120,
    running_cold: 120,
    big_win: 0,
    mega_win: 0,
    bonus_hit: 0,
    bonus_buy_plus_ev: 240,
    drawdown_warning: 300,
    drawdown_severe: 180,
    bankroll_low: 240,
    walk_away_plus_ev: 600,
    manual: 0
  }
};
