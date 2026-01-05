'use client';

import { useState, memo, useCallback } from 'react';
import { Box, Button, MenuItem, TextField } from '@mui/material';
import { addInvestorAction } from '../api';
import { TradeType } from '@/shared/enum';

export const AddInvestorForm = memo(() => {
  const [name, setName] = useState('');
  const [capital, setCapital] = useState('');
  const [deposit, setDeposit] = useState('');
  const [type, setType] = useState(TradeType.GLOBAL);

  const isFormValid =
    name.trim() !== '' &&
    capital !== '' &&
    Number(capital) > 0 &&
    deposit !== '' &&
    Number(deposit) > 0;

  const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  }, []);

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
    setName(value);
  }, []);

  const handleCapitalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCapital(e.target.value);
  }, []);

  const handleDepositChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDeposit(e.target.value);
  }, []);

  const handleFormAction = useCallback(async (formData: FormData) => {
    await addInvestorAction(formData);
    setName('');
    setCapital('');
    setDeposit('');
    setType(TradeType.GLOBAL);
  }, []);

  return (
    <Box
      component="form"
      action={handleFormAction}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <TextField
        name="name"
        label="Name"
        variant="outlined"
        fullWidth
        required
        size="small"
        value={name}
        onChange={handleNameChange}
        slotProps={{
          htmlInput: {
            pattern: '[a-zA-Z0-9_-]*',
            title: 'Only English letters, numbers, underscores and hyphens allowed. No spaces.',
          },
        }}
      />
      <TextField
        select
        name="type"
        label="Account Type"
        value={type}
        onChange={(e) => setType(e.target.value as TradeType)}
        fullWidth
        size="small"
        required
      >
        <MenuItem value={TradeType.GLOBAL}>GLOBAL (Shared)</MenuItem>
        <MenuItem value={TradeType.PRIVATE}>PRIVATE (Personal)</MenuItem>
      </TextField>
      <TextField
        name="capital"
        label="Initial Capital ($)"
        type="number"
        variant="outlined"
        fullWidth
        required
        size="small"
        value={capital}
        onChange={handleCapitalChange}
        onKeyDown={handleIntegerKeyDown}
        slotProps={{ htmlInput: { step: '1', min: '1' } }}
      />
      <TextField
        name="deposit"
        label="Initial Deposit ($)"
        type="number"
        variant="outlined"
        fullWidth
        required
        size="small"
        value={deposit}
        onChange={handleDepositChange}
        onKeyDown={handleIntegerKeyDown}
        slotProps={{ htmlInput: { step: '1', min: '1' } }}
      />
      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        sx={{ mt: 1, py: { xs: 1.2, sm: 1 } }}
        disabled={!isFormValid}
      >
        Add Investor
      </Button>
    </Box>
  );
});

AddInvestorForm.displayName = 'AddInvestorForm';
