'use client';

import {
  Box,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { memo } from 'react';

interface EquityChartHeaderProps {
  title: string;
  view: 'capital' | 'deposit';
  mode: 'percent' | 'usd';
  showEmas: boolean;
  onViewChange: (newView: 'capital' | 'deposit' | null) => void;
  onModeChange: (newMode: 'percent' | 'usd' | null) => void;
  onShowEmasChange: (newVal: boolean) => void;
}

export const EquityChartHeader = memo(
  ({
    title,
    view,
    mode,
    showEmas,
    onViewChange,
    onModeChange,
    onShowEmasChange,
  }: EquityChartHeaderProps) => {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', lg: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
          {title}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 1, sm: 2 },
            alignItems: 'center',
            width: { xs: '100%', lg: 'auto' },
            flexWrap: 'wrap',
            justifyContent: { xs: 'space-between', lg: 'flex-end' },
          }}
        >
          <FormControlLabel
            control={
              <Switch
                checked={showEmas}
                onChange={(e) => onShowEmasChange(e.target.checked)}
                size="small"
              />
            }
            label="Show EMAs"
            sx={{
              m: 0,
              '& .MuiFormControlLabel-label': {
                fontSize: '0.8125rem',
                fontWeight: 'medium',
                color: showEmas ? 'primary.main' : 'text.secondary',
              },
            }}
          />

          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => onViewChange(newView)}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiToggleButton-root': {
                color: 'text.secondary',
                px: 1.5,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                border: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: 'text.primary',
                },
                '&.Mui-selected': {
                  color: '#fff',
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="capital">Capital View</ToggleButton>
            <ToggleButton value="deposit">Deposit View</ToggleButton>
          </ToggleButtonGroup>

          <ToggleButtonGroup
            value={mode}
            exclusive
            onChange={(_, newMode) => onModeChange(newMode)}
            size="small"
            sx={{
              bgcolor: 'rgba(0, 0, 0, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              '& .MuiToggleButton-root': {
                color: 'text.secondary',
                px: 2,
                fontSize: '0.75rem',
                fontWeight: 'bold',
                border: 'none',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  color: 'text.primary',
                },
                '&.Mui-selected': {
                  color: '#fff',
                  bgcolor: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.dark',
                  },
                },
              },
            }}
          >
            <ToggleButton value="percent">% Mode</ToggleButton>
            <ToggleButton value="usd">$ Mode</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>
    );
  }
);

EquityChartHeader.displayName = 'EquityChartHeader';
