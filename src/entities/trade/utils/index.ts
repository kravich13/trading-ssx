import { Trade } from '../types';

export function getInitialTradeProfits(trade: Trade | null): (number | string)[] {
  if (!trade) return [''];

  const initialProfits: (number | string)[] = trade.profits || [];

  if (initialProfits.length === 0 && trade.total_pl_usd != null && trade.total_pl_usd !== 0) {
    return [trade.total_pl_usd];
  }

  if (initialProfits.length === 0) {
    return [''];
  }

  return initialProfits;
}
