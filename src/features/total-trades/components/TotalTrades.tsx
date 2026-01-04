import { getGlobalFinanceStats } from '@/entities/investor';
import { getAllTrades } from '@/entities/trade';
import { TradeType } from '@/shared/enum';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { FinanceStatsDashboard, TradeStatsDashboard } from '@/widgets/trade-stats';
import { Box, Typography } from '@mui/material';
import { processTotalTradesData } from '../utils';
import { AddTradeButton } from './AddTradeButton';
import { TotalTradesTable } from './TotalTradesTable';

export async function TotalTrades() {
  const [trades, financeStats] = await Promise.all([
    getAllTrades(TradeType.GLOBAL),
    getGlobalFinanceStats(),
  ]);

  const { tradeLikeData, initialTotalDeposit, initialTotalCapital } =
    processTotalTradesData(trades);

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
        <AddTradeButton />
      </Box>

      <TradeStatsDashboard trades={tradeLikeData} />

      <FinanceStatsDashboard stats={financeStats} />

      <EquityChart
        trades={tradeLikeData}
        title="Global Equity Curve (Aggregated)"
        initialDeposit={initialTotalDeposit}
        initialCapital={initialTotalCapital}
      />

      <GaltonBoard trades={tradeLikeData} />

      <TotalTradesTable trades={trades} />
    </Box>
  );
}
