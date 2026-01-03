export interface TradeLike {
  id: number;
  ticker: string | null;
  pl_percent: number | null;
  change_amount: number;
  default_risk_percent: number | null;
}

export type TradeStats = {
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  totalProfitUsd: number;
  totalLossUsd: number;
  netProfitUsd: number;
  avgWinUsd: number;
  avgLossUsd: number;
  rewardRatio: number;
  avgWinPercent: number;
  avgLossPercent: number;
  maxWinUsd: number;
  maxLossUsd: number;
  maxProfitPercent: number;
  maxLossPercent: number;
  maxWinStreak: number;
  maxLossStreak: number;
};

export function calculateTradeStats(trades: TradeLike[]): TradeStats {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalProfitUsd: 0,
      totalLossUsd: 0,
      netProfitUsd: 0,
      avgWinUsd: 0,
      avgLossUsd: 0,
      rewardRatio: 0,
      avgWinPercent: 0,
      avgLossPercent: 0,
      maxWinUsd: 0,
      maxLossUsd: 0,
      maxProfitPercent: 0,
      maxLossPercent: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
    };
  }

  const chronologicalTrades = [...trades].sort((a, b) => a.id - b.id);

  const winsList = chronologicalTrades.filter((t) => t.change_amount > 0);
  const lossesList = chronologicalTrades.filter((t) => t.change_amount < 0);

  const totalProfitUsd = winsList.reduce((sum, t) => sum + t.change_amount, 0);
  const totalLossUsd = lossesList.reduce((sum, t) => sum + t.change_amount, 0);

  const avgWinUsd = winsList.length > 0 ? totalProfitUsd / winsList.length : 0;
  const avgLossUsd = lossesList.length > 0 ? totalLossUsd / lossesList.length : 0;

  const avgWinPercent =
    winsList.length > 0
      ? winsList.reduce((sum, t) => sum + (t.pl_percent || 0), 0) / winsList.length
      : 0;
  const avgLossPercent =
    lossesList.length > 0
      ? lossesList.reduce((sum, t) => sum + (t.pl_percent || 0), 0) / lossesList.length
      : 0;

  let maxWinStreak = 0;
  let maxLossStreak = 0;
  let currentWinStreak = 0;
  let currentLossStreak = 0;

  chronologicalTrades.forEach((t) => {
    if (t.change_amount > 0) {
      currentWinStreak++;
      currentLossStreak = 0;
      if (currentWinStreak > maxWinStreak) maxWinStreak = currentWinStreak;
    } else if (t.change_amount < 0) {
      currentLossStreak++;
      currentWinStreak = 0;
      if (currentLossStreak > maxLossStreak) maxLossStreak = currentLossStreak;
    } else {
      currentWinStreak = 0;
      currentLossStreak = 0;
    }
  });

  return {
    totalTrades: trades.length,
    wins: winsList.length,
    losses: lossesList.length,
    winRate: (winsList.length / trades.length) * 100,
    totalProfitUsd,
    totalLossUsd,
    netProfitUsd: totalProfitUsd + totalLossUsd,
    avgWinUsd,
    avgLossUsd,
    rewardRatio: avgLossUsd !== 0 ? Math.abs(avgWinUsd / avgLossUsd) : 0,
    avgWinPercent,
    avgLossPercent,
    maxWinUsd: Math.max(...trades.map((t) => t.change_amount), 0),
    maxLossUsd: Math.min(...trades.map((t) => t.change_amount), 0),
    maxProfitPercent: Math.max(...trades.map((t) => t.pl_percent || 0), 0),
    maxLossPercent: Math.min(...trades.map((t) => t.pl_percent || 0), 0),
    maxWinStreak,
    maxLossStreak,
  };
}
