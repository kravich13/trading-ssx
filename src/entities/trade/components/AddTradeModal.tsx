'use client';

import { addTrade } from '@/entities/trade/api';
import { TradeStatus } from '@/shared/enum';
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
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';
import { memo, useCallback, useMemo, useState } from 'react';
import { TradePositionCalculator } from './TradePositionCalculator';

interface AddTradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTradeModal = memo(({ open, onClose, onSuccess }: AddTradeModalProps) => {
  const [ticker, setTicker] = useState('');
  const [status, setStatus] = useState<TradeStatus>(TradeStatus.IN_PROGRESS);
  const [plPercent, setPlPercent] = useState('0');
  const [risk, setRisk] = useState('1');
  const [profits, setProfits] = useState<(number | string)[]>(['']);
  const [loading, setLoading] = useState(false);

  const handleProfitChange = (index: number, value: string) => {
    const newProfits = [...profits];
    newProfits[index] = value;
    setProfits(newProfits);
  };

  const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  }, []);

  const handleAddProfit = () => {
    setProfits([...profits, '']);
  };

  const handleRemoveProfit = (index: number) => {
    const newProfits = profits.filter((_, i) => i !== index);
    setProfits(newProfits);
  };

  const totalProfit = useMemo(() => {
    return profits.reduce<number>((sum, p) => {
      const val = typeof p === 'string' ? parseFloat(p) || 0 : p;
      return sum + val;
    }, 0);
  }, [profits]);

  const handleSave = async () => {
    if (!ticker) return;

    setLoading(true);

    try {
      const profitsToSave =
        status === TradeStatus.CLOSED
          ? profits.map((p) => (typeof p === 'string' ? parseFloat(p) || 0 : p))
          : [];

      await addTrade(
        ticker.toUpperCase(),
        status === TradeStatus.CLOSED ? parseFloat(plPercent) || 0 : 0,
        status,
        parseFloat(risk) || null,
        profitsToSave
      );

      setTicker('');
      setStatus(TradeStatus.IN_PROGRESS);
      setPlPercent('0');
      setRisk('1');
      setProfits(['']);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to add trade:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Add New Trade</DialogTitle>
      <DialogContent sx={{ minHeight: '300px', maxHeight: '70svh', overflowY: 'auto' }}>
        <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="Ticker"
            fullWidth
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            variant="outlined"
            size="small"
            placeholder="BTC/USDT"
            autoFocus
            disabled={loading}
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TradeStatus)}
            fullWidth
            size="small"
            disabled={loading}
          >
            <MenuItem value={TradeStatus.IN_PROGRESS}>IN PROGRESS</MenuItem>
            <MenuItem value={TradeStatus.CLOSED}>CLOSED</MenuItem>
          </TextField>

          <Box
            sx={{
              display: 'flex',
              gap: status === TradeStatus.CLOSED ? 2 : 0,
              alignItems: 'flex-start',
              transition: 'gap 0.3s ease-out',
            }}
          >
            <Box
              sx={{
                flex: status === TradeStatus.CLOSED ? 1 : 0,
                display: 'grid',
                gridTemplateColumns: status === TradeStatus.CLOSED ? '1fr' : '0fr',
                transition: 'all 0.3s ease-out',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ minWidth: 0, pt: 0.7, px: 0.1 }}>
                <TextField
                  label="PL %"
                  type="number"
                  value={plPercent}
                  onChange={(e) => setPlPercent(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading}
                />
              </Box>
            </Box>
            <Box sx={{ flex: 1, pt: 0.7 }}>
              <TextField
                label="Risk % (on capital)"
                type="number"
                value={risk}
                onChange={(e) => setRisk(e.target.value)}
                fullWidth
                size="small"
                disabled={loading}
              />
            </Box>
          </Box>

          <TradePositionCalculator riskPercent={risk} />

          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: status === TradeStatus.CLOSED ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease-out',
            }}
          >
            <Box sx={{ overflow: 'hidden' }}>
              <Box sx={{ pt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                  Profits Log (Excel-like)
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {profits.map((profit, index) => (
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
                      {profits.length > 1 && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleRemoveProfit(index)}
                          disabled={loading}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  ))}
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
                {profits.length > 0 && (
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 2,
                      fontWeight: 'bold',
                      textAlign: 'right',
                      color: totalProfit >= 0 ? 'success.main' : 'error.main',
                      bgcolor: 'rgba(255, 255, 255, 0.05)',
                      p: 1,
                      borderRadius: 1,
                    }}
                  >
                    Total Profit: ${formatCurrency(totalProfit)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={!ticker || loading}
        >
          {loading ? 'Adding...' : 'Add Trade'}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

AddTradeModal.displayName = 'AddTradeModal';
