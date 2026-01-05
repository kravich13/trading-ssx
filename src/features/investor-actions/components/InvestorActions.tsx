import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { AddActionButton } from './AddActionButton';
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
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: { xs: 'flex-start', md: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
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
            {investor.name}&apos;s Actions Log
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1.5,
            width: { xs: '100%', md: 'auto' },
            justifyContent: { xs: 'center', sm: 'flex-end' },
          }}
        >
          <AddActionButton investor={investor} />

          <Link
            href={`/investors/${id}/trades`}
            passHref
            style={{ textDecoration: 'none', flex: '1 1 100%', display: 'contents' }}
          >
            <Button
              variant="contained"
              color="info"
              startIcon={<HistoryIcon />}
              sx={{
                flex: { xs: '1 1 100%', sm: 'none' },
                minWidth: { xs: '100%', sm: '140px' },
                whiteSpace: 'nowrap',
              }}
            >
              Trade Log
            </Button>
          </Link>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Balance & Capital Changes History
      </Typography>

      <InvestorActionsTable ledger={ledger} investorId={id} />
    </Box>
  );
}
