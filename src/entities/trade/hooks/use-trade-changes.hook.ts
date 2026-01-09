'use client';

import { Trade } from '@/entities/trade/types';
import { getInitialTradeProfits } from '@/entities/trade/utils';
import { TradeStatus } from '@/shared/enum';
import { normalizeDate } from '@/shared/utils';
import { useEffect, useMemo } from 'react';

interface UseTradeChangesProps {
  trade: Trade | null;
  editTicker: string;
  editDate: string;
  editRisk: string;
  editStatus: TradeStatus;
  editProfits: (number | string)[];
  setEditTicker: (ticker: string) => void;
  setEditDate: (date: string) => void;
  setEditRisk: (risk: string) => void;
  setEditStatus: (status: TradeStatus) => void;
  setEditProfits: (profits: (number | string)[]) => void;
}

export function useTradeChanges({
  trade,
  editTicker,
  editDate,
  editRisk,
  editStatus,
  editProfits,
  setEditTicker,
  setEditDate,
  setEditRisk,
  setEditStatus,
  setEditProfits,
}: UseTradeChangesProps) {
  // Use useMemo for stable initial values that trigger hasChanges when they finally load
  const initial = useMemo(() => {
    if (!trade) return null;

    return {
      ticker: trade.ticker || '',
      date: normalizeDate(trade.closed_date),
      risk: trade.default_risk_percent != null ? trade.default_risk_percent.toString() : '',
      status: trade.status || TradeStatus.IN_PROGRESS,
      profits: getInitialTradeProfits(trade),
    };
  }, [trade?.id]);

  // Sync initial values to state once
  useEffect(() => {
    if (initial) {
      setEditTicker(initial.ticker);
      setEditDate(initial.date);
      setEditRisk(initial.risk);
      setEditStatus(initial.status);
      setEditProfits(initial.profits);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  const hasChanges = useMemo(() => {
    if (!initial) return false;

    // 1. Check basic fields
    if (editTicker.trim().toUpperCase() !== initial.ticker.trim().toUpperCase()) return true;
    if (editStatus !== initial.status) return true;
    if (editRisk.trim() !== initial.risk.trim()) return true;

    // Date only matters if trade is closed
    if (editStatus === TradeStatus.CLOSED) {
      if (editDate.trim() !== initial.date.trim()) return true;
    }

    // 2. Check profits - convert everything to numbers for reliable comparison
    const current = editProfits.map((p) => {
      if (typeof p === 'string') return parseFloat(p.trim()) || 0;
      if (typeof p === 'number') return p;
      return 0;
    });
    const init = initial.profits.map((p) => {
      if (typeof p === 'string') return parseFloat(p.trim()) || 0;
      if (typeof p === 'number') return p;
      return 0;
    });

    if (current.length !== init.length) return true;

    for (let i = 0; i < current.length; i++) {
      if (Math.abs(current[i] - init[i]) > 0.0001) return true;
    }

    return false;
  }, [initial, editTicker, editDate, editRisk, editStatus, editProfits]);

  return hasChanges;
}
