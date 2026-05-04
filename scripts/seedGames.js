import db from '../server/db.js';

const GAMES = [
  { name: 'Gates of Olympus', provider: 'Pragmatic Play', rtp: 0.9651, volatility: 'high', avg_spins_to_bonus: 102, avg_bonus_multiplier: 75, bonus_buy_available: 1, bonus_buy_cost_x: 100, bonus_buy_rtp: null },
  { name: 'Sweet Bonanza', provider: 'Pragmatic Play', rtp: 0.9645, volatility: 'high', avg_spins_to_bonus: 95, avg_bonus_multiplier: 60, bonus_buy_available: 1, bonus_buy_cost_x: 100, bonus_buy_rtp: null },
  { name: 'Big Bass Bonanza', provider: 'Pragmatic Play', rtp: 0.9671, volatility: 'high', avg_spins_to_bonus: 120, avg_bonus_multiplier: 55, bonus_buy_available: 1, bonus_buy_cost_x: 100, bonus_buy_rtp: null },
  { name: 'Razor Shark', provider: 'Push Gaming', rtp: 0.9651, volatility: 'high', avg_spins_to_bonus: 85, avg_bonus_multiplier: 80, bonus_buy_available: 0, bonus_buy_cost_x: null, bonus_buy_rtp: null },
  { name: 'Mental', provider: 'Nolimit City', rtp: 0.9627, volatility: 'extreme', avg_spins_to_bonus: 200, avg_bonus_multiplier: 200, bonus_buy_available: 1, bonus_buy_cost_x: 500, bonus_buy_rtp: null },
  { name: 'Punk Toilet', provider: 'Nolimit City', rtp: 0.9627, volatility: 'extreme', avg_spins_to_bonus: 180, avg_bonus_multiplier: 180, bonus_buy_available: 1, bonus_buy_cost_x: 500, bonus_buy_rtp: null },
  { name: 'San Quentin', provider: 'Nolimit City', rtp: 0.9698, volatility: 'extreme', avg_spins_to_bonus: 178, avg_bonus_multiplier: 250, bonus_buy_available: 1, bonus_buy_cost_x: 600, bonus_buy_rtp: null },
  { name: 'The Dog House', provider: 'Pragmatic Play', rtp: 0.9650, volatility: 'high', avg_spins_to_bonus: 90, avg_bonus_multiplier: 50, bonus_buy_available: 1, bonus_buy_cost_x: 100, bonus_buy_rtp: null },
  { name: 'Wanted Dead or a Wild', provider: 'Hacksaw Gaming', rtp: 0.9650, volatility: 'extreme', avg_spins_to_bonus: 150, avg_bonus_multiplier: 150, bonus_buy_available: 1, bonus_buy_cost_x: 250, bonus_buy_rtp: null },
  { name: 'Money Train 4', provider: 'Relax Gaming', rtp: 0.9660, volatility: 'extreme', avg_spins_to_bonus: 160, avg_bonus_multiplier: 200, bonus_buy_available: 1, bonus_buy_cost_x: 500, bonus_buy_rtp: null },
  { name: 'Fruit Party', provider: 'Pragmatic Play', rtp: 0.9650, volatility: 'high', avg_spins_to_bonus: 88, avg_bonus_multiplier: 45, bonus_buy_available: 0, bonus_buy_cost_x: null, bonus_buy_rtp: null }
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO games
    (name, provider, rtp, volatility, avg_spins_to_bonus, avg_bonus_multiplier,
     bonus_buy_available, bonus_buy_cost_x, bonus_buy_rtp)
  VALUES
    (@name, @provider, @rtp, @volatility, @avg_spins_to_bonus, @avg_bonus_multiplier,
     @bonus_buy_available, @bonus_buy_cost_x, @bonus_buy_rtp)
`);

const seedAll = db.transaction(() => {
  for (const game of GAMES) {
    const info = insert.run(game);
    if (info.changes > 0) {
      console.log(`  + Inserted: ${game.name}`);
    } else {
      console.log(`  ~ Skipped (exists): ${game.name}`);
    }
  }
});

console.log('Seeding games…');
seedAll();
console.log('Done.');

export default seedAll;
