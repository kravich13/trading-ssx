'use client';

import { updateLedgerEntry } from '@/entities/investor/api';
import { useActionChanges } from '@/entities/investor/hooks';
import { LedgerEntry } from '@/entities/investor/types';
import { getTradesForSelection } from '@/features/investor-update-balance/api';
import { LedgerType } from '@/shared/enum';
import { TRADE_ID_OPTION } from '@/shared/consts';
import { useNotification } from '@/shared/lib/hooks';
import { normalizeDate } from '@/shared/utils';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useEffect, useState } from 'react';

interface EditActionModalProps {
  open: boolean;
  entry: LedgerEntry | null;
  rowNumber: number | null;
  investorId: number;
  investorName?: string;
  onClose: () => void;
}

export const EditActionModal = memo(
  ({ open, entry, rowNumber, investorId, investorName, onClose }: EditActionModalProps) => {
    const { showNotification } = useNotification();
    const router = useRouter();

    const [editAmount, setEditAmount] = useState('');
    const [editDepositAmount, setEditDepositAmount] = useState('');
    const [editDate, setEditDate] = useState('');
    const [editType, setEditType] = useState<
      LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE
    >(LedgerType.CAPITAL_CHANGE);
    const [editTradeId, setEditTradeId] = useState('');
    const [trades, setTrades] = useState<{ id: number; number: number }[]>([]);
    const [loadingTrades, setLoadingTrades] = useState(false);

    useEffect(() => {
      if (!open || !entry) return;

      const updateState = () => {
        const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;

        setEditAmount(isInitial ? entry.capital_after.toString() : entry.change_amount.toString());
        setEditDepositAmount(isInitial ? entry.deposit_after.toString() : '');
        setEditDate(normalizeDate(entry.created_at));
        setEditType(
          entry.type === LedgerType.CAPITAL_CHANGE ||
            entry.type === LedgerType.DEPOSIT_CHANGE ||
            entry.type === LedgerType.BOTH_CHANGE
            ? entry.type
            : LedgerType.CAPITAL_CHANGE
        );

        let initialTradeId: string;

        if (entry.trade_id === null) {
          initialTradeId = TRADE_ID_OPTION.NONE;
        } else if (entry.trade_id === -1) {
          initialTradeId = TRADE_ID_OPTION.AT_THE_BEGINNING;
        } else {
          initialTradeId = entry.trade_id.toString();
        }

        setEditTradeId(initialTradeId);
      };

      const timeoutId = setTimeout(updateState, 0);
      return () => clearTimeout(timeoutId);
    }, [open, entry]);

    useEffect(() => {
      if (open) {
        let cancelled = false;

        const loadTrades = async () => {
          setLoadingTrades(true);
          try {
            const data = await getTradesForSelection(investorId);
            if (!cancelled) {
              setTrades(data);
              setLoadingTrades(false);
            }
          } catch (error) {
            console.error('Failed to load trades:', error);
            if (!cancelled) {
              setLoadingTrades(false);
            }
          }
        };

        loadTrades();

        return () => {
          cancelled = true;
        };
      }
    }, [open, investorId]);

    const hasChanges = useActionChanges({
      entry,
      editAmount,
      editDepositAmount,
      editDate,
      editType:
        entry && entry.capital_before !== 0 && entry.deposit_before !== 0 ? editType : undefined,
      editTradeId,
    });

    const renderTradeValue = useCallback(
      (value: string) => {
        if (value === TRADE_ID_OPTION.NONE) return 'None';
        if (value === TRADE_ID_OPTION.AT_THE_BEGINNING) return 'At the beginning';
        if (!value || value === '') return '';
        const trade = trades.find((t) => t.id.toString() === value);
        return trade ? `Trade № ${trade.number}` : value;
      },
      [trades]
    );

    const renderTradeOption = useCallback(
      (trade: { id: number; number: number }) => (
        <MenuItem key={trade.id} value={trade.id.toString()}>
          Trade № {trade.number}
        </MenuItem>
      ),
      []
    );

    const handleConfirmEdit = useCallback(async () => {
      if (entry && editAmount !== '') {
        try {
          const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;

          let tradeId: number | null | undefined;
          if (editTradeId === TRADE_ID_OPTION.AT_THE_BEGINNING) {
            tradeId = -1;
          } else if (editTradeId === TRADE_ID_OPTION.NONE) {
            tradeId = null;
          } else if (editTradeId && editTradeId !== '') {
            tradeId = parseInt(editTradeId, 10);
          } else {
            tradeId = undefined;
          }
          await updateLedgerEntry({
            id: entry.id,
            investorId,
            amount: parseFloat(editAmount),
            depositAmount: isInitial ? parseFloat(editDepositAmount) : undefined,
            createdAt: editDate + ' 00:00:00',
            type: isInitial ? undefined : editType,
            tradeId,
          });
          showNotification('Action updated successfully');
          router.refresh();
          onClose();
        } catch (error) {
          console.error('Failed to update entry:', error);
          showNotification('Failed to update entry', 'error');
        }
      }
    }, [
      entry,
      editAmount,
      editDepositAmount,
      editDate,
      editType,
      editTradeId,
      investorId,
      showNotification,
      router,
      onClose,
    ]);

    const handleDialogClose = useCallback(
      (_event: object, reason?: string) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      },
      [onClose]
    );

    if (!entry) return null;

    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;

    return (
      <Dialog
        open={open}
        onClose={handleDialogClose}
        slotProps={{
          paper: {
            sx: {
              width: '100%',
              maxWidth: '360px',
            },
          },
        }}
      >
        <DialogTitle>
          Edit Action (№ {rowNumber}
          {investorName ? ` - ${investorName}` : ''})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!isInitial && (
              <FormControl fullWidth size="small">
                <InputLabel id="edit-type-label">Action Type</InputLabel>
                <Select
                  labelId="edit-type-label"
                  label="Action Type"
                  value={editType}
                  onChange={(e) =>
                    setEditType(
                      e.target.value as
                        | LedgerType.CAPITAL_CHANGE
                        | LedgerType.DEPOSIT_CHANGE
                        | LedgerType.BOTH_CHANGE
                    )
                  }
                >
                  <MenuItem value={LedgerType.BOTH_CHANGE}>Both (Deposit & Capital)</MenuItem>
                  <MenuItem value={LedgerType.CAPITAL_CHANGE}>Capital Change</MenuItem>
                  <MenuItem value={LedgerType.DEPOSIT_CHANGE}>Deposit Change</MenuItem>
                </Select>
              </FormControl>
            )}

            <FormControl fullWidth size="small">
              <InputLabel id="edit-trade-id-label">After Trade</InputLabel>
              <Select
                labelId="edit-trade-id-label"
                label="After Trade"
                value={editTradeId || ''}
                onChange={(e) => setEditTradeId(e.target.value)}
                disabled={loadingTrades}
                renderValue={renderTradeValue}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300,
                    },
                  },
                }}
              >
                {!entry?.trade_id && (
                  <MenuItem value={TRADE_ID_OPTION.NONE}>
                    <em>None</em>
                  </MenuItem>
                )}
                {!entry?.trade_id && (
                  <MenuItem value={TRADE_ID_OPTION.AT_THE_BEGINNING}>At the beginning</MenuItem>
                )}
                {trades.map(renderTradeOption)}
              </Select>
            </FormControl>

            <TextField
              label={isInitial ? 'Initial Capital' : 'Change Amount'}
              type="number"
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus
            />
            {isInitial && (
              <TextField
                label="Initial Deposit"
                type="number"
                fullWidth
                value={editDepositAmount}
                onChange={(e) => setEditDepositAmount(e.target.value)}
                variant="outlined"
                size="small"
              />
            )}
            <TextField
              label="Date"
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
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            variant="contained"
            color="primary"
            disabled={!hasChanges}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
);

EditActionModal.displayName = 'EditActionModal';
