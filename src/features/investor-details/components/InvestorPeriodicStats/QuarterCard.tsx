'use client';

import { MonthStat, QuarterStat } from '@/entities/investor';
import { COLORS } from '@/shared/consts';
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

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

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
            <Box component="span" sx={{ fontSize: '0.7rem', ml: 0.5, opacity: 0.7 }}>
              ({month.percent >= 0 ? '+' : ''}
              {month.percent.toFixed(2)}% on dep.)
            </Box>
          </Typography>
        </Box>
      </Box>
    );
  }, []);

  return (
    <Card
      variant="outlined"
      sx={{
        bgcolor: COLORS.whiteAlpha02,
        borderColor: COLORS.whiteAlpha10,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          bgcolor: COLORS.whiteAlpha05,
          borderColor: COLORS.whiteAlpha20,
        },
      }}
      onClick={handleToggle}
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
                <Box component="span" sx={{ fontSize: '0.75rem', ml: 0.5, opacity: 0.8 }}>
                  ({quarter.percent >= 0 ? '+' : ''}
                  {quarter.percent.toFixed(2)}% on dep.)
                </Box>
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
            <Divider sx={{ mb: 1.5, borderColor: COLORS.whiteAlpha05 }} />
            {quarter.months.map(renderMonth)}
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
});

QuarterCard.displayName = 'QuarterCard';
