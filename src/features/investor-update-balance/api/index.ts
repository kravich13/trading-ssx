'use server';

import { updateInvestorBalance } from '@/entities/investor';
import { redirect } from 'next/navigation';
import { LedgerType } from '@/shared/enum';

export async function updateBalanceAction(
  id: number,
  formData: FormData,
  shouldRedirect: boolean = true
) {
  const type = formData.get('type') as
    | LedgerType.CAPITAL_CHANGE
    | LedgerType.DEPOSIT_CHANGE
    | LedgerType.BOTH_CHANGE;
  const amount = parseFloat(formData.get('amount') as string);

  if (!type || isNaN(amount) || amount === 0) {
    throw new Error('Invalid input');
  }

  if (!Number.isInteger(amount)) {
    throw new Error('Only integer values are allowed');
  }

  await updateInvestorBalance(id, amount, type);

  if (shouldRedirect) {
    redirect('/investors');
  }
}
