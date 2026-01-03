import { getAllTrades } from '@/entities/trade';
import { TradeStatsDashboard } from '@/widgets/trade-stats';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { Box, Typography } from '@mui/material';
import { TotalTradesTable } from './TotalTradesTable';

export async function TotalTrades() {
  const trades = await getAllTrades();

  const tradeLikeData = trades.map((t) => ({
    id: t.id,
    ticker: t.ticker,
    pl_percent: t.pl_percent,
    change_amount: t.total_pl_usd,
    absolute_value: t.total_capital_after,
    deposit_value: t.total_deposit_after,
    default_risk_percent: t.default_risk_percent,
  }));

  const initialTotalDeposit =
    trades.length > 0
      ? trades[trades.length - 1].total_deposit_after - trades[trades.length - 1].total_pl_usd
      : 0;

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
