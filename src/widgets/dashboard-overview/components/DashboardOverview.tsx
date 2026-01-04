import { getGlobalActionsLog, getInvestors, getTotalStats } from '@/entities/investor';
import { COLORS } from '@/shared/consts';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
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
import { GlobalActionsTable } from './GlobalActionsTable';

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
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        fontWeight="bold"
        sx={{ fontSize: { xs: '2rem', sm: '2.125rem' } }}
      >
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
        <Table sx={{ minWidth: 650 }}>
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
                <TableRow key={investor.id} hover sx={{ opacity: investor.is_active ? 1 : 0.6 }}>
                  <TableCell component="th" scope="row">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Link
                        href={`/investors/${investor.id}`}
                        style={{
                          color: investor.is_active ? COLORS.primaryMain : COLORS.textMuted,
                          textDecoration: 'none',
                          fontWeight: 'medium',
                        }}
                      >
                        {investor.name}
                      </Link>
                      {!investor.is_active && (
                        <Chip
                          label="Archived"
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.65rem', height: 20 }}
                        />
                      )}
                    </Box>
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
      <GlobalActionsTable actions={globalActions} />
    </Box>
  );
}
