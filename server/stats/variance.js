/**
 * Compare observed RTP to expected RTP using a normal approximation.
 * approxStdev = 1.5 / sqrt(spins) — empirical rule for high-volatility slots.
 */
export function rtpVariance({ totalWagered, totalReturned, expectedRtp, spins }) {
  if (totalWagered === 0 || spins === 0) return null;

  const observedRtp = totalReturned / totalWagered;
  const delta = observedRtp - expectedRtp;
  const approxStdev = 1.5 / Math.sqrt(spins);
  const z = delta / approxStdev;

  let label;
  if (z > 2) label = 'running scorching';
  else if (z > 1.5) label = 'running warm';
  else if (z < -2) label = 'running brutally cold';
  else if (z < -1.5) label = 'running cold';
  else label = 'within expectation';

  return {
    observedRtp,
    expectedRtp,
    delta,
    zScore: z,
    state: z > 1.5 ? 'hot' : z < -1.5 ? 'cold' : 'expected',
    label
  };
}
