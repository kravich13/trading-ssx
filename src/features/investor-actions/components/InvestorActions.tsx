import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import { LedgerType } from '@/shared/enum';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import {
  Box,
  Button,
  Chip,
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

export async function InvestorActions({ id }: { id: number }) {
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

  const actionsOnly = ledger.filter(
    (row) => row.type === LedgerType.CAPITAL_CHANGE || row.type === LedgerType.DEPOSIT_CHANGE
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/investors" passHref>
            <Button variant="text" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary' }}>
              Back
            </Button>
          </Link>
          <Typography variant="h4" component="h1" fontWeight="bold">
            {investor.name}&apos;s Actions Log
          </Typography>
        </Box>
        <Link href={`/investors/${id}/trades`} passHref>
          <Button variant="contained" color="info" startIcon={<HistoryIcon />}>
            View Trade Log
          </Button>
        </Link>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Balance & Capital Changes History
      </Typography>

      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold' }}>№</TableCell>
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
            {actionsOnly.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No balance actions found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              actionsOnly.map((row, index) => {
                const color = row.change_amount > 0 ? 'success.main' : 'error.main';
                const isInitial = row.capital_before === 0 && row.deposit_before === 0;

                let chipLabel = row.type.replace('_CHANGE', '');
                let chipColor: 'primary' | 'secondary' | 'warning' | 'info' | 'default' =
                  'secondary';

                if (isInitial) {
                  chipLabel = 'INITIAL';
                  chipColor = 'primary';
                } else if (row.type === LedgerType.DEPOSIT_CHANGE) {
                  chipLabel = `DEPOSIT ${row.change_amount > 0 ? 'IN' : 'OUT'}`;
                  chipColor = 'warning';
                } else if (row.type === LedgerType.CAPITAL_CHANGE) {
                  chipLabel = `CAPITAL ${row.change_amount > 0 ? 'ADD' : 'SUB'}`;
                  chipColor = 'secondary';
                }

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{actionsOnly.length - index}</TableCell>
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
                      ${formatCurrency(row.capital_after)}
                    </TableCell>
                    <TableCell align="right">${formatCurrency(row.deposit_after)}</TableCell>
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
