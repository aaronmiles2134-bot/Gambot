/**
 * How many spins before the expected loss drains the balance.
 * Returns Infinity if RTP >= 1 (house has no edge).
 */
export function spinsRemaining({ balance, betSize, rtp }) {
  const expectedLossPerSpin = betSize * (1 - rtp);
  if (expectedLossPerSpin <= 0) return Infinity;
  return balance / expectedLossPerSpin;
}

/**
 * Session P&L relative to the starting balance.
 */
export function sessionDrawdown({ startBalance, currentBalance }) {
  return {
    drawdownPct: ((startBalance - currentBalance) / startBalance) * 100,
    pnl: currentBalance - startBalance,
    pnlPct: ((currentBalance - startBalance) / startBalance) * 100
  };
}
