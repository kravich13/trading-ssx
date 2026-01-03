'use server';

import { updateInvestorBalance } from '@/entities/investor';
import { redirect } from 'next/navigation';
import { LedgerType } from '@/shared/enum';

export async function updateBalanceAction(id: number, formData: FormData) {
  const type = formData.get('type') as LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE;
  const newCapital = parseFloat(formData.get('capital') as string);
  const newDeposit = parseFloat(formData.get('deposit') as string);

  if (!type || isNaN(newCapital) || isNaN(newDeposit)) {
    throw new Error('Invalid input');
  }

  await updateInvestorBalance(id, newCapital, newDeposit, type);
  redirect('/investors');
}
