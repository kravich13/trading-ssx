'use client';

import { getInvestors } from '@/entities/investor/api';
import { Investor } from '@/entities/investor/types';
import { addTrade } from '@/entities/trade/api';
import { TradeStatus, TradeType } from '@/shared/enum';
import { useNotification } from '@/shared/lib/hooks';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
} from '@mui/material';
import { memo, useCallback, useEffect, useState } from 'react';
import { ProfitsLogInput } from './ProfitsLogInput';
import { TradePositionCalculator } from './TradePositionCalculator';

interface AddTradeModalProps {
  open: boolean;
  defaultTradeType?: TradeType;
  defaultInvestorId?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddTradeModal = memo(
  ({ open, defaultTradeType, defaultInvestorId, onClose, onSuccess }: AddTradeModalProps) => {
    const { showNotification } = useNotification();
    const [ticker, setTicker] = useState('');
    const [status, setStatus] = useState(TradeStatus.IN_PROGRESS);
    const [tradeType, setTradeType] = useState(defaultTradeType || TradeType.GLOBAL);
    const [investorId, setInvestorId] = useState('');
    const [investors, setInvestors] = useState<Investor[]>([]);
    const [risk, setRisk] = useState('1');
    const [profits, setProfits] = useState<(number | string)[]>(['']);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchInvestors = async () => {
        if (open) {
          try {
            const data = await getInvestors();

            setInvestors(data);

            if (defaultInvestorId) {
              setInvestorId(defaultInvestorId.toString());
            } else {
              const me = data.find((inv) => inv.name === 'Me');

              if (me) {
                setInvestorId(me.id.toString());
              } else if (data.length > 0) {
                setInvestorId(data[0].id.toString());
              }
            }
          } catch (error) {
            console.error('Failed to fetch investors:', error);
          }
        }
      };

      fetchInvestors();
    }, [open, defaultInvestorId]);

    const renderInvestorOption = useCallback(
      (inv: Investor) => (
        <MenuItem key={inv.id} value={inv.id.toString()}>
          {inv.name}
        </MenuItem>
      ),
      []
    );

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
          status,
          risk: parseFloat(risk) || null,
          profits: profitsToSave,
          type: tradeType,
          investorId: tradeType === TradeType.PRIVATE ? parseInt(investorId) : null,
        });

        setTicker('');
        setStatus(TradeStatus.IN_PROGRESS);
        setTradeType(defaultTradeType || TradeType.GLOBAL);
        setRisk('1');
        setProfits(['']);
        showNotification('Trade added successfully');
        onSuccess?.();
        onClose();
      } catch (error) {
        console.error('Failed to add trade:', error);
        showNotification('Failed to add trade', 'error');
      } finally {
        setLoading(false);
      }
    }, [
      ticker,
      status,
      profits,
      risk,
      tradeType,
      investorId,
      defaultTradeType,
      onSuccess,
      onClose,
      showNotification,
    ]);

    const formatCurrency = useCallback(
      (value: number) =>
        value.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }),
      []
    );

    const handleDialogClose = useCallback(
      (_event: object, reason?: string) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      },
      [onClose]
    );

    return (
      <Dialog open={open} onClose={handleDialogClose} fullWidth maxWidth="xs">
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
                disabled={loading || Boolean(defaultTradeType)}
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
              <Box sx={{ overflow: 'hidden', pt: tradeType === TradeType.PRIVATE ? 0.5 : 0 }}>
                <TextField
                  select
                  label="Investor"
                  value={investorId}
                  onChange={(e) => setInvestorId(e.target.value)}
                  fullWidth
                  size="small"
                  disabled={loading || Boolean(defaultInvestorId)}
                  sx={{ mb: 0.5 }}
                >
                  {investors.map(renderInvestorOption)}
                </TextField>
              </Box>
            </Box>

            <Box sx={{ pt: 0.7 }}>
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

            <TradePositionCalculator riskPercent={risk} />

            <Box
              sx={{
                display: 'grid',
                gridTemplateRows: status === TradeStatus.CLOSED ? '1fr' : '0fr',
                transition: 'grid-template-rows 0.3s ease-out',
              }}
            >
              <Box sx={{ overflow: 'hidden' }}>
                <ProfitsLogInput
                  profits={profits}
                  onProfitsChange={setProfits}
                  disabled={loading}
                  formatCurrency={formatCurrency}
                />
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
  }
);

AddTradeModal.displayName = 'AddTradeModal';
