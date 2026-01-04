'use client';

import { memo, useCallback, useMemo, useState } from 'react';
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
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Trade } from '@/entities/trade/types';
import { updateTrade } from '@/entities/trade/api';
import { TradeStatus } from '@/shared/enum';
import { normalizeDate } from '@/shared/utils/date.util';

interface EditTradeModalProps {
  open: boolean;
  onClose: () => void;
  trade: Trade | null;
}

export const EditTradeModal = memo(({ open, onClose, trade }: EditTradeModalProps) => {
  const [editDate, setEditDate] = useState<string>(() => {
    return trade ? normalizeDate(trade.closed_date) : '';
  });

  const [editProfits, setEditProfits] = useState<(number | string)[]>(() => {
    if (!trade) return [];
    const initialProfits: (number | string)[] = trade.profits || [];
    if (initialProfits.length === 0 && trade.total_pl_usd !== 0) {
      return [trade.total_pl_usd];
    }
    return initialProfits;
  });

  const handleProfitChange = (index: number, value: string) => {
    const newProfits = [...editProfits];
    newProfits[index] = value;
    setEditProfits(newProfits);
  };

  const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  }, []);

  const handleAddProfit = () => {
    setEditProfits([...editProfits, '']);
  };

  const handleRemoveProfit = (index: number) => {
    const newProfits = editProfits.filter((_, i) => i !== index);
    setEditProfits(newProfits);
  };

  const totalEditProfit = useMemo(() => {
    return editProfits.reduce<number>((sum, p) => {
      const val = typeof p === 'string' ? parseFloat(p) || 0 : p;
      return sum + val;
    }, 0);
  }, [editProfits]);

  const handleConfirmEdit = async () => {
    if (trade) {
      const profitsToSave = editProfits.map((p) =>
        typeof p === 'string' ? parseFloat(p) || 0 : p
      );
      await updateTrade(trade.id, editDate, trade.status || TradeStatus.CLOSED, profitsToSave);
      onClose();
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

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
              {editProfits.map((profit, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <TextField
                    label={`Part ${index + 1}`}
                    type="number"
                    size="small"
                    fullWidth
                    value={profit}
                    onChange={(e) => handleProfitChange(index, e.target.value)}
                    onKeyDown={handleIntegerKeyDown}
                    slotProps={{
                      htmlInput: {
                        step: '1',
                      },
                    }}
                  />
                  <IconButton size="small" color="error" onClick={() => handleRemoveProfit(index)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddIcon />}
                size="small"
                variant="outlined"
                onClick={handleAddProfit}
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
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
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
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleConfirmEdit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});

EditTradeModal.displayName = 'EditTradeModal';
