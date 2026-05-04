/**
 * Compare expected value of buying the bonus now vs grinding to it organically.
 * Both outcomes are negative EV (house edge), so "better" means less negative.
 */
export function bonusBuyVsGrind({
  betSize,
  bonusBuyCostX,
  avgBonusMultiplier,
  bonusBuyRtp,
  baseRtp,
  spinsRemainingBudget
}) {
  const buyCost = betSize * bonusBuyCostX;
  const buyExpectedReturn = buyCost * (bonusBuyRtp != null ? bonusBuyRtp : baseRtp);
  const buyEv = buyExpectedReturn - buyCost;

  const grindWagered = betSize * spinsRemainingBudget;
  const grindExpectedReturn = grindWagered * baseRtp;
  const grindEv = grindExpectedReturn - grindWagered;

  const delta = buyEv - grindEv;

  return {
    buy: { cost: buyCost, expectedReturn: buyExpectedReturn, ev: buyEv },
    grind: { wagered: grindWagered, expectedReturn: grindExpectedReturn, ev: grindEv },
    delta,
    recommendation: buyEv > grindEv ? 'buy' : 'grind',
    confidencePoints: Math.min(100, Math.abs(delta) / betSize * 5)
  };
}
