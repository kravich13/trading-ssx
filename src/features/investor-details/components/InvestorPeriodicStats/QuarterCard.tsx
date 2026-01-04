'use client';

import { QuarterStat, MonthStat } from '@/entities/investor';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Card, CardContent, Collapse, Divider, Typography } from '@mui/material';
import { memo, useCallback, useState } from 'react';

interface QuarterCardProps {
  quarter: QuarterStat;
}

export const QuarterCard = memo(({ quarter }: QuarterCardProps) => {
  const [open, setOpen] = useState(false);

  const color =
    quarter.usd > 0 ? 'success.main' : quarter.usd < 0 ? 'error.main' : 'text.secondary';

  const renderMonth = useCallback((month: MonthStat) => {
    const mColor = month.usd > 0 ? 'success.main' : month.usd < 0 ? 'error.main' : 'text.secondary';
    return (
      <Box key={month.label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
        <Typography variant="body2" color="text.secondary">
          {month.label}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: mColor, fontWeight: 'medium' }}>
            {month.usd >= 0 ? '+' : ''}${Math.round(month.usd).toLocaleString()}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: mColor, opacity: 0.7, minWidth: '50px', textAlign: 'right' }}
          >
            {month.percent >= 0 ? '+' : ''}
            {month.percent.toFixed(2)}%
          </Typography>
        </Box>
      </Box>
    );
  }, []);

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: 'rgba(255, 255, 255, 0.02)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'rgba(255, 255, 255, 0.2)',
        },
      }}
      onClick={() => setOpen(!open)}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight="bold">
            {quarter.label}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="body2" sx={{ color, fontWeight: 'bold' }}>
                {quarter.usd >= 0 ? '+' : ''}${Math.round(quarter.usd).toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ display: 'block', color, opacity: 0.8 }}>
                {quarter.percent >= 0 ? '+' : ''}
                {quarter.percent.toFixed(2)}%
              </Typography>
            </Box>
            {open ? (
              <KeyboardArrowUpIcon fontSize="small" sx={{ opacity: 0.5 }} />
            ) : (
              <KeyboardArrowDownIcon fontSize="small" sx={{ opacity: 0.5 }} />
            )}
          </Box>
        </Box>

        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 1.5, borderColor: 'rgba(255, 255, 255, 0.05)' }} />
            {quarter.months.map(renderMonth)}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

QuarterCard.displayName = 'QuarterCard';
