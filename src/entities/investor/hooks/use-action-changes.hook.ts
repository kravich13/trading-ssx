'use client';

import { LedgerEntry, LedgerEntryWithInvestor } from '@/entities/investor/types';
import { LedgerType } from '@/shared/enum';
import { TRADE_ID_OPTION } from '@/shared/consts';
import { normalizeDate } from '@/shared/utils';
import { useMemo } from 'react';

interface InitialActionValues {
  amount: string;
  depositAmount: string;
  date: string;
  type?: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE;
  tradeId: string;
}

interface UseActionChangesProps {
  entry: LedgerEntry | LedgerEntryWithInvestor | null;
  editAmount: string;
  editDepositAmount: string;
  editDate: string;
  editType?: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE;
  editTradeId?: string;
}

export function useActionChanges({
  entry,
  editAmount,
  editDepositAmount,
  editDate,
  editType,
  editTradeId,
}: UseActionChangesProps) {
  const initialValues = useMemo<InitialActionValues | null>(() => {
    if (!entry) return null;

    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    return {
      amount: isInitial ? entry.capital_after.toString() : entry.change_amount.toString(),
      depositAmount: isInitial ? entry.deposit_after.toString() : '',
      date: normalizeDate(entry.created_at),
      type:
        entry.type === LedgerType.CAPITAL_CHANGE ||
        entry.type === LedgerType.DEPOSIT_CHANGE ||
        entry.type === LedgerType.BOTH_CHANGE
          ? entry.type
          : undefined,
      tradeId: (() => {
        if (entry.trade_id === null) {
          return TRADE_ID_OPTION.NONE;
        }
        if (entry.trade_id === -1) {
          return TRADE_ID_OPTION.AT_THE_BEGINNING;
        }
        return entry.trade_id.toString();
      })(),
    };
  }, [entry]);

  const hasChanges = useMemo(() => {
    if (!entry || !initialValues) return false;

    const editAmountTrimmed = editAmount.trim();
    const initialAmountTrimmed = initialValues.amount.trim();
    if (editAmountTrimmed !== initialAmountTrimmed) {
      const editAmountNum = editAmountTrimmed === '' ? null : parseFloat(editAmountTrimmed);
      const initialAmountNum =
        initialAmountTrimmed === '' ? null : parseFloat(initialAmountTrimmed);

      if (editAmountNum === null && initialAmountNum === null) {
      } else if (
        (isNaN(editAmountNum!) && isNaN(initialAmountNum!)) ||
        (editAmountNum !== null &&
          initialAmountNum !== null &&
          Math.abs(editAmountNum - initialAmountNum) < 0.0001)
      ) {
      } else {
        return true;
      }
    }

    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    if (isInitial) {
      const editDepositTrimmed = editDepositAmount.trim();
      const initialDepositTrimmed = initialValues.depositAmount.trim();
      if (editDepositTrimmed !== initialDepositTrimmed) {
        const editDepositNum = editDepositTrimmed === '' ? null : parseFloat(editDepositTrimmed);
        const initialDepositNum =
          initialDepositTrimmed === '' ? null : parseFloat(initialDepositTrimmed);

        if (editDepositNum === null && initialDepositNum === null) {
        } else if (
          (isNaN(editDepositNum!) && isNaN(initialDepositNum!)) ||
          (editDepositNum !== null &&
            initialDepositNum !== null &&
            Math.abs(editDepositNum - initialDepositNum) < 0.0001)
        ) {
        } else {
          return true;
        }
      }
    }

    const normalizedEditDate = normalizeDate(editDate);
    const normalizedInitialDate = normalizeDate(initialValues.date);
    if (normalizedEditDate !== normalizedInitialDate) return true;

    if (!isInitial && editType && initialValues.type && editType !== initialValues.type) {
      return true;
    }

    if (editTradeId !== undefined) {
      const editTradeIdNormalized = editTradeId || '';
      const initialTradeIdNormalized = initialValues.tradeId || '';
      if (editTradeIdNormalized !== initialTradeIdNormalized) {
        return true;
      }
    }

    return false;
  }, [editAmount, editDepositAmount, editDate, editType, editTradeId, entry, initialValues]);

  return hasChanges;
}
