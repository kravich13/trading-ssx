'use client';

import { TradeLike } from '@/entities/trade';
import { COLORS } from '@/shared/consts';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import { memo, useCallback, useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface GaltonBoardProps {
  trades: TradeLike[];
}

export const GaltonBoard = memo(({ trades }: GaltonBoardProps) => {
  const theme = useTheme();

  const data = useMemo(() => {
    const validTrades = trades.filter((t) => t.pl_percent !== null);

    if (validTrades.length === 0) return [];

    const plValues = validTrades.map((t) => t.pl_percent || 0);
    const minPl = Math.min(...plValues);
    const maxPl = Math.max(...plValues);

    const startBin = Math.min(-5, Math.floor(minPl));
    const endBin = Math.max(5, Math.ceil(maxPl));

    const bins: { [key: number]: number } = {};
    for (let i = startBin; i <= endBin; i++) {
      bins[i] = 0;
    }

    validTrades.forEach((t) => {
      const pl = t.pl_percent || 0;
      const bin = Math.round(pl);
      if (bins[bin] !== undefined) {
        bins[bin]++;
      }
    });

    return Object.keys(bins)
      .map((key) => ({
        bin: Number(key),
        count: bins[Number(key)],
        label: `${key}%`,
      }))
      .sort((a, b) => a.bin - b.bin);
  }, [trades]);

  const renderCell = useCallback(
    (entry: { bin: number }, index: number) => (
      <Cell
        key={`cell-${index}`}
        fill={
          entry.bin > 0 ? COLORS.successMain : entry.bin < 0 ? COLORS.errorMain : COLORS.textMuted
        }
      />
    ),
    []
  );

  if (data.length === 0) return null;

  return (
    <Card
      elevation={1}
      sx={{
        bgcolor: 'background.paper',
        border: `1px solid ${COLORS.borderPrimary}`,
        mb: 4,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          fontWeight="bold"
          sx={{ color: 'primary.main', mb: 3 }}
        >
          Galton Board (PL% Distribution)
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={COLORS.whiteAlpha10} vertical={false} />
              <XAxis
                dataKey="label"
                stroke={theme.palette.text.secondary}
                fontSize={10}
                tick={{ fill: theme.palette.text.secondary }}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tick={{ fill: theme.palette.text.secondary }}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <Box
                        sx={{
                          backgroundColor: COLORS.bgPaper,
                          border: `1px solid ${COLORS.borderPrimary}`,
                          borderRadius: '4px',
                          p: 1.5,
                          color: COLORS.white,
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {label}
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'primary.main' }}>
                          Trades: {payload[0].value}
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: COLORS.whiteAlpha05 }}
              />
              <Bar dataKey="count" name="Trades">
                {data.map(renderCell)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
});

GaltonBoard.displayName = 'GaltonBoard';
