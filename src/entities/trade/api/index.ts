'use server';

import { db } from '@/shared/api';
import { Trade } from '../types';

export async function getAllTrades(): Promise<Trade[]> {
  const trades = db
    .prepare(
      `
    SELECT 
      t.*,
      SUM(l.change_amount) as total_pl_usd,
      SUM(l.capital_after) as total_capital_after
    FROM trades t
    LEFT JOIN ledger l ON l.trade_id = t.id AND l.type = 'TRADE'
    GROUP BY t.id
    ORDER BY t.id DESC
  `
    )
    .all() as Trade[];
  return trades;
}
