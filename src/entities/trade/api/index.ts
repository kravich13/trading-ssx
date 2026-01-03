'use server';

import { db } from '@/shared/api';
import { TradeStatus } from '@/shared/enum';
import { revalidatePath } from 'next/cache';
import { Trade } from '../types';

export async function getAllTrades(): Promise<Trade[]> {
  const trades = db
    .prepare(
      `
    SELECT 
      t.*,
      SUM(l.change_amount) as total_pl_usd,
      SUM(l.capital_after) as total_capital_after,
      SUM(l.deposit_after) as total_deposit_after
    FROM trades t
    LEFT JOIN ledger l ON l.trade_id = t.id AND l.type = 'TRADE'
    GROUP BY t.id
    ORDER BY t.id DESC
  `
    )
    .all() as Trade[];
  return trades;
}

export async function updateTrade(id: number, closedDate: string, status: TradeStatus) {
  db.prepare('UPDATE trades SET closed_date = ?, status = ? WHERE id = ?').run(
    closedDate,
    status,
    id
  );

  db.prepare('UPDATE ledger SET closed_date = ? WHERE trade_id = ?').run(closedDate, id);

  revalidatePath('/');
  revalidatePath('/trades');
}

export async function deleteTrade(id: number) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM ledger WHERE trade_id = ?').run(id);
    db.prepare('DELETE FROM trades WHERE id = ?').run(id);
  });

  transaction();
  revalidatePath('/');
  revalidatePath('/trades');
}
