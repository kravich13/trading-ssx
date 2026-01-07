'use server';

import { db } from '@/shared/api';
import { TradeStatus, TradeType } from '@/shared/enum';
import { Balance } from '@/shared/types';
import { revalidatePath } from 'next/cache';
import { Trade } from '../types';

interface TradeRowRaw extends Omit<Trade, 'profits'> {
  profits_json: string | null;
}

export async function getAllTrades(type?: TradeType): Promise<Trade[]> {
  const query = `
    SELECT 
      t.*,
      COALESCE(SUM(l_filtered.change_amount), 0) as total_pl_usd,
      COALESCE(MAX(l_all.total_cap), 0) as total_capital_after,
      COALESCE(MAX(l_all.total_dep), 0) as total_deposit_after
    FROM trades t
    LEFT JOIN (
      SELECT l.*
      FROM ledger l
      JOIN investors i ON l.investor_id = i.id
      JOIN trades t2 ON l.trade_id = t2.id
      WHERE l.type = 'TRADE'
        AND (
          (t2.type = 'GLOBAL' AND i.type = 'GLOBAL')
          OR (t2.type = 'PRIVATE' AND i.type = 'PRIVATE')
        )
    ) l_filtered ON l_filtered.trade_id = t.id
    LEFT JOIN (
      SELECT 
        l.trade_id, 
        SUM(l.capital_after) as total_cap, 
        SUM(l.deposit_after) as total_dep
      FROM ledger l
      JOIN trades t2 ON l.trade_id = t2.id
      JOIN investors i ON l.investor_id = i.id
      WHERE l.type = 'TRADE'
        AND (
          (t2.type = 'GLOBAL' AND i.type = 'GLOBAL')
          OR (t2.type = 'PRIVATE' AND i.type = 'PRIVATE')
        )
      GROUP BY l.trade_id
    ) l_all ON l_all.trade_id = t.id
    ${type ? 'WHERE t.type = ?' : ''}
    GROUP BY t.id
    ORDER BY t.id DESC
  `;

  const trades = (type ? db.prepare(query).all(type) : db.prepare(query).all()) as TradeRowRaw[];

  return trades.map((t) => ({
    ...t,
    profits: JSON.parse(t.profits_json || '[]'),
  }));
}

export async function getLatestCapital(): Promise<number> {
  const result = db
    .prepare(
      `
    SELECT COALESCE(SUM(l.capital_after), 0) as total_capital
    FROM investors i
    LEFT JOIN ledger l ON l.investor_id = i.id 
    AND l.id = (
      SELECT MAX(l2.id) 
      FROM ledger l2
      LEFT JOIN trades t ON l2.trade_id = t.id
      WHERE l2.investor_id = i.id
      AND (
        l2.type != 'TRADE'
        OR t.type IS NULL
        OR t.type = i.type
      )
    )
    WHERE i.type = 'GLOBAL' AND i.is_active = 1
  `
    )
    .get() as { total_capital: number };

  return result?.total_capital || 0;
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

      const info = db
        .prepare(
          'INSERT INTO trades (ticker, status, default_risk_percent, profits_json, closed_date, type, investor_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
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
          investorId
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
  closedDate,
  status,
  profits,
  risk,
}: {
  id: number;
  closedDate: string;
  status: TradeStatus;
  profits?: number[];
  risk?: number | null;
}) {
  const transaction = db.transaction(() => {
    const updates: string[] = ['closed_date = ?', 'status = ?'];
    const params: (string | number | null)[] = [closedDate, status];

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

        const affectedInvestorIds = new Set<number>();

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

        // Recalculate all affected investors
        for (const investorId of affectedInvestorIds) {
          recalculateInvestorBalances(investorId);
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

  revalidatePath('/');
  revalidatePath('/trades');
  revalidatePath('/investors');
  revalidatePath('/total');
}

function recalculateInvestorBalances(investorId: number) {
  const investor = db.prepare('SELECT type FROM investors WHERE id = ?').get(investorId) as
    | { type: TradeType }
    | undefined;

  const investorType = investor?.type || TradeType.GLOBAL;

  const entries = db
    .prepare(
      `
      SELECT l.*
      FROM ledger l
      LEFT JOIN trades t ON l.trade_id = t.id
      WHERE l.investor_id = ?
      AND (
        l.type != 'TRADE'
        OR t.type IS NULL
        OR t.type = ?
      )
      ORDER BY l.id ASC
    `
    )
    .all(investorId, investorType) as {
    id: number;
    type: string;
    change_amount: number;
  }[];

  let currentCapital = 0;
  let currentDeposit = 0;

  for (const entry of entries) {
    const capitalBefore = currentCapital;
    const depositBefore = currentDeposit;

    let capitalAfter = currentCapital;
    let depositAfter = currentDeposit;

    if (entry.type === 'TRADE') {
      capitalAfter += entry.change_amount;
      depositAfter += entry.change_amount;
    } else if (entry.type === 'CAPITAL_CHANGE') {
      capitalAfter += entry.change_amount;
      // For initial CAPITAL_CHANGE (when capital_before = 0), preserve the original capital_after and deposit_after
      // This handles the case when investor is created with initialCapital and initialDeposit
      if (capitalBefore === 0) {
        const originalEntry = db
          .prepare('SELECT capital_after, deposit_after FROM ledger WHERE id = ?')
          .get(entry.id) as Balance | undefined;
        if (originalEntry) {
          capitalAfter = originalEntry.capital_after;
          depositAfter = originalEntry.deposit_after;
        }
      }
    } else if (entry.type === 'DEPOSIT_CHANGE') {
      depositAfter += entry.change_amount;
    } else if (entry.type === 'BOTH_CHANGE') {
      capitalAfter += entry.change_amount;
      depositAfter += entry.change_amount;
    }

    db.prepare(
      `
      UPDATE ledger 
      SET capital_before = ?, capital_after = ?, deposit_before = ?, deposit_after = ?
      WHERE id = ?
    `
    ).run(capitalBefore, capitalAfter, depositBefore, depositAfter, entry.id);

    currentCapital = capitalAfter;
    currentDeposit = depositAfter;
  }
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
