'use client';

import { AddTradeModal, getAllTrades } from '@/entities/trade';
import { Trade } from '@/entities/trade/types';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { TradeStatsDashboard } from '@/widgets/trade-stats';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Typography } from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { TotalTradesTable } from './TotalTradesTable';

export function TotalTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await getAllTrades();
    setTrades(data);
  }, []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const data = await getAllTrades();
      if (mounted) setTrades(data);
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const tradeLikeData = trades.map((t) => {
    let change_amount = t.total_pl_usd;
    if (t.profits && t.profits.length > 0) {
      change_amount = t.profits.reduce((sum, p) => sum + p, 0);
    }

    return {
      id: t.id,
      ticker: t.ticker,
      pl_percent: t.pl_percent,
      change_amount,
      absolute_value: t.total_capital_after,
      deposit_value: t.total_deposit_after,
      default_risk_percent: t.default_risk_percent,
    };
  });

  let initialTotalDeposit = 0;
  let initialTotalCapital = 0;

  if (trades.length > 0) {
    const totalProjectPl = trades.reduce((sum, t) => {
      let pl = t.total_pl_usd;
      if (t.profits && t.profits.length > 0) {
        pl = t.profits.reduce((s, p) => s + p, 0);
      }
      return sum + pl;
    }, 0);

    const latestTrade = trades[0];
    initialTotalDeposit = latestTrade.total_deposit_after - totalProjectPl;
    initialTotalCapital = latestTrade.total_capital_after - totalProjectPl;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
        >
          Total Trades Log
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setIsModalOpen(true)}
        >
          Add Trade
        </Button>
      </Box>

      <TradeStatsDashboard trades={tradeLikeData} />

      <EquityChart
        trades={tradeLikeData}
        title="Global Equity Curve (Aggregated)"
        initialDeposit={initialTotalDeposit}
        initialCapital={initialTotalCapital}
      />

      <GaltonBoard trades={tradeLikeData} />

      <TotalTradesTable trades={trades} onRefresh={fetchData} />

      <AddTradeModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />
    </Box>
  );
}
