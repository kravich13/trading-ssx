'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { LedgerType } from '@/shared/enum';
import { updateBalanceAction } from '../api';

interface UpdateInvestorBalanceFormProps {
  id: number;
  initialCapital: number;
  initialDeposit: number;
}

export function UpdateInvestorBalanceForm({
  id,
  initialCapital,
  initialDeposit,
}: UpdateInvestorBalanceFormProps) {
  const [capital, setCapital] = useState(Math.round(initialCapital).toString());
  const [deposit, setDeposit] = useState(Math.round(initialDeposit).toString());
  const [type, setType] = useState(LedgerType.CAPITAL_CHANGE);

  const isFormValid = capital !== '' && deposit !== '';

  const handleIntegerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  return (
    <Box
      component="form"
      action={updateBalanceAction.bind(null, id)}
      sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
    >
      <Typography variant="body2" color="text.secondary">
        Current Capital: ${Math.round(initialCapital).toLocaleString()} | Current Deposit: $
        {Math.round(initialDeposit).toLocaleString()}
      </Typography>

      <FormControl fullWidth size="small">
        <InputLabel id="change-type-label">Update Type</InputLabel>
        <Select
          name="type"
          labelId="change-type-label"
          label="Update Type"
          value={type}
          onChange={(e) => setType(e.target.value as LedgerType)}
          required
        >
          <MenuItem value={LedgerType.CAPITAL_CHANGE}>Capital Change (Manual)</MenuItem>
          <MenuItem value={LedgerType.DEPOSIT_CHANGE}>Deposit Change (Actual Funds)</MenuItem>
        </Select>
      </FormControl>

      <TextField
        name="capital"
        label="New Capital Value ($)"
        type="number"
        variant="outlined"
        fullWidth
        required
        size="small"
        value={capital}
        onChange={(e) => setCapital(e.target.value)}
        onKeyDown={handleIntegerKeyDown}
        slotProps={{ htmlInput: { step: '1' } }}
      />

      <TextField
        name="deposit"
        label="New Deposit Value ($)"
        type="number"
        variant="outlined"
        fullWidth
        required
        size="small"
        value={deposit}
        onChange={(e) => setDeposit(e.target.value)}
        onKeyDown={handleIntegerKeyDown}
        slotProps={{ htmlInput: { step: '1' } }}
      />

      <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          size="large"
          disabled={!isFormValid}
        >
          Save Changes
        </Button>
        <Link href="/investors" passHref style={{ width: '100%' }}>
          <Button
            variant="outlined"
            sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
            fullWidth
            size="large"
          >
            Cancel
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
