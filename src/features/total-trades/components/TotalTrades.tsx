import { getAllTrades } from '@/entities/trade';
import { TradeStatsDashboard } from '@/widgets/trade-stats';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { Box, Typography } from '@mui/material';
import { TotalTradesTable } from './TotalTradesTable';

export async function TotalTrades() {
  const trades = await getAllTrades();

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
  if (trades.length > 0) {
    const lastTrade = trades[trades.length - 1];
    let lastPlUsd = lastTrade.total_pl_usd;
    if (lastTrade.profits && lastTrade.profits.length > 0) {
      lastPlUsd = lastTrade.profits.reduce((sum, p) => sum + p, 0);
    }
    initialTotalDeposit = lastTrade.total_deposit_after - lastPlUsd;
  }

  return (
    <Box sx={{ py: 4 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight="bold"
        sx={{ mb: 4, fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
      >
        Total Trades Log
      </Typography>

      <TradeStatsDashboard trades={tradeLikeData} />

      <EquityChart
        trades={tradeLikeData}
        title="Global Equity Curve (Aggregated)"
        initialBalance={initialTotalDeposit}
      />

      <GaltonBoard trades={tradeLikeData} />

      <TotalTradesTable trades={trades} />
    </Box>
  );
}
