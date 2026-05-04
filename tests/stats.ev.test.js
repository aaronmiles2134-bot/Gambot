import { describe, it, expect } from 'vitest';
import { bonusBuyVsGrind } from '../server/stats/ev.js';

const BASE = {
  betSize: 1,
  bonusBuyCostX: 100,
  avgBonusMultiplier: 75,
  bonusBuyRtp: null,
  baseRtp: 0.9651,
  spinsRemainingBudget: 100
};

describe('bonusBuyVsGrind', () => {
  it('buy cost equals betSize * bonusBuyCostX', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.buy.cost).toBe(100);
  });

  it('buy expectedReturn uses baseRtp when bonusBuyRtp is null', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.buy.expectedReturn).toBeCloseTo(100 * 0.9651, 10);
  });

  it('buy expectedReturn uses bonusBuyRtp when provided', () => {
    const r = bonusBuyVsGrind({ ...BASE, bonusBuyRtp: 0.98 });
    expect(r.buy.expectedReturn).toBeCloseTo(100 * 0.98, 10);
  });

  it('buyEv is negative under house edge', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.buy.ev).toBeCloseTo(r.buy.expectedReturn - r.buy.cost, 10);
    expect(r.buy.ev).toBeLessThan(0);
  });

  it('grind wagered = betSize * spinsRemainingBudget', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.grind.wagered).toBe(100);
  });

  it('grindEv = grind expectedReturn - wagered', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.grind.ev).toBeCloseTo(r.grind.expectedReturn - r.grind.wagered, 10);
  });

  it('delta = buyEv - grindEv', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.delta).toBeCloseTo(r.buy.ev - r.grind.ev, 10);
  });

  it('recommends grind when spinsRemainingBudget is 0 (grindEv=0 beats buyEv<0)', () => {
    // grindEv=0 (nothing wagered), buyEv=-3.49 → grind wins
    const r = bonusBuyVsGrind({ ...BASE, spinsRemainingBudget: 0 });
    expect(r.recommendation).toBe('grind');
    expect(r.grind.ev).toBe(0);
    expect(r.buy.ev).toBeLessThan(0);
  });

  it('recommends buy when budget is very large (grinding costs more than buying)', () => {
    // grindEv≈-349, buyEv≈-3.49 → buy wins
    const r = bonusBuyVsGrind({ ...BASE, spinsRemainingBudget: 10000 });
    expect(r.recommendation).toBe('buy');
    expect(r.grind.ev).toBeLessThan(r.buy.ev);
  });

  it('confidencePoints is capped at 100', () => {
    const r = bonusBuyVsGrind({ ...BASE, betSize: 0.0001, spinsRemainingBudget: 0 });
    expect(r.confidencePoints).toBeLessThanOrEqual(100);
  });

  it('confidencePoints >= 0', () => {
    const r = bonusBuyVsGrind(BASE);
    expect(r.confidencePoints).toBeGreaterThanOrEqual(0);
  });

  it('scales linearly with betSize', () => {
    const r1 = bonusBuyVsGrind({ ...BASE, betSize: 1 });
    const r2 = bonusBuyVsGrind({ ...BASE, betSize: 5 });
    expect(r2.buy.cost).toBeCloseTo(r1.buy.cost * 5, 5);
    expect(r2.delta).toBeCloseTo(r1.delta * 5, 5);
  });
});
