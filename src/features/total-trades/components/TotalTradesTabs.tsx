'use client';

import { InvestorPeriodicStats } from '@/features/investor-details';
import { LedgerEntry } from '@/entities/investor/types';
import { Trade } from '@/entities/trade/types';
import { FinanceStats } from '@/entities/investor/lib/stats';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { FinanceStatsDashboard, TradeStatsDashboard } from '@/widgets/trade-stats';
import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useState, useCallback } from 'react';
import { TotalTradesTable } from './TotalTradesTable';

interface TotalTradesTabsProps {
  allTrades: Trade[];
  tradeLikeData: Array<{
    id: number;
    ticker: string;
    pl_percent: number;
    change_amount: number;
    absolute_value: number;
    deposit_value: number;
    default_risk_percent: number | null;
  }>;
  financeStats: FinanceStats;
  initialTotalDeposit: number;
  initialTotalCapital: number;
  globalTradeLedger: LedgerEntry[];
}

export function TotalTradesTabs({
  allTrades,
  tradeLikeData,
  financeStats,
  initialTotalDeposit,
  initialTotalCapital,
  globalTradeLedger,
}: TotalTradesTabsProps) {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = useCallback((_: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  }, []);

  return (
    <Box>
      <Tabs
        value={selectedTab}
        onChange={handleTabChange}
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tab label="Trades Table" />
        <Tab label="Statistics & Charts" />
      </Tabs>

      {selectedTab === 0 && <TotalTradesTable trades={allTrades} />}

      {selectedTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Typography
            variant="h5"
            component="h2"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem' }, mb: 2 }}
          >
            Total Trades Log (Global only)
          </Typography>
          <TradeStatsDashboard trades={tradeLikeData} />

          <FinanceStatsDashboard stats={financeStats} />

          <EquityChart
            trades={tradeLikeData}
            title="Global Equity Curve (Aggregated)"
            initialDeposit={initialTotalDeposit}
            initialCapital={initialTotalCapital}
          />

          <GaltonBoard trades={tradeLikeData} />

          <InvestorPeriodicStats ledger={globalTradeLedger} />
        </Box>
      )}
    </Box>
  );
}
