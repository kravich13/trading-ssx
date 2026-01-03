'use client';

import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import { Investor, LedgerEntry } from '@/entities/investor/types';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import HistoryIcon from '@mui/icons-material/History';
import AddIcon from '@mui/icons-material/Add';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { InvestorActionsTable } from './InvestorActionsTable';
import { UpdateInvestorBalanceModal } from '@/features/investor-update-balance';
import { useEffect, useState } from 'react';

export function InvestorActions({ id }: { id: number }) {
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const [inv, led] = await Promise.all([getInvestorById(id), getInvestorLedger(id)]);
      setInvestor(inv || null);
      setLedger(led);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return null;

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
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Action
          </Button>
          <Link href={`/investors/${id}/trades`} passHref>
            <Button variant="contained" color="info" startIcon={<HistoryIcon />}>
              View Trade Log
            </Button>
          </Link>
        </Box>
      </Box>

      <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
        Balance & Capital Changes History
      </Typography>

      <InvestorActionsTable ledger={ledger} investorId={id} />

      <UpdateInvestorBalanceModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        investor={investor}
      />
    </Box>
  );
}
