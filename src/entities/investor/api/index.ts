'use server';

import { db } from '@/shared/api';
import { revalidatePath } from 'next/cache';
import { Investor, LedgerEntry } from '../types';
import { LedgerType } from '@/shared/enum';

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
    WHERE l.type IN ('${LedgerType.CAPITAL_CHANGE}', '${LedgerType.DEPOSIT_CHANGE}')
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
  db.prepare('UPDATE investors SET is_active = ? WHERE id = ?').run(isActive ? 1 : 0, id);
  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}

export async function updateInvestorBalance(
  id: number,
  newCapital: number,
  newDeposit: number,
  type: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE
) {
  const lastLedger = db
    .prepare(
      'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(id) as { capital_after: number; deposit_after: number };

  const changeAmount =
    type === 'CAPITAL_CHANGE'
      ? newCapital - lastLedger.capital_after
      : newDeposit - lastLedger.deposit_after;

  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, change_amount, capital_before, capital_after, deposit_before, deposit_after
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  insertLedger.run(
    id,
    type,
    changeAmount,
    lastLedger.capital_after,
    lastLedger.deposit_after,
    newCapital,
    newDeposit
  );

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}
