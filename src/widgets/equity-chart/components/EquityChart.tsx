'use client';

import { TradeLike } from '@/entities/trade';
import { COLORS } from '@/shared/consts';
import { Card, CardContent } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';
import { EquityChartStorageKeys } from '../enums';
import { calculateEMAs } from '../utils';
import { EquityChartCore } from './EquityChartCore';
import { EquityChartHeader } from './EquityChartHeader';

interface EquityChartProps {
  trades: TradeLike[];
  title?: string;
  initialDeposit?: number;
  initialCapital?: number;
}

export function EquityChart({
  trades,
  title = 'Equity Curve',
  initialDeposit = 0,
  initialCapital = 0,
}: EquityChartProps) {
  const [mode, setMode] = useState<'percent' | 'usd'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(EquityChartStorageKeys.MODE);
      if (savedMode === 'percent' || savedMode === 'usd') {
        return savedMode;
      }
    }
    return 'percent';
  });

  const [view, setView] = useState<'capital' | 'deposit'>(() => {
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem(EquityChartStorageKeys.VIEW);
      if (savedView === 'capital' || savedView === 'deposit') {
        return savedView;
      }
    }
    return 'capital';
  });

  const [showEmas, setShowEmas] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedShowEmas = localStorage.getItem(EquityChartStorageKeys.SHOW_EMAS);
      if (savedShowEmas !== null) {
        return savedShowEmas === 'true';
      }
    }
    return true;
  });

  const handleModeChange = useCallback((newMode: 'percent' | 'usd' | null) => {
    if (newMode) {
      setMode(newMode);
      localStorage.setItem(EquityChartStorageKeys.MODE, newMode);
    }
  }, []);

  const handleViewChange = useCallback((newView: 'capital' | 'deposit' | null) => {
    if (newView) {
      setView(newView);
      localStorage.setItem(EquityChartStorageKeys.VIEW, newView);
    }
  }, []);

  const handleShowEmasChange = useCallback((newVal: boolean) => {
    setShowEmas(newVal);
    localStorage.setItem(EquityChartStorageKeys.SHOW_EMAS, newVal.toString());
  }, []);

  const { data, initialReferenceValue } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.id - b.id);

    const realStartCapital =
      sorted.length > 0
        ? sorted[0].absolute_value - (sorted[0].change_amount || 0)
        : initialCapital;
    const realStartDeposit =
      sorted.length > 0 ? sorted[0].deposit_value - (sorted[0].change_amount || 0) : initialDeposit;

    const initialBase = view === 'capital' ? realStartCapital : realStartDeposit;

    let currentPurePLPercent = 100;
    const rawValues: number[] = [];

    const startVal = mode === 'percent' ? 100 : initialBase;
    rawValues.push(startVal);

    const baseData = sorted.map((t) => {
      currentPurePLPercent += t.pl_percent || 0;

      let val;
      if (mode === 'percent') {
        if (view === 'capital') {
          val = currentPurePLPercent;
        } else {
          val = realStartDeposit > 0 ? (t.deposit_value / realStartDeposit) * 100 : 100;
        }
      } else {
        val = view === 'capital' ? t.absolute_value : t.deposit_value;
      }

      rawValues.push(val);

      return {
        id: t.id,
        val,
        pl_percent: t.pl_percent,
        pl_usd: t.change_amount,
        ticker: t.ticker,
      };
    });

    const e14 = calculateEMAs(rawValues, 14);
    const e50 = calculateEMAs(rawValues, 50);
    const e200 = calculateEMAs(rawValues, 200);

    const chartData = rawValues.map((v, i) => ({
      name: i === 0 ? 'Start' : `T ${baseData[i - 1].id}`,
      value: Number(v.toFixed(2)),
      ema14: e14[i] ? Number(e14[i]!.toFixed(2)) : null,
      ema50: e50[i] ? Number(e50[i]!.toFixed(2)) : null,
      ema200: e200[i] ? Number(e200[i]!.toFixed(2)) : null,
      pl_percent: i === 0 ? undefined : baseData[i - 1].pl_percent,
      pl_usd: i === 0 ? undefined : baseData[i - 1].pl_usd,
      ticker: i === 0 ? undefined : baseData[i - 1].ticker,
    }));

    return { data: chartData, initialReferenceValue: startVal };
  }, [trades, view, mode, initialCapital, initialDeposit]);

  return (
    <Card
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${COLORS.borderPrimary}`,
        mb: 4,
      }}
    >
      <CardContent>
        <EquityChartHeader
          title={title}
          view={view}
          mode={mode}
          showEmas={showEmas}
          onViewChange={handleViewChange}
          onModeChange={handleModeChange}
          onShowEmasChange={handleShowEmasChange}
        />

        <EquityChartCore
          data={data}
          view={view}
          mode={mode}
          showEmas={showEmas}
          initialReferenceValue={initialReferenceValue}
        />
      </CardContent>
    </Card>
  );
}
