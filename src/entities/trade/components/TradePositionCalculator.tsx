'use client';

import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  TextField,
  Typography,
  InputAdornment,
  Button,
} from '@mui/material';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { memo, useEffect, useMemo, useState } from 'react';
import { getLatestCapital } from '../api';

interface TradePositionCalculatorProps {
  riskPercent: string;
  initialOpen?: boolean;
}

export const TradePositionCalculator = memo(
  ({ riskPercent, initialOpen = false }: TradePositionCalculatorProps) => {
    const [showCalculator, setShowCalculator] = useState(initialOpen);
    const [capital, setCapital] = useState('0');
    const [defaultCapital, setDefaultCapital] = useState('0');
    const [stopPricePercent, setStopPricePercent] = useState('5');

    useEffect(() => {
      let mounted = true;

      const load = async () => {
        const val = await getLatestCapital();

        if (mounted) {
          const rounded = Math.round(val).toString();
          setCapital(rounded);
          setDefaultCapital(rounded);
        }
      };

      load();

      return () => {
        mounted = false;
      };
    }, []);

    const isCapitalChanged = useMemo(() => capital !== defaultCapital, [capital, defaultCapital]);

    const handleResetCapital = () => {
      setCapital(defaultCapital);
    };

    const calculationResults = useMemo(() => {
      const cap = parseFloat(capital) || 0;
      const r = parseFloat(riskPercent) || 0;
      const stopP = parseFloat(stopPricePercent) || 0;

      const stopAmountUsd = cap * (r / 100);
      const positionSizeUsd = stopP > 0 ? stopAmountUsd / (stopP / 100) : 0;

      return {
        stopAmountUsd,
        positionSizeUsd,
      };
    }, [capital, riskPercent, stopPricePercent]);

    const formatCurrencyDetailed = (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    return (
      <Box>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              checked={showCalculator}
              onChange={(e) => setShowCalculator(e.target.checked)}
            />
          }
          label={<Typography variant="body2">Calculate position size</Typography>}
        />

        <Box
          sx={{
            display: 'grid',
            gridTemplateRows: showCalculator ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.3s ease-out',
          }}
        >
          <Box sx={{ overflow: 'hidden' }}>
            <Box
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 1,
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <TextField
                label="Total Capital ($)"
                type="number"
                size="small"
                fullWidth
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                slotProps={{
                  input: {
                    endAdornment: isCapitalChanged && (
                      <InputAdornment position="end">
                        <Button
                          size="small"
                          onClick={handleResetCapital}
                          sx={{ minWidth: 'auto', p: 0.5, fontSize: '0.7rem' }}
                          startIcon={<RestartAltIcon sx={{ fontSize: '1rem !important' }} />}
                        >
                          Default
                        </Button>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <TextField
                label="Stop Loss on Price (%)"
                type="number"
                size="small"
                fullWidth
                value={stopPricePercent}
                onChange={(e) => setStopPricePercent(e.target.value)}
              />

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Stop Amount:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                  ${formatCurrencyDetailed(calculationResults.stopAmountUsd)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Position Size:
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  ${formatCurrencyDetailed(calculationResults.positionSizeUsd)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }
);

TradePositionCalculator.displayName = 'TradePositionCalculator';
