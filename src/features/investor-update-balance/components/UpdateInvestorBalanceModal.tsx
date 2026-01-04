'use client';

import { Investor } from '@/entities/investor/types';
import { LedgerType } from '@/shared/enum';
import { useNotification } from '@/shared/lib/hooks';
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
  Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useState } from 'react';
import { updateBalanceAction } from '../api';

interface UpdateInvestorBalanceModalProps {
  open: boolean;
  investor: Investor;
  onClose: () => void;
}

export const UpdateInvestorBalanceModal = memo(
  ({ open, investor, onClose }: UpdateInvestorBalanceModalProps) => {
    const { showNotification } = useNotification();
    const router = useRouter();

    const [amount, setAmount] = useState('');
    const [type, setType] = useState<
      LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE
    >(LedgerType.CAPITAL_CHANGE);

    const isFormValid = amount !== '' && amount !== '0';

    const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === '.' || e.key === ',') {
        e.preventDefault();
      }
    }, []);

    const handleFormAction = useCallback(
      async (formData: FormData) => {
        try {
          await updateBalanceAction({ id: investor.id, formData, shouldRedirect: false });
          router.refresh();
          showNotification('Balance updated successfully');
          setAmount('');
          onClose();
        } catch (error) {
          console.error('Failed to update balance:', error);
          showNotification('Failed to update balance', 'error');
        }
      },
      [investor.id, onClose, router, showNotification]
    );

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add Action</DialogTitle>
        <Box component="form" action={handleFormAction}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Box sx={{ mb: 1 }}>
                <Typography variant="body1" sx={{ color: 'text.primary', mb: 0.5 }}>
                  Current Capital:{' '}
                  <strong>${Math.round(investor.current_capital).toLocaleString()}</strong>
                </Typography>
                <Typography variant="body1" sx={{ color: 'text.primary' }}>
                  Current Deposit:{' '}
                  <strong>${Math.round(investor.current_deposit).toLocaleString()}</strong>
                </Typography>
              </Box>

              <FormControl fullWidth size="small">
                <InputLabel id="change-type-label">Action Type</InputLabel>
                <Select
                  name="type"
                  labelId="change-type-label"
                  label="Action Type"
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target.value as
                        | LedgerType.CAPITAL_CHANGE
                        | LedgerType.DEPOSIT_CHANGE
                        | LedgerType.BOTH_CHANGE
                    )
                  }
                  required
                >
                  <MenuItem value={LedgerType.BOTH_CHANGE}>Both (Deposit & Capital)</MenuItem>
                  <MenuItem value={LedgerType.CAPITAL_CHANGE}>Capital Change</MenuItem>
                  <MenuItem value={LedgerType.DEPOSIT_CHANGE}>Deposit Change</MenuItem>
                </Select>
              </FormControl>

              <TextField
                name="amount"
                label="Amount ($)"
                type="number"
                variant="outlined"
                fullWidth
                required
                size="small"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={handleIntegerKeyDown}
                helperText="Use positive for Add/Deposit, negative for Sub/Withdraw"
                slotProps={{ htmlInput: { step: '1' } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
            <Button
              onClick={onClose}
              color="inherit"
              fullWidth
              sx={{ display: { xs: 'block', sm: 'none' } }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={!isFormValid}
              fullWidth={true}
              sx={{ px: 4, order: { xs: -1, sm: 0 } }}
            >
              Save
            </Button>
            <Button onClick={onClose} color="inherit" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Cancel
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    );
  }
);

UpdateInvestorBalanceModal.displayName = 'UpdateInvestorBalanceModal';
