'use server';

import { db } from '@/shared/api';
import { TradeStatus, TradeType } from '@/shared/enum';
import { revalidatePath } from 'next/cache';
import { Trade } from '../types';

interface TradeRowRaw extends Omit<Trade, 'profits'> {
  profits_json: string | null;
}

export async function getAllTrades(type?: TradeType): Promise<Trade[]> {
  const query = `
    SELECT 
      t.*,
      COALESCE(SUM(l.change_amount), 0) as total_pl_usd,
      COALESCE(MAX(l_all.total_cap), 0) as total_capital_after,
      COALESCE(MAX(l_all.total_dep), 0) as total_deposit_after
    FROM trades t
    LEFT JOIN ledger l ON l.trade_id = t.id AND l.type = 'TRADE'
    LEFT JOIN (
      SELECT trade_id, SUM(capital_after) as total_cap, SUM(deposit_after) as total_dep
      FROM ledger
      GROUP BY trade_id
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
    SELECT COALESCE(SUM(capital_after), 0) as total_capital
    FROM (
      SELECT capital_after
      FROM ledger
      WHERE id IN (
        SELECT MAX(id)
        FROM ledger
        GROUP BY investor_id
      )
    )
  `
    )
    .get() as { total_capital: number };

  return result?.total_capital || 0;
}

export async function addTrade({
  ticker,
  plPercent,
  status,
  risk,
  profits,
  type = TradeType.GLOBAL,
  investorId = null,
}: {
  ticker: string;
  plPercent: number;
  status: TradeStatus;
  risk: number | null;
  profits: number[];
  type?: TradeType;
  investorId?: number | null;
}) {
  const transaction = db.transaction(() => {
    const totalPlUsd = profits.reduce((sum, p) => sum + p, 0);

    const info = db
      .prepare(
        'INSERT INTO trades (ticker, pl_percent, status, default_risk_percent, profits_json, closed_date, type, investor_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )
      .run(
        ticker,
        plPercent,
        status,
        risk,
        JSON.stringify(profits),
        status === TradeStatus.CLOSED ? new Date().toISOString().split('T')[0] : null,
        type,
        investorId
      );

    const tradeId = info.lastInsertRowid as number;

    if (totalPlUsd !== 0) {
      let activeStates: {
        id: number;
        last: { capital_after: number; deposit_after: number };
      }[] = [];

      if (type === TradeType.PRIVATE && investorId) {
        const last = db
          .prepare(
            'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
          )
          .get(investorId) as { capital_after: number; deposit_after: number } | undefined;

        if (last) {
          activeStates = [{ id: investorId, last }];
        }
      } else {
        const investors = db.prepare('SELECT id FROM investors WHERE is_active = 1').all() as {
          id: number;
        }[];

        activeStates = investors
          .map((inv) => ({
            id: inv.id,
            last: db
              .prepare(
                'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
              )
              .get(inv.id) as { capital_after: number; deposit_after: number } | undefined,
          }))
          .filter(
            (s): s is { id: number; last: { capital_after: number; deposit_after: number } } =>
              !!s.last && s.last.capital_after > 0
          );
      }

      const totalCapitalBefore = activeStates.reduce((sum, s) => sum + s.last.capital_after, 0);

      if (totalCapitalBefore > 0) {
        for (const s of activeStates) {
          const share = type === TradeType.PRIVATE ? 1 : s.last.capital_after / totalCapitalBefore;
          const investorPlUsd = totalPlUsd * share;

          db.prepare(
            `
            INSERT INTO ledger (
              investor_id, trade_id, type, ticker, pl_percent, change_amount, 
              capital_before, capital_after, deposit_before, deposit_after, closed_date, default_risk_percent
            ) VALUES (?, ?, 'TRADE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          ).run(
            s.id,
            tradeId,
            ticker,
            plPercent,
            investorPlUsd,
            s.last.capital_after,
            s.last.capital_after + investorPlUsd,
            s.last.deposit_after,
            s.last.deposit_after + investorPlUsd,
            status === TradeStatus.CLOSED ? new Date().toISOString().split('T')[0] : null,
            risk
          );
        }
      }
    }
  });

  transaction();

  revalidatePath('/');
  revalidatePath('/trades');
  revalidatePath('/investors');
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

      const ledgerEntries = db
        .prepare("SELECT * FROM ledger WHERE trade_id = ? AND type = 'TRADE'")
        .all(id) as {
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
        // Create new ledger entries if none exist and we have a profit
        const investors = db.prepare('SELECT id FROM investors WHERE is_active = 1').all() as {
          id: number;
        }[];

        const activeStates = investors
          .map((inv) => ({
            id: inv.id,
            last: db
              .prepare(
                'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
              )
              .get(inv.id) as { capital_after: number; deposit_after: number } | undefined,
          }))
          .filter(
            (s): s is { id: number; last: { capital_after: number; deposit_after: number } } =>
              !!s.last && s.last.capital_after > 0
          );

        const totalCapitalBefore = activeStates.reduce((sum, s) => sum + s.last.capital_after, 0);

        if (totalCapitalBefore > 0) {
          const trade = db
            .prepare('SELECT ticker, pl_percent, default_risk_percent FROM trades WHERE id = ?')
            .get(id) as { ticker: string; pl_percent: number; default_risk_percent: number | null };

          for (const s of activeStates) {
            const share = s.last.capital_after / totalCapitalBefore;
            const investorPlUsd = newTotalPlUsd * share;

            db.prepare(
              `
              INSERT INTO ledger (
                investor_id, trade_id, type, ticker, pl_percent, change_amount, 
                capital_before, capital_after, deposit_before, deposit_after, closed_date, default_risk_percent
              ) VALUES (?, ?, 'TRADE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `
            ).run(
              s.id,
              id,
              trade.ticker,
              trade.pl_percent,
              investorPlUsd,
              s.last.capital_after,
              s.last.capital_after + investorPlUsd,
              s.last.deposit_after,
              s.last.deposit_after + investorPlUsd,
              closedDate,
              trade.default_risk_percent
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
}

function recalculateInvestorBalances(investorId: number) {
  const entries = db
    .prepare('SELECT * FROM ledger WHERE investor_id = ? ORDER BY id ASC')
    .all(investorId) as {
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
}
