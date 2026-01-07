'use server';

import { LedgerEntry } from '@/entities/investor/types';
import { db } from '@/shared/api';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { Balance } from '@/shared/types';
import { revalidatePath } from 'next/cache';
import { Trade } from '../types';

interface TradeRowRaw extends Omit<Trade, 'profits'> {
  profits_json: string | null;
}

export async function getAllTrades(type?: TradeType): Promise<Trade[]> {
  const tradesQuery = `
    SELECT 
      t.*,
      i.name as investor_name,
      COALESCE(SUM(l_filtered.change_amount), 0) as total_pl_usd
    FROM trades t
    LEFT JOIN investors i ON t.investor_id = i.id
    LEFT JOIN (
      SELECT l.*
      FROM ledger l
      JOIN investors i2 ON l.investor_id = i2.id
      JOIN trades t2 ON l.trade_id = t2.id
      WHERE l.type = 'TRADE'
        AND (
          (t2.type = 'GLOBAL' AND i2.type = 'GLOBAL')
          OR (t2.type = 'PRIVATE' AND i2.type = 'PRIVATE')
        )
    ) l_filtered ON l_filtered.trade_id = t.id
    ${type ? 'WHERE t.type = ?' : ''}
    GROUP BY t.id
    ORDER BY t.id ASC
  `;

  const tradesRaw = (
    type ? db.prepare(tradesQuery).all(type) : db.prepare(tradesQuery).all()
  ) as (TradeRowRaw & { investor_name: string | null })[];

  // Fetch all relevant ledger entries to calculate totals from history
  const ledgerQuery = `
    SELECT l.*, i.type as investor_type
    FROM ledger l
    JOIN investors i ON l.investor_id = i.id
    ORDER BY 
      CASE 
        WHEN l.trade_id IS NULL THEN 0
        WHEN l.trade_id = -1 THEN 1
        ELSE 2
      END ASC,
      CASE 
        WHEN l.trade_id = -1 THEN 0
        WHEN l.trade_id IS NULL THEN 0
        ELSE l.trade_id
      END ASC,
      CASE 
        WHEN l.type = 'TRADE' THEN 0
        ELSE 1
      END ASC,
      l.id ASC
  `;

  const allLedgerEntries = db.prepare(ledgerQuery).all() as (LedgerEntry & {
    investor_type: TradeType;
  })[];

  const investorBalances: Record<number, { capital: number; deposit: number }> = {};
  const investorTypes: Record<number, TradeType> = {};
  const tradeTotals: Record<number, { total_cap: number; total_dep: number }> = {};

  // Group entries by trade_id and pre-map investor types
  const entriesByTrade: Record<number, typeof allLedgerEntries> = {};
  const preTradeEntries: typeof allLedgerEntries = [];

  for (const entry of allLedgerEntries) {
    investorTypes[entry.investor_id] = entry.investor_type;
    if (entry.trade_id === null || entry.trade_id === -1) {
      preTradeEntries.push(entry);
    } else {
      if (!entriesByTrade[entry.trade_id]) {
        entriesByTrade[entry.trade_id] = [];
      }
      entriesByTrade[entry.trade_id].push(entry);
    }
  }

  const applyEntry = (entry: (typeof allLedgerEntries)[0]) => {
    if (!investorBalances[entry.investor_id]) {
      investorBalances[entry.investor_id] = { capital: 0, deposit: 0 };
    }

    const bal = investorBalances[entry.investor_id];

    if (entry.type === 'TRADE') {
      bal.capital += entry.change_amount;
      bal.deposit += entry.change_amount;
    } else if (entry.type === 'CAPITAL_CHANGE') {
      if (entry.capital_before === 0 && entry.deposit_before === 0) {
        // Initial entry
        bal.capital = entry.capital_after;
        bal.deposit = entry.deposit_after;
      } else {
        bal.capital += entry.change_amount;
      }
    } else if (entry.type === 'DEPOSIT_CHANGE') {
      bal.deposit += entry.change_amount;
    } else if (entry.type === 'BOTH_CHANGE') {
      bal.capital += entry.change_amount;
      bal.deposit += entry.change_amount;
    }
  };

  // 1. Process entries that happen before or independently of trades
  for (const entry of preTradeEntries) {
    applyEntry(entry);
  }

  // 2. Process trades chronologically
  for (const trade of tradesRaw) {
    const entries = entriesByTrade[trade.id] || [];
    for (const entry of entries) {
      applyEntry(entry);
    }

    // Calculate totals for this trade
    let totalCap = 0;
    let totalDep = 0;

    for (const invIdStr in investorBalances) {
      const invId = Number(invIdStr);
      const isGlobalTrade = trade.type === 'GLOBAL';
      const investorType = investorTypes[invId];

      if (isGlobalTrade) {
        if (investorType === 'GLOBAL') {
          totalCap += investorBalances[invId].capital;
          totalDep += investorBalances[invId].deposit;
        }
      } else {
        // PRIVATE trade
        if (invId === trade.investor_id) {
          totalCap = investorBalances[invId].capital;
          totalDep = investorBalances[invId].deposit;
        }
      }
    }

    tradeTotals[trade.id] = { total_cap: totalCap, total_dep: totalDep };
  }

  const result = tradesRaw.map((t) => ({
    ...t,
    total_capital_after: tradeTotals[t.id]?.total_cap || 0,
    total_deposit_after: tradeTotals[t.id]?.total_dep || 0,
    profits: JSON.parse(t.profits_json || '[]'),
  }));

  // Return in descending order as expected by UI
  return result.reverse();
}

export async function getLatestCapital(): Promise<number> {
  const investors = (await db.prepare('SELECT id, type, is_active FROM investors').all()) as {
    id: number;
    type: TradeType;
    is_active: number;
  }[];

  const allLedger = db
    .prepare(
      `
    SELECT investor_id, type, change_amount, capital_after, deposit_after, capital_before, deposit_before
    FROM ledger
  `
    )
    .all() as LedgerEntry[];

  let totalCapital = 0;

  for (const inv of investors) {
    if (!inv.is_active || inv.type !== TradeType.GLOBAL) continue;

    const history = allLedger.filter((l) => l.investor_id === inv.id);
    let cap = 0;
    let isFirst = true;

    for (const entry of history) {
      if (entry.type === LedgerType.TRADE) {
        cap += entry.change_amount;
      } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
        if (isFirst) {
          cap = entry.capital_after;
        } else {
          cap += entry.change_amount;
        }
      } else if (entry.type === LedgerType.BOTH_CHANGE) {
        cap += entry.change_amount;
      }
      isFirst = false;
    }
    totalCapital += cap;
  }

  return totalCapital;
}

export async function addTrade({
  ticker,
  status,
  risk,
  profits,
  closedDate,
  type = TradeType.GLOBAL,
  investorId = null,
}: {
  ticker: string;
  status: TradeStatus;
  risk: number | null;
  profits: number[];
  closedDate?: string | null;
  type?: TradeType;
  investorId?: number | null;
}) {
  if (type === TradeType.PRIVATE && (!investorId || isNaN(investorId))) {
    throw new Error('Investor ID is required for private trades');
  }

  try {
    const transaction = db.transaction(() => {
      const totalPlUsd = profits.reduce((sum, p) => sum + p, 0);

      // Calculate the next number for this type/investor
      const lastTrade =
        type === TradeType.PRIVATE && investorId
          ? (db
              .prepare(
                'SELECT MAX(number) as lastNum FROM trades WHERE type = ? AND investor_id = ?'
              )
              .get(type, investorId) as { lastNum: number | null })
          : (db
              .prepare('SELECT MAX(number) as lastNum FROM trades WHERE type = ?')
              .get(TradeType.GLOBAL) as { lastNum: number | null });

      const nextNumber = (lastTrade?.lastNum || 0) + 1;

      const info = db
        .prepare(
          'INSERT INTO trades (ticker, status, default_risk_percent, profits_json, closed_date, type, investor_id, number) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          ticker,
          status,
          risk,
          JSON.stringify(profits),
          status === TradeStatus.CLOSED
            ? closedDate || new Date().toISOString().split('T')[0]
            : null,
          type,
          investorId,
          nextNumber
        );

      const tradeId = info.lastInsertRowid as number;

      if (totalPlUsd !== 0) {
        let activeStates: {
          id: number;
          last: Balance;
        }[] = [];

        if (type === TradeType.PRIVATE && investorId) {
          const investor = db.prepare('SELECT type FROM investors WHERE id = ?').get(investorId) as
            | { type: TradeType }
            | undefined;

          if (!investor) {
            throw new Error(`Investor with ID ${investorId} not found`);
          }

          const investorType = investor.type;

          const last = db
            .prepare(
              `
            SELECT l.capital_after, l.deposit_after
            FROM ledger l
            LEFT JOIN trades t ON l.trade_id = t.id
            WHERE l.investor_id = ?
            AND (
              l.type != 'TRADE'
              OR t.type IS NULL
              OR t.type = ?
            )
            ORDER BY l.id DESC LIMIT 1
          `
            )
            .get(investorId, investorType) as Balance | undefined;

          activeStates = [
            {
              id: investorId,
              last: last || { capital_after: 0, deposit_after: 0 },
            },
          ];
        } else {
          const investors = db
            .prepare('SELECT id FROM investors WHERE is_active = 1 AND type = ?')
            .all(TradeType.GLOBAL) as {
            id: number;
          }[];

          activeStates = investors
            .map((inv) => ({
              id: inv.id,
              last: db
                .prepare(
                  'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
                )
                .get(inv.id) as Balance | undefined,
            }))
            .filter(
              (s): s is { id: number; last: Balance } => s.last != null && s.last.capital_after > 0
            );
        }

        const totalCapitalBefore = activeStates.reduce((sum, s) => sum + s.last.capital_after, 0);

        if (type === TradeType.PRIVATE || totalCapitalBefore > 0) {
          for (const s of activeStates) {
            const share =
              type === TradeType.PRIVATE ? 1 : s.last.capital_after / totalCapitalBefore;
            const investorPlUsd = totalPlUsd * share;

            db.prepare(
              `
            INSERT INTO ledger (
              investor_id, trade_id, type, ticker, change_amount, 
              capital_before, capital_after, deposit_before, deposit_after, closed_date, default_risk_percent
            ) VALUES (?, ?, 'TRADE', ?, ?, ?, ?, ?, ?, ?, ?)
          `
            ).run(
              s.id,
              tradeId,
              ticker,
              investorPlUsd,
              s.last.capital_after,
              s.last.capital_after + investorPlUsd,
              s.last.deposit_after,
              s.last.deposit_after + investorPlUsd,
              status === TradeStatus.CLOSED
                ? closedDate || new Date().toISOString().split('T')[0]
                : null,
              risk
            );
          }
        }
      }
    });

    transaction();
  } catch (error) {
    console.error('Error in addTrade transaction:', error);
    throw error;
  }

  revalidatePath('/');
  revalidatePath('/trades');
  revalidatePath('/investors');
  revalidatePath('/total');
}

export async function updateTrade({
  id,
  ticker,
  closedDate,
  status,
  profits,
  risk,
}: {
  id: number;
  ticker?: string;
  closedDate: string;
  status: TradeStatus;
  profits?: number[];
  risk?: number | null;
}) {
  const affectedInvestorIds = new Set<number>();

  const transaction = db.transaction(() => {
    const updates: string[] = ['closed_date = ?', 'status = ?'];
    const params: (string | number | null)[] = [closedDate, status];

    if (ticker !== undefined) {
      updates.push('ticker = ?');
      params.push(ticker);
    }

    if (profits !== undefined) {
      updates.push('profits_json = ?');
      params.push(JSON.stringify(profits));
    }

    if (risk !== undefined) {
      updates.push('default_risk_percent = ?');
      params.push(risk);
    }

    params.push(id);
    db.prepare(`UPDATE trades SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    const ledgerUpdates: string[] = ['closed_date = ?'];
    const ledgerParams: (string | number | null)[] = [closedDate];

    if (ticker !== undefined) {
      ledgerUpdates.push('ticker = ?');
      ledgerParams.push(ticker);
    }

    if (risk !== undefined) {
      ledgerUpdates.push('default_risk_percent = ?');
      ledgerParams.push(risk);
    }

    ledgerParams.push(id);
    db.prepare(`UPDATE ledger SET ${ledgerUpdates.join(', ')} WHERE trade_id = ?`).run(
      ...ledgerParams
    );

    if (profits !== undefined) {
      const newTotalPlUsd = profits.reduce((sum, p) => sum + p, 0);

      const trade = db.prepare('SELECT type, investor_id FROM trades WHERE id = ?').get(id) as
        | { type: TradeType; investor_id: number | null }
        | undefined;

      // Filter ledger entries by trade type and investor type
      const ledgerEntriesQuery =
        trade?.type === TradeType.PRIVATE && trade.investor_id
          ? `
          SELECT l.*
          FROM ledger l
          JOIN investors i ON l.investor_id = i.id
          WHERE l.trade_id = ? AND l.type = 'TRADE' AND l.investor_id = ?
        `
          : `
          SELECT l.*
          FROM ledger l
          JOIN investors i ON l.investor_id = i.id
          WHERE l.trade_id = ? AND l.type = 'TRADE' AND i.type = ?
        `;

      const ledgerEntries = (
        trade?.type === TradeType.PRIVATE && trade.investor_id
          ? db.prepare(ledgerEntriesQuery).all(id, trade.investor_id)
          : db.prepare(ledgerEntriesQuery).all(id, TradeType.GLOBAL)
      ) as {
        id: number;
        investor_id: number;
        change_amount: number;
        capital_before: number;
      }[];

      if (ledgerEntries.length > 0) {
        const currentTotalPlUsd = ledgerEntries.reduce((sum, l) => sum + l.change_amount, 0);

        if (currentTotalPlUsd !== 0) {
          // Proportional update
          for (const entry of ledgerEntries) {
            const share = entry.change_amount / currentTotalPlUsd;
            const newInvestorPlUsd = newTotalPlUsd * share;
            db.prepare('UPDATE ledger SET change_amount = ? WHERE id = ?').run(
              newInvestorPlUsd,
              entry.id
            );
            affectedInvestorIds.add(entry.investor_id);
          }
        } else {
          // If previous total was 0, use capital_before share
          const totalCapitalBefore = ledgerEntries.reduce((sum, l) => sum + l.capital_before, 0);
          if (totalCapitalBefore > 0) {
            for (const entry of ledgerEntries) {
              const share = entry.capital_before / totalCapitalBefore;
              const newInvestorPlUsd = newTotalPlUsd * share;
              db.prepare('UPDATE ledger SET change_amount = ? WHERE id = ?').run(
                newInvestorPlUsd,
                entry.id
              );
              affectedInvestorIds.add(entry.investor_id);
            }
          }
        }
      } else if (newTotalPlUsd !== 0) {
        const trade = db.prepare('SELECT type, investor_id FROM trades WHERE id = ?').get(id) as
          | { type: TradeType; investor_id: number | null }
          | undefined;

        let investors: { id: number }[];
        if (trade?.type === TradeType.PRIVATE && trade.investor_id) {
          investors = [{ id: trade.investor_id }];
        } else {
          investors = db
            .prepare('SELECT id FROM investors WHERE is_active = 1 AND type = ?')
            .all(TradeType.GLOBAL) as { id: number }[];
        }

        const activeStates = investors
          .map((inv) => ({
            id: inv.id,
            last: db
              .prepare(
                'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
              )
              .get(inv.id) as Balance | undefined,
          }))
          .filter(
            (s): s is { id: number; last: Balance } => s.last != null && s.last.capital_after > 0
          );

        const totalCapitalBefore = activeStates.reduce((sum, s) => sum + s.last.capital_after, 0);

        if (totalCapitalBefore > 0) {
          const tradeData = db
            .prepare('SELECT ticker, default_risk_percent FROM trades WHERE id = ?')
            .get(id) as { ticker: string; default_risk_percent: number | null };

          for (const s of activeStates) {
            const share =
              trade?.type === TradeType.PRIVATE ? 1 : s.last.capital_after / totalCapitalBefore;
            const investorPlUsd = newTotalPlUsd * share;

            db.prepare(
              `
              INSERT INTO ledger (
                investor_id, trade_id, type, ticker, change_amount, 
                capital_before, capital_after, deposit_before, deposit_after, closed_date, default_risk_percent
              ) VALUES (?, ?, 'TRADE', ?, ?, ?, ?, ?, ?, ?, ?)
            `
            ).run(
              s.id,
              id,
              tradeData.ticker,
              investorPlUsd,
              s.last.capital_after,
              s.last.capital_after + investorPlUsd,
              s.last.deposit_after,
              s.last.deposit_after + investorPlUsd,
              closedDate,
              tradeData.default_risk_percent
            );
          }
        }
      }
    }
  });

  transaction();

  // Recalculate all affected investors after transaction
  for (const investorId of affectedInvestorIds) {
    await recalculateInvestorBalances(investorId);
  }

  revalidatePath('/');
  revalidatePath('/trades');
  revalidatePath('/investors');
  revalidatePath('/total');
}

export async function recalculateInvestorBalances(_investorId: number) {
  // This function is now just a placeholder for potential side effects (like clearing cache)
  // because we calculate all balances on-the-fly from change_amount.
  return;
}

export async function deleteTrade(id: number) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM ledger WHERE trade_id = ?').run(id);
    db.prepare('DELETE FROM trades WHERE id = ?').run(id);
  });

  transaction();
  revalidatePath('/');
  revalidatePath('/trades');
  revalidatePath('/investors');
  revalidatePath('/total');
}
