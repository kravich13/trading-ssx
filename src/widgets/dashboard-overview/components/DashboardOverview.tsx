import { getInvestors, getTotalStats, getGlobalActionsLog } from '@/entities/investor';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import HistoryIcon from '@mui/icons-material/History';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
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

export async function DashboardOverview() {
  const [investors, stats, globalActions] = await Promise.all([
    getInvestors(),
    getTotalStats(),
    getGlobalActionsLog(),
  ]);

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Overview
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4, mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'primary.main',
              borderLeftWidth: 6,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'primary.main' }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography
                  variant="subtitle2"
                  component="div"
                  fontWeight="bold"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Total Notional Capital
                </Typography>
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold">
                {formatCurrency(stats.total_capital)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Base for position sizing and risk management
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card
            elevation={0}
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'success.main',
              borderLeftWidth: 6,
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'success.main' }}>
                <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                <Typography
                  variant="subtitle2"
                  component="div"
                  fontWeight="bold"
                  sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
                >
                  Total Actual Deposit
                </Typography>
              </Box>
              <Typography variant="h3" component="div" fontWeight="bold">
                {formatCurrency(stats.total_deposit)}
              </Typography>
              <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                Real funds available on exchange accounts
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3 }} fontWeight="medium">
        Investors Summary
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Current Capital
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Current Deposit
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Capital Share
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Deposit Share
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                Log
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {investors.map((investor) => {
              const capitalShare =
                stats.total_capital > 0
                  ? (investor.current_capital / stats.total_capital) * 100
                  : 0;

              const depositShare =
                stats.total_deposit > 0
                  ? (investor.current_deposit / stats.total_deposit) * 100
                  : 0;

              return (
                <TableRow key={investor.id} hover>
                  <TableCell component="th" scope="row">
                    <Link
                      href={`/investors/${investor.id}`}
                      style={{
                        color: '#2196f3',
                        textDecoration: 'none',
                        fontWeight: 'medium',
                      }}
                    >
                      {investor.name}
                    </Link>
                  </TableCell>
                  <TableCell align="right">{formatCurrency(investor.current_capital)}</TableCell>
                  <TableCell align="right">{formatCurrency(investor.current_deposit)}</TableCell>
                  <TableCell align="right">{capitalShare.toFixed(2)}%</TableCell>
                  <TableCell align="right">{depositShare.toFixed(2)}%</TableCell>
                  <TableCell align="center">
                    <Link href={`/investors/${investor.id}/trades`} passHref>
                      <IconButton color="info" size="small" title="View Trade Log">
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow sx={{ bgcolor: 'action.selected' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>TOTAL</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(stats.total_capital)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                {formatCurrency(stats.total_deposit)}
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                100.00%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                100.00%
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3 }} fontWeight="medium">
        Global Actions Log
      </Typography>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>№</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Investor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Change Amount
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Capital After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Deposit After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {globalActions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No balance actions found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              globalActions.map((row, index) => {
                const color = row.change_amount > 0 ? 'success.main' : 'error.main';
                const isInitial = row.capital_before === 0 && row.deposit_before === 0;

                let chipLabel = row.type.replace('_CHANGE', '');
                let chipColor: 'primary' | 'secondary' | 'warning' | 'info' | 'default' =
                  'secondary';

                if (isInitial) {
                  chipLabel = 'INITIAL';
                  chipColor = 'primary';
                } else if (row.type === 'DEPOSIT_CHANGE') {
                  chipLabel = `DEPOSIT ${row.change_amount > 0 ? 'IN' : 'OUT'}`;
                  chipColor = 'warning';
                } else if (row.type === 'CAPITAL_CHANGE') {
                  chipLabel = `CAPITAL ${row.change_amount > 0 ? 'ADD' : 'SUB'}`;
                  chipColor = 'secondary';
                }

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{globalActions.length - index}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{row.investor_name}</TableCell>
                    <TableCell>
                      <Chip
                        label={chipLabel}
                        size="small"
                        color={chipColor}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color, fontWeight: 'medium' }}>
                      {row.change_amount > 0 ? '+' : ''}
                      {formatCurrency(row.change_amount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      {formatCurrency(row.capital_after)}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.deposit_after)}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {row.created_at ? row.created_at.split(' ')[0] : '-'}
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
