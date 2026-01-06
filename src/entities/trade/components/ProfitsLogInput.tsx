'use client';

import { COLORS } from '@/shared/consts';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, IconButton, TextField, Typography } from '@mui/material';
import { memo, useCallback, useMemo } from 'react';

interface ProfitsLogInputProps {
  profits: (number | string)[];
  disabled?: boolean;
  onProfitsChange: (profits: (number | string)[]) => void;
  formatCurrency: (value: number) => string;
}

export const ProfitsLogInput = memo(
  ({ profits, disabled = false, onProfitsChange, formatCurrency }: ProfitsLogInputProps) => {
    const handleProfitChange = useCallback(
      (index: number, value: string) => {
        const newProfits = [...profits];
        newProfits[index] = value;
        onProfitsChange(newProfits);
      },
      [profits, onProfitsChange]
    );

    const handleRemoveProfit = useCallback(
      (index: number) => {
        const newProfits = profits.filter((_, i) => i !== index);
        onProfitsChange(newProfits);
      },
      [profits, onProfitsChange]
    );

    const handleAddProfit = useCallback(() => {
      onProfitsChange([...profits, '']);
    }, [profits, onProfitsChange]);

    const handleIntegerKeyDown = useCallback((e: React.KeyboardEvent) => {
      if (e.key === '.' || e.key === ',') {
        e.preventDefault();
      }
    }, []);

    const totalProfit = useMemo(() => {
      return profits.reduce<number>((sum, p) => {
        const val = typeof p === 'string' ? parseFloat(p) || 0 : p;
        return sum + val;
      }, 0);
    }, [profits]);

    const renderProfitInput = useCallback(
      (profit: string | number, index: number) => {
        return (
          <Box key={index} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              label={`Part ${index + 1}`}
              type="number"
              size="small"
              fullWidth
              value={profit}
              onChange={(e) => handleProfitChange(index, e.target.value)}
              onKeyDown={handleIntegerKeyDown}
              disabled={disabled}
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
                disabled={disabled}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        );
      },
      [handleProfitChange, handleIntegerKeyDown, handleRemoveProfit, disabled, profits.length]
    );

    return (
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
            disabled={disabled}
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
    );
  }
);

ProfitsLogInput.displayName = 'ProfitsLogInput';
