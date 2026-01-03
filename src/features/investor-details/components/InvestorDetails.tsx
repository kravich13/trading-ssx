import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import { LedgerType } from '@/shared/enum';
import { EquityChart } from '@/widgets/equity-chart';
import { GaltonBoard } from '@/widgets/galton-board';
import { TradeStatsDashboard } from '@/widgets/trade-stats';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';

export async function InvestorDetails({ id }: { id: number }) {
  const [investor, ledger] = await Promise.all([getInvestorById(id), getInvestorLedger(id)]);

  if (!investor) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Investor not found
        </Typography>
        <Link href="/investors" passHref>
          <Button variant="outlined" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
            Back to Investors
          </Button>
        </Link>
      </Box>
    );
  }

  const tradesOnly = ledger
    .filter((row) => row.type === LedgerType.TRADE)
    .map((row) => ({
      id: row.trade_id || row.id,
      ticker: row.ticker,
      pl_percent: row.pl_percent,
      change_amount: row.change_amount,
      absolute_value: row.capital_after,
      deposit_value: row.deposit_after,
      default_risk_percent: row.default_risk_percent,
    }));

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const firstTrade = ledger.find((r) => r.type === LedgerType.TRADE);
  const initialInvestorDeposit = firstTrade ? firstTrade.deposit_before : 0;

  const tradesOnlyLedger = ledger.filter((row) => row.type === LedgerType.TRADE);

  return (
    <Box sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          gap: 2,
        }}
      >
        <Link href="/investors" passHref>
          <Button
            variant="text"
            startIcon={<ArrowBackIcon />}
            sx={{ color: 'text.secondary', minWidth: 'auto' }}
          >
            Back
          </Button>
        </Link>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
        >
          {investor.name}&apos;s Trading Log
        </Typography>
      </Box>

      <TradeStatsDashboard trades={tradesOnly} />

      <EquityChart
        trades={tradesOnly}
        title={`${investor.name}'s Equity Curve`}
        initialBalance={initialInvestorDeposit}
      />

      <GaltonBoard trades={tradesOnly} />

      <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px' }}>
                Closed Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticker</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL$
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Capital After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Deposit After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Risk%
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tradesOnlyLedger.map((row, index) => {
              const plColor =
                row.change_amount > 0
                  ? 'success.main'
                  : row.change_amount < 0
                    ? 'error.main'
                    : 'inherit';

              return (
                <TableRow key={row.id} hover>
                  <TableCell>{tradesOnlyLedger.length - index}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {row.closed_date || '-'}
                  </TableCell>
                  <TableCell>{row.ticker || '-'}</TableCell>
                  <TableCell align="right" sx={{ color: plColor }}>
                    {row.pl_percent !== null ? `${row.pl_percent.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: plColor }}>
                    $
                    {row.change_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${formatCurrency(row.capital_after)}
                  </TableCell>
                  <TableCell align="right">${formatCurrency(row.deposit_after)}</TableCell>
                  <TableCell align="right">
                    {row.default_risk_percent !== null
                      ? `${row.default_risk_percent.toFixed(2)}%`
                      : '-'}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
