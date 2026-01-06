'use client';

import { LedgerEntry, LedgerEntryWithInvestor } from '@/entities/investor/types';
import { normalizeDate } from '@/shared/utils';
import { useMemo } from 'react';

interface InitialActionValues {
  amount: string;
  depositAmount: string;
  date: string;
}

interface UseActionChangesProps {
  entry: LedgerEntry | LedgerEntryWithInvestor | null;
  editAmount: string;
  editDepositAmount: string;
  editDate: string;
}

export function useActionChanges({
  entry,
  editAmount,
  editDepositAmount,
  editDate,
}: UseActionChangesProps) {
  const initialValues = useMemo<InitialActionValues | null>(() => {
    if (!entry) return null;

    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    return {
      amount: isInitial ? entry.capital_after.toString() : entry.change_amount.toString(),
      depositAmount: isInitial ? entry.deposit_after.toString() : '',
      date: normalizeDate(entry.created_at),
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

    if (editDate.trim() !== initialValues.date.trim()) return true;

    return false;
  }, [editAmount, editDepositAmount, editDate, entry, initialValues]);

  return hasChanges;
}
