'use client';

import { calculateQuarterlyDepositStats } from '@/entities/investor';
import { LedgerEntry } from '@/entities/investor/types';
import { exportInvestorStatsToExcel } from '@/shared/lib/excel';
import { useNotification } from '@/shared/lib/hooks';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';

interface ExportInvestorStatsButtonProps {
  investorName: string;
  ledger: LedgerEntry[];
}

export function ExportInvestorStatsButton({
  investorName,
  ledger,
}: ExportInvestorStatsButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);
      const stats = calculateQuarterlyDepositStats(ledger);
      await exportInvestorStatsToExcel({
        investorName,
        stats,
      });
      showNotification('Excel file exported successfully');
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      showNotification('Failed to export to Excel', 'error');
    } finally {
      setLoading(false);
    }
  }, [investorName, ledger, showNotification]);

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      disabled={loading}
    >
      Export Statistics
    </Button>
  );
}
