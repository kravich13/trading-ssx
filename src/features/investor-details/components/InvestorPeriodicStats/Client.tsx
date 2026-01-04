'use client';

import { YearStat } from '@/entities/investor';
import { Box, Card, CardContent, Grid, Tab, Tabs, Typography } from '@mui/material';
import { memo, useEffect, useState } from 'react';
import { QuarterCard } from './QuarterCard';

interface ClientProps {
  stats: YearStat[];
}

export const Client = memo(({ stats }: ClientProps) => {
  const [selectedYearIdx, setSelectedYearIdx] = useState(0);

  useEffect(() => {
    if (stats.length > 0) {
      const timer = setTimeout(() => {
        setSelectedYearIdx(0);
      }, 0);

      return () => clearTimeout(timer);
    }
  }, [stats]);

  if (stats.length === 0) return null;

  const currentYearData = stats[selectedYearIdx];

  return (
    <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedYearIdx}
          onChange={(_, newValue) => setSelectedYearIdx(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              fontWeight: 'bold',
              minWidth: 100,
            },
          }}
        >
          {stats.map((yearStat) => (
            <Tab key={yearStat.year} label={yearStat.year} />
          ))}
        </Tabs>
      </Box>

      <CardContent sx={{ p: 3 }}>
        {currentYearData && (
          <>
            <Box
              sx={{
                mb: 4,
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
              }}
            >
              <Box>
                <Typography variant="h5" fontWeight="bold">
                  Year {currentYearData.year}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Detailed breakdown by quarters and months
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography
                  variant="h5"
                  sx={{
                    color: currentYearData.usd >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold',
                  }}
                >
                  {currentYearData.usd >= 0 ? '+' : ''}$
                  {Math.round(currentYearData.usd).toLocaleString()}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium', opacity: 0.8 }}>
                  Total Annual Growth ({currentYearData.percent >= 0 ? '+' : ''}
                  {currentYearData.percent.toFixed(2)}%)
                </Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              {currentYearData.quarters.map((q) => (
                <Grid size={{ xs: 12, sm: 6 }} key={q.label}>
                  <QuarterCard quarter={q} />
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </CardContent>
    </Card>
  );
});

Client.displayName = 'Client';
