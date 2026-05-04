import { describe, it, expect } from 'vitest';
import { bonusDroughtProbability, probabilityOfBonusInNext } from '../server/stats/probability.js';

describe('bonusDroughtProbability', () => {
  it('returns 0 droughtPercentile at 0 spins', () => {
    const r = bonusDroughtProbability(0, 100);
    expect(r.droughtPercentile).toBe(0);
    expect(r.probability).toBe(1);
    expect(r.isStatisticallyDeep).toBe(false);
    expect(r.isExtremeOutlier).toBe(false);
  });

  it('reflects correct hit rate from avgSpinsToBonus', () => {
    const r = bonusDroughtProbability(0, 200);
    expect(r.expectedHitRate).toBeCloseTo(0.005, 10);
  });

  it('marks isStatisticallyDeep when probability < 0.10', () => {
    // ~230 spins at avg 100 → P(no bonus) ≈ 0.099
    const r = bonusDroughtProbability(230, 100);
    expect(r.isStatisticallyDeep).toBe(true);
    expect(r.droughtPercentile).toBeGreaterThan(90);
  });

  it('marks isExtremeOutlier when probability < 0.01', () => {
    const r = bonusDroughtProbability(461, 100);
    expect(r.isExtremeOutlier).toBe(true);
    expect(r.isStatisticallyDeep).toBe(true);
  });

  it('droughtPercentile approaches 100 for very deep droughts', () => {
    const r = bonusDroughtProbability(2000, 100);
    expect(r.droughtPercentile).toBeCloseTo(100, 5);
  });

  it('droughtPercentile = (1 - probability) * 100', () => {
    const r = bonusDroughtProbability(50, 100);
    expect(r.droughtPercentile).toBeCloseTo((1 - r.probability) * 100, 10);
  });

  it('works with extreme volatility games (avgSpinsToBonus=200)', () => {
    const r = bonusDroughtProbability(100, 200);
    expect(r.probability).toBeCloseTo(Math.pow(1 - 1 / 200, 100), 10);
  });
});

describe('probabilityOfBonusInNext', () => {
  it('returns 0 for n=0', () => {
    expect(probabilityOfBonusInNext(0, 100)).toBe(0);
  });

  it('returns near 1 for very large n', () => {
    expect(probabilityOfBonusInNext(10000, 100)).toBeCloseTo(1, 5);
  });

  it('is complement of no-bonus probability', () => {
    const avg = 100;
    const n = 50;
    const hitRate = 1 / avg;
    const noBonus = Math.pow(1 - hitRate, n);
    expect(probabilityOfBonusInNext(n, avg)).toBeCloseTo(1 - noBonus, 10);
  });

  it('increases monotonically with n', () => {
    const avg = 85;
    const p1 = probabilityOfBonusInNext(10, avg);
    const p2 = probabilityOfBonusInNext(50, avg);
    const p3 = probabilityOfBonusInNext(150, avg);
    expect(p1).toBeLessThan(p2);
    expect(p2).toBeLessThan(p3);
  });

  it('at n = avgSpinsToBonus probability is ~63%', () => {
    // 1 - (1 - 1/N)^N → 1 - 1/e ≈ 0.6321 as N→∞
    const p = probabilityOfBonusInNext(100, 100);
    expect(p).toBeGreaterThan(0.62);
    expect(p).toBeLessThan(0.65);
  });
});
