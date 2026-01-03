'use server';

import { db } from '@/shared/api';
import { revalidatePath } from 'next/cache';
import { Investor } from '../types';

export async function getInvestors(): Promise<Investor[]> {
  const investors = db
    .prepare(
      `
    SELECT 
      i.id,
      i.name,
      COALESCE(l.capital_after, 0) as current_capital,
      COALESCE(l.deposit_after, 0) as current_deposit
    FROM investors i
    LEFT JOIN ledger l ON l.investor_id = i.id 
    AND l.id = (SELECT MAX(id) FROM ledger WHERE investor_id = i.id)
    ORDER BY i.name ASC
  `
    )
    .all() as Investor[];
  return investors;
}

export async function addInvestor(name: string, initialCapital: number, initialDeposit: number) {
  const insertInvestor = db.prepare('INSERT INTO investors (name) VALUES (?)');
  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, capital_before, deposit_before, capital_after, deposit_after
    ) VALUES (?, 'CAPITAL_CHANGE', 0, 0, ?, ?)
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

export async function deleteInvestor(id: number) {
  const deleteLedger = db.prepare('DELETE FROM ledger WHERE investor_id = ?');
  const deleteInv = db.prepare('DELETE FROM investors WHERE id = ?');

  const transaction = db.transaction((investorId: number) => {
    deleteLedger.run(investorId);
    deleteInv.run(investorId);
  });

  transaction(id);
  revalidatePath('/');
  revalidatePath('/investors');
}

export async function updateInvestorBalance(
  id: number,
  newCapital: number,
  newDeposit: number,
  type: 'CAPITAL_CHANGE' | 'DEPOSIT_CHANGE'
) {
  const lastLedger = db
    .prepare(
      'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
    )
    .get(id) as { capital_after: number; deposit_after: number };

  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, capital_before, deposit_before, capital_after, deposit_after
    ) VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertLedger.run(
    id,
    type,
    lastLedger.capital_after,
    lastLedger.deposit_after,
    newCapital,
    newDeposit
  );

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}
