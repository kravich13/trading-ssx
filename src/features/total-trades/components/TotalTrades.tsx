import { getAllTrades } from '@/entities/trade';
import { TradeStatsDashboard } from '@/widgets/trade-stats';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

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

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const initialTotalDeposit =
    trades.length > 0
      ? trades[trades.length - 1].total_deposit_after - trades[trades.length - 1].total_pl_usd
      : 0;

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        Total Trades Log
      </Typography>

      <TradeStatsDashboard trades={tradeLikeData} />

      <EquityChart
        trades={tradeLikeData}
        title="Global Equity Curve (Aggregated)"
        initialBalance={initialTotalDeposit}
      />

      <GaltonBoard trades={tradeLikeData} />

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '100px' }}>
                Closed Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticker</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total PL$
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total Capital
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total Deposit
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Default Risk%
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No trades found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const plColor =
                  trade.total_pl_usd > 0
                    ? 'success.main'
                    : trade.total_pl_usd < 0
                      ? 'error.main'
                      : 'inherit';

                return (
                  <TableRow key={trade.id} hover>
                    <TableCell>{trade.id}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary' }}>
                      {trade.closed_date || '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{trade.ticker}</TableCell>
                    <TableCell align="right" sx={{ color: plColor }}>
                      {trade.pl_percent.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right" sx={{ color: plColor, fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_pl_usd)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_capital_after)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_deposit_after)}
                    </TableCell>
                    <TableCell align="right">
                      {trade.default_risk_percent !== null
                        ? `${trade.default_risk_percent.toFixed(2)}%`
                        : '-'}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
