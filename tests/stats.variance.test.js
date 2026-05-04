import { describe, it, expect } from 'vitest';
import { rtpVariance } from '../server/stats/variance.js';

describe('rtpVariance', () => {
  it('returns null when totalWagered is 0', () => {
    expect(rtpVariance({ totalWagered: 0, totalReturned: 0, expectedRtp: 0.965, spins: 0 })).toBeNull();
  });

  it('returns null when spins is 0', () => {
    expect(rtpVariance({ totalWagered: 100, totalReturned: 96, expectedRtp: 0.965, spins: 0 })).toBeNull();
  });

  it('correctly calculates observedRtp', () => {
    const r = rtpVariance({ totalWagered: 200, totalReturned: 180, expectedRtp: 0.965, spins: 200 });
    expect(r.observedRtp).toBeCloseTo(0.9, 10);
  });

  it('delta = observedRtp - expectedRtp', () => {
    const r = rtpVariance({ totalWagered: 100, totalReturned: 100, expectedRtp: 0.965, spins: 100 });
    expect(r.delta).toBeCloseTo(1.0 - 0.965, 10);
  });

  it('state is "hot" when running above expected', () => {
    // 1 spin, stdev=1.5; need delta>2.25 for hot. returned=41 on wagered=10 → observedRtp=4.1, z≈2.09
    const r = rtpVariance({ totalWagered: 10, totalReturned: 41, expectedRtp: 0.965, spins: 1 });
    expect(r.state).toBe('hot');
    expect(r.zScore).toBeGreaterThan(1.5);
  });

  it('state is "cold" when returning nothing', () => {
    const r = rtpVariance({ totalWagered: 100, totalReturned: 0, expectedRtp: 0.965, spins: 100 });
    expect(r.state).toBe('cold');
    expect(r.zScore).toBeLessThan(-1.5);
  });

  it('state is "expected" at exactly expected RTP', () => {
    const r = rtpVariance({ totalWagered: 1000, totalReturned: 965, expectedRtp: 0.965, spins: 1000 });
    expect(r.state).toBe('expected');
    expect(r.zScore).toBeCloseTo(0, 5);
  });

  it('label is "running scorching" when z > 2', () => {
    // stdev=1.5 at 1 spin; need observedRtp > 3.965 → returned=41 on wagered=10 gives z≈2.09
    const r = rtpVariance({ totalWagered: 10, totalReturned: 41, expectedRtp: 0.965, spins: 1 });
    expect(r.label).toBe('running scorching');
    expect(r.zScore).toBeGreaterThan(2);
  });

  it('label is "running brutally cold" when z < -2', () => {
    const r = rtpVariance({ totalWagered: 1000, totalReturned: 0, expectedRtp: 0.965, spins: 1000 });
    expect(r.label).toBe('running brutally cold');
  });

  it('label is "within expectation" at z=0', () => {
    const r = rtpVariance({ totalWagered: 500, totalReturned: 482.5, expectedRtp: 0.965, spins: 500 });
    expect(r.label).toBe('within expectation');
  });

  it('zScore is 0 at exactly expected RTP for any sample size', () => {
    [10, 100, 1000].forEach(n => {
      const r = rtpVariance({ totalWagered: n, totalReturned: n * 0.965, expectedRtp: 0.965, spins: n });
      expect(r.zScore).toBeCloseTo(0, 5);
    });
  });

  it('same delta is more extreme with more spins (stdev narrows)', () => {
    const small = rtpVariance({ totalWagered: 100, totalReturned: 96.5, expectedRtp: 0.9999, spins: 10 });
    const large = rtpVariance({ totalWagered: 1000, totalReturned: 965, expectedRtp: 0.9999, spins: 1000 });
    expect(Math.abs(large.zScore)).toBeGreaterThan(Math.abs(small.zScore));
  });
});
