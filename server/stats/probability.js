/**
 * P(no bonus in N spins) = (1 - hitRate)^N
 * Returns percentile in which we find this drought: higher = rarer cold streak.
 */
export function bonusDroughtProbability(spinsWithoutBonus, avgSpinsToBonus) {
  const hitRate = 1 / avgSpinsToBonus;
  const probability = Math.pow(1 - hitRate, spinsWithoutBonus);
  return {
    probability,
    droughtPercentile: (1 - probability) * 100,
    expectedHitRate: hitRate,
    isStatisticallyDeep: probability < 0.10,
    isExtremeOutlier: probability < 0.01
  };
}

/**
 * P(at least one bonus in next N spins) = 1 - (1 - hitRate)^N
 */
export function probabilityOfBonusInNext(n, avgSpinsToBonus) {
  const hitRate = 1 / avgSpinsToBonus;
  return 1 - Math.pow(1 - hitRate, n);
}
