'use server';

import { db } from '@/shared/api';
import { LedgerType } from '@/shared/enum';
import { revalidatePath } from 'next/cache';
import { Investor, LedgerEntry } from '../types';

export async function getInvestors(): Promise<Investor[]> {
  const investors = db
    .prepare(
      `
    SELECT 
      i.id,
      i.name,
      i.is_active,
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

export async function getTotalStats(): Promise<{ total_capital: number; total_deposit: number }> {
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
    .get() as { total_capital: number; total_deposit: number };
  return stats;
}

export async function getInvestorLedger(id: number): Promise<LedgerEntry[]> {
  const ledger = db
    .prepare(
      `
    SELECT * FROM ledger 
    WHERE investor_id = ? 
    ORDER BY id DESC
  `
    )
    .all(id) as LedgerEntry[];
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

export async function addInvestor(name: string, initialCapital: number, initialDeposit: number) {
  const insertInvestor = db.prepare('INSERT INTO investors (name) VALUES (?)');
  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, capital_before, deposit_before, capital_after, deposit_after
    ) VALUES (?, '${LedgerType.CAPITAL_CHANGE}', 0, 0, ?, ?)
  `);

  const transaction = db.transaction((name: string, cap: number, dep: number) => {
    const info = insertInvestor.run(name);
    const investorId = info.lastInsertRowid;
    insertLedger.run(investorId, cap, dep);
  });

  transaction(name, initialCapital, initialDeposit);
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

export async function updateInvestorBalance(
  id: number,
  amount: number,
  type: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE
) {
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

export async function updateLedgerEntry(
  id: number,
  investorId: number,
  amount: number,
  createdAt: string
) {
  const entry = db.prepare('SELECT * FROM ledger WHERE id = ?').get(id) as LedgerEntry;
  if (!entry) return;

  const diff = amount - entry.change_amount;

  if (entry.type === LedgerType.CAPITAL_CHANGE) {
    db.prepare(
      'UPDATE ledger SET change_amount = ?, capital_after = capital_after + ?, created_at = ? WHERE id = ?'
    ).run(amount, diff, createdAt, id);
  } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
    db.prepare(
      'UPDATE ledger SET change_amount = ?, deposit_after = deposit_after + ?, created_at = ? WHERE id = ?'
    ).run(amount, diff, createdAt, id);
  } else if (entry.type === LedgerType.BOTH_CHANGE) {
    db.prepare(
      'UPDATE ledger SET change_amount = ?, capital_after = capital_after + ?, deposit_after = deposit_after + ?, created_at = ? WHERE id = ?'
    ).run(amount, diff, diff, createdAt, id);
  }

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
}
