'use client';

import { Trade } from '@/entities/trade/types';
import { getInitialTradeProfits } from '@/entities/trade/utils';
import { normalizeDate } from '@/shared/utils';
import { useEffect, useMemo } from 'react';

interface InitialValues {
  date: string;
  risk: string;
  profits: (number | string)[];
}

interface UseTradeChangesProps {
  trade: Trade | null;
  editDate: string;
  editRisk: string;
  editProfits: (number | string)[];
  setEditDate: (date: string) => void;
  setEditRisk: (risk: string) => void;
  setEditProfits: (profits: (number | string)[]) => void;
}

export function useTradeChanges({
  trade,
  editDate,
  editRisk,
  editProfits,
  setEditDate,
  setEditRisk,
  setEditProfits,
}: UseTradeChangesProps) {
  const initialValues = useMemo<InitialValues | null>(() => {
    if (!trade) return null;

    const normalizedDate = normalizeDate(trade.closed_date);
    const riskStr = trade.default_risk_percent != null ? trade.default_risk_percent.toString() : '';
    const profits = getInitialTradeProfits(trade);

    return {
      date: normalizedDate,
      risk: riskStr,
      profits,
    };
  }, [trade]);

  useEffect(() => {
    if (initialValues) {
      setEditDate(initialValues.date);
      setEditRisk(initialValues.risk);
      setEditProfits(initialValues.profits);
    }
  }, [initialValues, setEditDate, setEditRisk, setEditProfits]);

  const hasChanges = useMemo(() => {
    if (!trade || !initialValues) return false;

    const initial = initialValues;

    if (editDate.trim() !== initial.date.trim()) return true;

    const editRiskTrimmed = editRisk.trim();
    const initialRiskTrimmed = initial.risk.trim();
    if (editRiskTrimmed !== initialRiskTrimmed) {
      const editRiskNum = editRiskTrimmed === '' ? null : parseFloat(editRiskTrimmed);
      const initialRiskNum = initialRiskTrimmed === '' ? null : parseFloat(initialRiskTrimmed);

      if (editRiskNum === null && initialRiskNum === null) {
      } else if (
        (isNaN(editRiskNum!) && isNaN(initialRiskNum!)) ||
        (editRiskNum !== null &&
          initialRiskNum !== null &&
          Math.abs(editRiskNum - initialRiskNum) < 0.0001)
      ) {
      } else {
        return true;
      }
    }

    const currentProfits = editProfits
      .map((p) => (typeof p === 'string' ? (p.trim() === '' ? 0 : parseFloat(p) || 0) : p))
      .filter((p) => p !== 0 || editProfits.length === 1);
    const initialProfitsNumbers = initial.profits
      .map((p: number | string) =>
        typeof p === 'string' ? (p.trim() === '' ? 0 : parseFloat(p) || 0) : p
      )
      .filter((p) => p !== 0 || initial.profits.length === 1);

    if (currentProfits.length !== initialProfitsNumbers.length) return true;

    for (let i = 0; i < currentProfits.length; i++) {
      if (Math.abs(currentProfits[i] - initialProfitsNumbers[i]) > 0.0001) return true;
    }

    return false;
  }, [editDate, editRisk, editProfits, trade, initialValues]);

  return hasChanges;
}
