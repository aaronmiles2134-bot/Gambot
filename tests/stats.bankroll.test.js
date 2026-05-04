import { describe, it, expect } from 'vitest';
import { spinsRemaining, sessionDrawdown } from '../server/stats/bankroll.js';

describe('spinsRemaining', () => {
  it('returns Infinity when rtp === 1', () => {
    expect(spinsRemaining({ balance: 1000, betSize: 1, rtp: 1 })).toBe(Infinity);
  });

  it('returns Infinity when rtp > 1 (player advantage)', () => {
    expect(spinsRemaining({ balance: 1000, betSize: 1, rtp: 1.05 })).toBe(Infinity);
  });

  it('returns balance / (betSize * (1 - rtp))', () => {
    const result = spinsRemaining({ balance: 1000, betSize: 1, rtp: 0.965 });
    expect(result).toBeCloseTo(1000 / (1 * (1 - 0.965)), 5);
  });

  it('halves when betSize doubles', () => {
    const r1 = spinsRemaining({ balance: 1000, betSize: 1, rtp: 0.96 });
    const r2 = spinsRemaining({ balance: 1000, betSize: 2, rtp: 0.96 });
    expect(r2).toBeCloseTo(r1 / 2, 5);
  });

  it('doubles when balance doubles', () => {
    const r1 = spinsRemaining({ balance: 500, betSize: 1, rtp: 0.965 });
    const r2 = spinsRemaining({ balance: 1000, betSize: 1, rtp: 0.965 });
    expect(r2).toBeCloseTo(r1 * 2, 5);
  });

  it('returns 0 when balance is 0', () => {
    expect(spinsRemaining({ balance: 0, betSize: 1, rtp: 0.96 })).toBe(0);
  });

  it('bankroll_low trigger: small balance yields < 25 spins', () => {
    const result = spinsRemaining({ balance: 0.5, betSize: 1, rtp: 0.96 });
    expect(result).toBeLessThan(25);
  });
});

describe('sessionDrawdown', () => {
  it('returns zero drawdown when balance is unchanged', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 1000 });
    expect(r.drawdownPct).toBe(0);
    expect(r.pnl).toBe(0);
    expect(r.pnlPct).toBe(0);
  });

  it('calculates 30% drawdown correctly', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 700 });
    expect(r.drawdownPct).toBeCloseTo(30, 5);
    expect(r.pnl).toBe(-300);
    expect(r.pnlPct).toBeCloseTo(-30, 5);
  });

  it('calculates 50% drawdown (severe warning threshold)', () => {
    const r = sessionDrawdown({ startBalance: 2000, currentBalance: 1000 });
    expect(r.drawdownPct).toBeCloseTo(50, 5);
  });

  it('pnl is positive when running ahead', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 1500 });
    expect(r.pnl).toBe(500);
    expect(r.pnlPct).toBeCloseTo(50, 5);
    expect(r.drawdownPct).toBeCloseTo(-50, 5);
  });

  it('drawdownPct = -pnlPct', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 800 });
    expect(r.drawdownPct).toBeCloseTo(-r.pnlPct, 10);
  });

  it('100% drawdown when busted', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 0 });
    expect(r.drawdownPct).toBeCloseTo(100, 5);
    expect(r.pnl).toBe(-1000);
  });

  it('walk_away_plus_ev: up 100% → pnlPct is 100', () => {
    const r = sessionDrawdown({ startBalance: 1000, currentBalance: 2000 });
    expect(r.drawdownPct).toBeCloseTo(-100, 5);
    expect(r.pnlPct).toBeCloseTo(100, 5);
  });
});
