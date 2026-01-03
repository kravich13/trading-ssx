import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { InvestorActionsTable } from './InvestorActionsTable';

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

      <InvestorActionsTable ledger={ledger} investorId={id} />
    </Box>
  );
}
