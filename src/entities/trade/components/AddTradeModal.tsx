'use client';

import { getInvestors } from '@/entities/investor/api';
import { Investor } from '@/entities/investor/types';
import { addTrade } from '@/entities/trade/api';
import { TradeStatus, TradeType } from '@/shared/enum';
import { COLORS } from '@/shared/consts';
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
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { TradePositionCalculator } from './TradePositionCalculator';

interface AddTradeModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTradeModal = memo(({ open, onClose, onSuccess }: AddTradeModalProps) => {
  const [ticker, setTicker] = useState('');
  const [status, setStatus] = useState(TradeStatus.IN_PROGRESS);
  const [tradeType, setTradeType] = useState(TradeType.GLOBAL);
  const [investorId, setInvestorId] = useState('');
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [plPercent, setPlPercent] = useState('0');
  const [risk, setRisk] = useState('1');
  const [profits, setProfits] = useState<(number | string)[]>(['']);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvestors = async () => {
      if (open) {
        try {
          const data = await getInvestors();

          setInvestors(data);

          const me = data.find((inv) => inv.name === 'Me');

          if (me) {
            setInvestorId(me.id.toString());
          } else if (data.length > 0) {
            setInvestorId(data[0].id.toString());
          }
        } catch (error) {
          console.error('Failed to fetch investors:', error);
        }
      }
    };

    fetchInvestors();
  }, [open]);

  const handleProfitChange = useCallback((index: number, value: string) => {
    setProfits((prev) => {
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
    setProfits((prev) => [...prev, '']);
  }, []);

  const handleRemoveProfit = useCallback((index: number) => {
    setProfits((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const renderInvestorOption = useCallback(
    (inv: Investor) => (
      <MenuItem key={inv.id} value={inv.id.toString()}>
        {inv.name}
      </MenuItem>
    ),
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
    ),
    [handleProfitChange, handleIntegerKeyDown, handleRemoveProfit, loading, profits.length]
  );

  const totalProfit = useMemo(() => {
    return profits.reduce<number>((sum, p) => {
      const val = typeof p === 'string' ? parseFloat(p) || 0 : p;
      return sum + val;
    }, 0);
  }, [profits]);

  const handleSave = useCallback(async () => {
    if (!ticker) return;

    setLoading(true);

    try {
      const profitsToSave =
        status === TradeStatus.CLOSED
          ? profits.map((p) => (typeof p === 'string' ? parseFloat(p) || 0 : p))
          : [];

      await addTrade({
        ticker: ticker.toUpperCase(),
        plPercent: status === TradeStatus.CLOSED ? parseFloat(plPercent) || 0 : 0,
        status,
        risk: parseFloat(risk) || null,
        profits: profitsToSave,
        type: tradeType,
        investorId: tradeType === TradeType.PRIVATE ? parseInt(investorId) : null,
      });

      setTicker('');
      setStatus(TradeStatus.IN_PROGRESS);
      setTradeType(TradeType.GLOBAL);
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
  }, [ticker, status, profits, plPercent, risk, tradeType, investorId, onSuccess, onClose]);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

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

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Trade Type"
              value={tradeType}
              onChange={(e) => setTradeType(e.target.value as TradeType)}
              fullWidth
              size="small"
              disabled={loading}
            >
              <MenuItem value={TradeType.GLOBAL}>GLOBAL</MenuItem>
              <MenuItem value={TradeType.PRIVATE}>PRIVATE</MenuItem>
            </TextField>

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
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateRows: tradeType === TradeType.PRIVATE ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.3s ease-out',
            }}
          >
            <Box sx={{ overflow: 'hidden' }}>
              <TextField
                select
                label="Investor"
                value={investorId}
                onChange={(e) => setInvestorId(e.target.value)}
                fullWidth
                size="small"
                disabled={loading}
                sx={{ mb: 0.5 }}
              >
                {investors.map(renderInvestorOption)}
              </TextField>
            </Box>
          </Box>

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
                  {profits.map(renderProfitInput)}
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
                      bgcolor: COLORS.whiteAlpha05,
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
