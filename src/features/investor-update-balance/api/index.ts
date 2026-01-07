'use server';

import {
  getInvestorLedgerCount,
  getInvestorTradesForSelection,
  updateInvestorBalance,
} from '@/entities/investor';
import { redirect } from 'next/navigation';
import { LedgerType } from '@/shared/enum';
import { TRADE_ID_OPTION } from '@/shared/consts';

export async function updateBalanceAction({
  id,
  formData,
  shouldRedirect = true,
}: {
  id: number;
  formData: FormData;
  shouldRedirect?: boolean;
}) {
  const type = formData.get('type') as
    | LedgerType.CAPITAL_CHANGE
    | LedgerType.DEPOSIT_CHANGE
    | LedgerType.BOTH_CHANGE;
  const amount = parseFloat(formData.get('amount') as string);
  const tradeIdStr = formData.get('tradeId') as string;

  let tradeId: number | null = null;

  if (
    tradeIdStr &&
    tradeIdStr !== '' &&
    tradeIdStr !== TRADE_ID_OPTION.NONE &&
    tradeIdStr !== TRADE_ID_OPTION.AT_THE_BEGINNING
  ) {
    tradeId = parseInt(tradeIdStr, 10);
  } else if (tradeIdStr === TRADE_ID_OPTION.AT_THE_BEGINNING) {
    tradeId = -1;
  }

  if (!type || isNaN(amount) || amount === 0) {
    throw new Error('Invalid input');
  }

  if (!Number.isInteger(amount)) {
    throw new Error('Only integer values are allowed');
  }

  await updateInvestorBalance({ id, amount, type, tradeId });

  if (shouldRedirect) {
    redirect('/investors');
  }
}

export async function getTradesForSelection(investorId: number) {
  return await getInvestorTradesForSelection(investorId);
}

export async function getLedgerCount(investorId: number) {
  return await getInvestorLedgerCount(investorId);
}
