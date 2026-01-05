'use client';

import { exportGlobalTradesToExcel } from '@/shared/lib/excel';
import { Trade } from '@/entities/trade/types';
import DownloadIcon from '@mui/icons-material/Download';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';
import { useNotification } from '@/shared/lib/hooks';

interface ExportToExcelButtonProps {
  trades: Trade[];
}

export function ExportToExcelButton({ trades }: ExportToExcelButtonProps) {
  const [loading, setLoading] = useState(false);
  const { showNotification } = useNotification();

  const handleExport = useCallback(async () => {
    try {
      setLoading(true);
      await exportGlobalTradesToExcel({
        trades,
      });
      showNotification('Excel file exported successfully');
    } catch (error) {
      console.error('Failed to export to Excel:', error);
      showNotification('Failed to export to Excel', 'error');
    } finally {
      setLoading(false);
    }
  }, [trades, showNotification]);

  return (
    <Button
      variant="contained"
      color="primary"
      startIcon={<DownloadIcon />}
      onClick={handleExport}
      disabled={loading}
      sx={{ ml: 2 }}
    >
      Export to Excel
    </Button>
  );
}
