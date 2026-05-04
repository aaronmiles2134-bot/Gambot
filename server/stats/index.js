import { bonusDroughtProbability, probabilityOfBonusInNext } from './probability.js';
import { bonusBuyVsGrind } from './ev.js';
import { rtpVariance } from './variance.js';
import { spinsRemaining, sessionDrawdown } from './bankroll.js';

/**
 * Build a full stats snapshot for a given spin context.
 * This is the canonical object passed to triggers and Claude.
 */
export function buildStatsSnapshot({ spin, stint, session, game }) {
  const drought = bonusDroughtProbability(
    stint.spins_since_bonus,
    game.avg_spins_to_bonus
  );

  const variance = rtpVariance({
    totalWagered: stint.total_wagered,
    totalReturned: stint.total_returned,
    expectedRtp: game.rtp,
    spins: stint.spins
  });

  const bankroll = spinsRemaining({
    balance: spin.balance_after,
    betSize: spin.bet_size,
    rtp: game.rtp
  });

  const drawdown = sessionDrawdown({
    startBalance: session.start_balance,
    currentBalance: spin.balance_after
  });

  let evAnalysis = null;
  if (game.bonus_buy_available && bankroll !== Infinity) {
    evAnalysis = bonusBuyVsGrind({
      betSize: spin.bet_size,
      bonusBuyCostX: game.bonus_buy_cost_x,
      avgBonusMultiplier: game.avg_bonus_multiplier,
      bonusBuyRtp: game.bonus_buy_rtp,
      baseRtp: game.rtp,
      spinsRemainingBudget: Math.min(bankroll, game.avg_spins_to_bonus)
    });
  }

  return {
    drought,
    variance,
    bankroll,
    drawdown,
    evAnalysis,
    game: {
      name: game.name,
      rtp: game.rtp,
      volatility: game.volatility,
      avgSpinsToBonus: game.avg_spins_to_bonus
    },
    stint: {
      spins: stint.spins,
      spinsSinceBonus: stint.spins_since_bonus,
      totalWagered: stint.total_wagered,
      totalReturned: stint.total_returned
    },
    session: {
      totalSpins: session.total_spins,
      totalWagered: session.total_wagered,
      totalReturned: session.total_returned
    }
  };
}

export {
  bonusDroughtProbability,
  probabilityOfBonusInNext,
  bonusBuyVsGrind,
  rtpVariance,
  spinsRemaining,
  sessionDrawdown
};
