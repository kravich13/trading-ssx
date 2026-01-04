'use client';

import { updateTrade } from '@/entities/trade/api';
import { Trade } from '@/entities/trade/types';
import { getInitialTradeProfits } from '@/entities/trade/utils';
import { TradeStatus } from '@/shared/enum';
import { COLORS } from '@/shared/consts';
import { normalizeDate } from '@/shared/utils/date.util';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';

interface EditTradeModalProps {
  open: boolean;
  trade: Trade | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditTradeModal = memo(({ open, trade, onClose, onSuccess }: EditTradeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [editDate, setEditDate] = useState(() => (trade ? normalizeDate(trade.closed_date) : ''));

  const [editProfits, setEditProfits] = useState(() => getInitialTradeProfits(trade));

  const handleProfitChange = useCallback((index: number, value: string) => {
    setEditProfits((prev) => {
      const newProfits = [...prev];
      newProfits[index] = value;
      return newProfits;
    });
  }, []);

  const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  }, []);

  const handleAddProfit = useCallback(() => {
    setEditProfits((prev) => [...prev, '']);
  }, []);

  const handleRemoveProfit = useCallback((index: number) => {
    setEditProfits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const totalEditProfit = useMemo(() => {
    return editProfits.reduce<number>((sum, p) => {
      const val = typeof p === 'string' ? parseFloat(p) || 0 : p;
      return sum + val;
    }, 0);
  }, [editProfits]);

  const handleConfirmEdit = useCallback(async () => {
    if (trade) {
      setLoading(true);
      try {
        const profitsToSave = editProfits.map((p) =>
          typeof p === 'string' ? parseFloat(p) || 0 : p
        );
        await updateTrade({
          id: trade.id,
          closedDate: editDate,
          status: trade.status || TradeStatus.CLOSED,
          profits: profitsToSave,
        });
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error('Failed to update trade:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [trade, editProfits, editDate, onSuccess, onClose]);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const renderProfitInput = useCallback(
    (profit: string | number, index: number) => (
      <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <TextField
          label={`Part ${index + 1}`}
          type="number"
          size="small"
          fullWidth
          value={profit}
          onChange={(e) => handleProfitChange(index, e.target.value)}
          onKeyDown={handleIntegerKeyDown}
          disabled={loading}
          slotProps={{
            htmlInput: {
              step: '1',
            },
          }}
        />
        <IconButton
          size="small"
          color="error"
          onClick={() => handleRemoveProfit(index)}
          disabled={loading}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Box>
    ),
    [handleProfitChange, handleIntegerKeyDown, handleRemoveProfit, loading]
  );

  if (!trade) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Trade № {trade.id}</DialogTitle>
      <DialogContent sx={{ minHeight: '280px', maxHeight: '60svh', overflowY: 'auto' }}>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Closed Date"
            type="date"
            fullWidth
            value={editDate}
            onChange={(e) => setEditDate(e.target.value)}
            variant="outlined"
            size="small"
            disabled={loading}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Profits Log (Excel-like)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {editProfits.map(renderProfitInput)}
              <Button
                startIcon={<AddIcon />}
                size="small"
                variant="outlined"
                onClick={handleAddProfit}
                disabled={loading}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                Add Part
              </Button>
            </Box>
            {editProfits.length > 0 && (
              <Typography
                variant="body2"
                sx={{
                  mt: 2,
                  fontWeight: 'bold',
                  textAlign: 'right',
                  color: totalEditProfit >= 0 ? 'success.main' : 'error.main',
                  bgcolor: COLORS.whiteAlpha05,
                  p: 1,
                  borderRadius: 1,
                }}
              >
                Total Profit: ${formatCurrency(totalEditProfit)}
              </Typography>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handleConfirmEdit} variant="contained" color="primary" disabled={loading}>
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

EditTradeModal.displayName = 'EditTradeModal';
