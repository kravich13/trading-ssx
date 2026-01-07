'use client';

import { LedgerEntry } from '@/entities/investor/types';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { FinanceStatsDashboard, TradeStatsDashboard } from '@/widgets/trade-stats';
import { Box, Tab, Tabs } from '@mui/material';
import { useCallback, useState } from 'react';
import { InvestorPeriodicStats } from './InvestorPeriodicStats';
import { InvestorTradingLogTable } from './InvestorTradingLog';

interface InvestorDetailsTabsProps {
  investorName: string;
  ledger: LedgerEntry[];
  tradesOnly: Array<{
    id: number;
    ticker: string;
    pl_percent: number | null;
    change_amount: number;
    absolute_value: number;
    deposit_value: number;
    default_risk_percent: number | null;
  }>;
  initialInvestorDeposit: number;
  initialInvestorCapital: number;
}

export function InvestorDetailsTabs({
  investorName,
  ledger,
  tradesOnly,
  initialInvestorDeposit,
  initialInvestorCapital,
}: InvestorDetailsTabsProps) {
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

      {selectedTab === 0 && <InvestorTradingLogTable ledger={ledger} />}

      {selectedTab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <TradeStatsDashboard trades={tradesOnly} />

          <FinanceStatsDashboard ledger={ledger} />

          <EquityChart
            trades={tradesOnly}
            title={`${investorName}'s Equity Curve`}
            initialDeposit={initialInvestorDeposit}
            initialCapital={initialInvestorCapital}
          />

          <GaltonBoard trades={tradesOnly} />

          <InvestorPeriodicStats ledger={ledger} />
        </Box>
      )}
    </Box>
  );
}
