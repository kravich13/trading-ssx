'use client';

import { useState } from 'react';
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
import { LedgerType } from '@/shared/enum';
import { updateBalanceAction } from '../api';
import { Investor } from '@/entities/investor/types';

interface UpdateInvestorBalanceModalProps {
  open: boolean;
  onClose: () => void;
  investor: Investor;
}

export function UpdateInvestorBalanceModal({
  open,
  onClose,
  investor,
}: UpdateInvestorBalanceModalProps) {
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<
    LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE
  >(LedgerType.CAPITAL_CHANGE);

  const isFormValid = amount !== '' && amount !== '0';

  const handleIntegerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  const handleFormAction = async (formData: FormData) => {
    await updateBalanceAction(investor.id, formData, false);
    setAmount('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ fontWeight: 'bold' }}>Add Action: {investor.name}</DialogTitle>
      <Box component="form" action={handleFormAction}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Capital:{' '}
                <strong>${Math.round(investor.current_capital).toLocaleString()}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary">
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
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!isFormValid}
            sx={{ px: 4 }}
          >
            Save
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
