import { calculatePeriodicStats } from '@/entities/investor';
import { LedgerEntry } from '@/entities/investor/types';
import { Box, Typography } from '@mui/material';
import { Client } from './Client';

interface InvestorPeriodicStatsProps {
  ledger: LedgerEntry[];
}

export function InvestorPeriodicStats({ ledger }: InvestorPeriodicStatsProps) {
  const stats = calculatePeriodicStats(ledger);

  if (stats.length === 0) return null;

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
        Performance History
      </Typography>

      <Client stats={stats} />
    </Box>
  );
}
