'use server';

import { db } from '@/shared/api';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { TotalStats } from '@/shared/types';
import { revalidatePath } from 'next/cache';
import { FinanceStats } from '../lib';
import { Investor, LedgerEntry } from '../types';

export async function getInvestors(): Promise<Investor[]> {
  const investors = db
    .prepare(
      `
    SELECT 
      i.id,
      i.name,
      i.is_active,
      i.type,
      COALESCE(l.capital_after, 0) as current_capital,
      COALESCE(l.deposit_after, 0) as current_deposit
    FROM investors i
    LEFT JOIN ledger l ON l.investor_id = i.id 
    AND l.id = (SELECT MAX(id) FROM ledger WHERE investor_id = i.id)
    ORDER BY i.is_active DESC, CASE WHEN i.name = 'Me' THEN 0 ELSE 1 END, i.name ASC
  `
    )
    .all() as Investor[];

  return investors;
}

export async function getInvestorById(id: number): Promise<Investor | undefined> {
  const investor = db
    .prepare(
      `
    SELECT 
      i.id,
      i.name,
      i.is_active,
      i.type,
      COALESCE(l.capital_after, 0) as current_capital,
      COALESCE(l.deposit_after, 0) as current_deposit
    FROM investors i
    LEFT JOIN ledger l ON l.investor_id = i.id 
    AND l.id = (SELECT MAX(id) FROM ledger WHERE investor_id = i.id)
    WHERE i.id = ?
  `
    )
    .get(id) as Investor | undefined;
  return investor;
}

export async function getTotalStats(): Promise<TotalStats> {
  const stats = db
    .prepare(
      `
    SELECT 
      SUM(current_capital) as total_capital,
      SUM(current_deposit) as total_deposit
    FROM investor_current_stats
    WHERE is_active = 1
  `
    )
    .get() as TotalStats;
  return stats;
}

export async function getGlobalTotalStats(): Promise<TotalStats> {
  const stats = db
    .prepare(
      `
    SELECT 
      SUM(ics.current_capital) as total_capital,
      SUM(ics.current_deposit) as total_deposit
    FROM investor_current_stats ics
    JOIN investors i ON ics.id = i.id
    WHERE ics.is_active = 1 AND i.type = 'GLOBAL'
  `
    )
    .get() as TotalStats;
  return stats;
}

export async function getInvestorLedger(
  id: number
): Promise<(LedgerEntry & { status?: TradeStatus; trade_type?: TradeType })[]> {
  const ledger = db
    .prepare(
      `
    SELECT l.*, t.status, t.type as trade_type
    FROM ledger l
    LEFT JOIN trades t ON l.trade_id = t.id
    WHERE l.investor_id = ? 
    ORDER BY l.id DESC
  `
    )
    .all(id) as (LedgerEntry & { status?: TradeStatus; trade_type?: TradeType })[];
  return ledger;
}

export async function getGlobalActionsLog(): Promise<(LedgerEntry & { investor_name: string })[]> {
  const ledger = db
    .prepare(
      `
    SELECT l.*, i.name as investor_name
    FROM ledger l
    JOIN investors i ON l.investor_id = i.id
    WHERE l.type IN ('${LedgerType.CAPITAL_CHANGE}', '${LedgerType.DEPOSIT_CHANGE}', '${LedgerType.BOTH_CHANGE}')
    ORDER BY l.id DESC
  `
    )
    .all() as (LedgerEntry & { investor_name: string })[];
  return ledger;
}

export async function addInvestor({
  name,
  initialCapital,
  initialDeposit,
  type = TradeType.GLOBAL,
}: {
  name: string;
  initialCapital: number;
  initialDeposit: number;
  type?: TradeType;
}) {
  const insertInvestor = db.prepare('INSERT INTO investors (name, type) VALUES (?, ?)');
  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, capital_before, deposit_before, capital_after, deposit_after
    ) VALUES (?, '${LedgerType.CAPITAL_CHANGE}', 0, 0, ?, ?)
  `);

  const transaction = db.transaction(
    ({ n, cap, dep, t }: { n: string; cap: number; dep: number; t: TradeType }) => {
      const info = insertInvestor.run(n, t);
      const investorId = info.lastInsertRowid;
      insertLedger.run(investorId, cap, dep);
    }
  );

  transaction({ n: name, cap: initialCapital, dep: initialDeposit, t: type });
  revalidatePath('/');
  revalidatePath('/investors');
}

export async function toggleInvestorStatus(id: number, isActive: boolean) {
  if (isActive) {
    db.prepare('UPDATE investors SET is_active = 1, archived_at = NULL WHERE id = ?').run(id);
  } else {
    db.prepare(
      'UPDATE investors SET is_active = 0, archived_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id);
  }
  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}

export async function updateInvestorBalance({
  id,
  amount,
  type,
}: {
  id: number;
  amount: number;
  type: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE;
}) {
  const lastLedger = db
    .prepare(
      'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(id) as { capital_after: number; deposit_after: number };

  let newCapital = lastLedger.capital_after;
  let newDeposit = lastLedger.deposit_after;

  if (type === LedgerType.CAPITAL_CHANGE) {
    newCapital += amount;
  } else if (type === LedgerType.DEPOSIT_CHANGE) {
    newDeposit += amount;
  } else if (type === LedgerType.BOTH_CHANGE) {
    newCapital += amount;
    newDeposit += amount;
  }

  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, change_amount, capital_before, capital_after, deposit_before, deposit_after
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLedger.run(
    id,
    type,
    amount,
    lastLedger.capital_after,
    newCapital,
    lastLedger.deposit_after,
    newDeposit
  );

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}

export async function deleteLedgerEntry(id: number, investorId: number) {
  const entry = db.prepare('SELECT * FROM ledger WHERE id = ?').get(id) as LedgerEntry;
  if (!entry) return;

  const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;

  if (isInitial) {
    const otherEntries = db
      .prepare('SELECT COUNT(*) as count FROM ledger WHERE investor_id = ? AND id != ?')
      .get(investorId, id) as { count: number };

    if (otherEntries.count > 0) {
      throw new Error('Cannot delete initial entry when subsequent entries exist');
    }
  }

  db.prepare('DELETE FROM ledger WHERE id = ?').run(id);
  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
}

export async function updateLedgerEntry({
  id,
  investorId,
  amount,
  depositAmount,
  createdAt,
}: {
  id: number;
  investorId: number;
  amount: number;
  depositAmount?: number;
  createdAt: string;
}) {
  const transaction = db.transaction(() => {
    const entry = db.prepare('SELECT * FROM ledger WHERE id = ?').get(id) as LedgerEntry;
    if (!entry) return;

    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    const effectiveDepositAmount = depositAmount !== undefined ? depositAmount : amount;

    // Special case for BOTH_CHANGE or initial where we might want different diffs
    // But for now let's stick to the simplest logic:
    // If it's initial, we just set the new values and update all subsequent
    if (isInitial) {
      db.prepare(
        'UPDATE ledger SET capital_after = ?, deposit_after = ?, created_at = ? WHERE id = ?'
      ).run(amount, effectiveDepositAmount, createdAt, id);

      const diffCap = amount - entry.capital_after;
      const diffDep = effectiveDepositAmount - entry.deposit_after;

      if (diffCap !== 0 || diffDep !== 0) {
        db.prepare(
          `
          UPDATE ledger 
          SET 
            capital_before = capital_before + ?, 
            capital_after = capital_after + ?,
            deposit_before = deposit_before + ?,
            deposit_after = deposit_after + ?
          WHERE investor_id = ? AND id > ?
        `
        ).run(diffCap, diffCap, diffDep, diffDep, investorId, id);
      }
    } else {
      const diff = amount - entry.change_amount;

      if (entry.type === LedgerType.CAPITAL_CHANGE) {
        db.prepare(
          'UPDATE ledger SET change_amount = ?, capital_after = capital_after + ?, created_at = ? WHERE id = ?'
        ).run(amount, diff, createdAt, id);

        db.prepare(
          'UPDATE ledger SET capital_before = capital_before + ?, capital_after = capital_after + ? WHERE investor_id = ? AND id > ?'
        ).run(diff, diff, investorId, id);
      } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
        db.prepare(
          'UPDATE ledger SET change_amount = ?, deposit_after = deposit_after + ?, created_at = ? WHERE id = ?'
        ).run(amount, diff, createdAt, id);

        db.prepare(
          'UPDATE ledger SET deposit_before = deposit_before + ?, deposit_after = deposit_after + ? WHERE investor_id = ? AND id > ?'
        ).run(diff, diff, investorId, id);
      } else if (entry.type === LedgerType.BOTH_CHANGE) {
        db.prepare(
          'UPDATE ledger SET change_amount = ?, capital_after = capital_after + ?, deposit_after = deposit_after + ?, created_at = ? WHERE id = ?'
        ).run(amount, diff, diff, createdAt, id);

        db.prepare(
          'UPDATE ledger SET capital_before = capital_before + ?, capital_after = capital_after + ?, deposit_before = deposit_before + ?, deposit_after = deposit_after + ? WHERE investor_id = ? AND id > ?'
        ).run(diff, diff, diff, diff, investorId, id);
      }
    }
  });

  transaction();

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
}

export async function getGlobalFinanceStats(): Promise<FinanceStats> {
  const current = await getGlobalTotalStats();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfQuarter = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
  ).toISOString();

  const getBaseStats = (date: string): TotalStats | undefined => {
    return db
      .prepare(
        `
      SELECT 
        SUM(capital_after) as total_capital,
        SUM(deposit_after) as total_deposit
      FROM (
        SELECT capital_after, deposit_after
        FROM ledger
        WHERE id IN (
        SELECT MAX(l2.id)
        FROM ledger l2
        JOIN investors i ON l2.investor_id = i.id
        WHERE i.is_active = 1 AND i.type = 'GLOBAL' AND COALESCE(l2.closed_date, l2.created_at) < ?
        GROUP BY l2.investor_id
        )
      )
    `
      )
      .get(date) as TotalStats | undefined;
  };

  const monthBase = getBaseStats(startOfMonth);
  const quarterBase = getBaseStats(startOfQuarter);

  const monthBaseCapital = monthBase?.total_capital || 0;
  const monthBaseDeposit = monthBase?.total_deposit || 0;

  const quarterBaseCapital = quarterBase?.total_capital || 0;
  const quarterBaseDeposit = quarterBase?.total_deposit || 0;

  const monthCapitalGrowthUsd = current.total_capital - monthBaseCapital;
  const monthCapitalGrowthPercent =
    monthBaseCapital !== 0 ? (monthCapitalGrowthUsd / monthBaseCapital) * 100 : 0;

  const monthDepositGrowthUsd = current.total_deposit - monthBaseDeposit;
  const monthDepositGrowthPercent =
    monthBaseDeposit !== 0 ? (monthDepositGrowthUsd / monthBaseDeposit) * 100 : 0;

  const quarterCapitalGrowthUsd = current.total_capital - quarterBaseCapital;
  const quarterCapitalGrowthPercent =
    quarterBaseCapital !== 0 ? (quarterCapitalGrowthUsd / quarterBaseCapital) * 100 : 0;

  const quarterDepositGrowthUsd = current.total_deposit - quarterBaseDeposit;
  const quarterDepositGrowthPercent =
    quarterBaseDeposit !== 0 ? (quarterDepositGrowthUsd / quarterBaseDeposit) * 100 : 0;

  return {
    currentCapital: current.total_capital,
    currentDeposit: current.total_deposit,
    monthCapitalGrowthUsd,
    monthCapitalGrowthPercent,
    monthDepositGrowthUsd,
    monthDepositGrowthPercent,
    quarterCapitalGrowthUsd,
    quarterCapitalGrowthPercent,
    quarterDepositGrowthUsd,
    quarterDepositGrowthPercent,
  };
}

export async function getGlobalLedger(): Promise<LedgerEntry[]> {
  const ledger = db
    .prepare(
      `
    SELECT l.*
    FROM ledger l
    JOIN investors i ON l.investor_id = i.id
    WHERE i.type = 'GLOBAL'
    ORDER BY l.id DESC
  `
    )
    .all() as LedgerEntry[];
  return ledger;
}
