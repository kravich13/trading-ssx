import { Trade } from '@/entities/trade/types';
import { calculatePlPercentFromAfter } from '@/shared/utils';

export function processTotalTradesData(trades: Trade[]) {
  const tradeLikeData = trades.map((t) => {
    const change_amount = t.total_pl_usd;

    const pl_percent = calculatePlPercentFromAfter(t.total_capital_after, change_amount);

    return {
      id: t.id,
      ticker: t.ticker,
      pl_percent,
      change_amount,
      absolute_value: t.total_capital_after,
      deposit_value: t.total_deposit_after,
      default_risk_percent: t.default_risk_percent,
    };
  });

  let initialTotalDeposit = 0;
  let initialTotalCapital = 0;

  if (trades.length > 0) {
    const totalProjectPl = trades.reduce((sum, t) => {
      return sum + t.total_pl_usd;
    }, 0);

    const latestTrade = trades[0];
    initialTotalDeposit = latestTrade.total_deposit_after - totalProjectPl;
    initialTotalCapital = latestTrade.total_capital_after - totalProjectPl;
  }

  return {
    tradeLikeData,
    initialTotalDeposit,
    initialTotalCapital,
  };
}
