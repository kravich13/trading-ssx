'use client';

import { CHART_COLORS } from '@/shared/consts';
import { Box, Typography, useTheme } from '@mui/material';
import { memo, useCallback, useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface ChartPoint {
  name: string;
  value: number;
  ema14: number | null;
  ema50: number | null;
  ema200: number | null;
  pl_percent?: number | null;
  pl_usd?: number | null;
  ticker?: string | null;
}

interface EquityChartCoreProps {
  data: ChartPoint[];
  view: 'capital' | 'deposit';
  mode: 'percent' | 'usd';
  showEmas: boolean;
  initialReferenceValue: number;
}

export const EquityChartCore = memo(
  ({ data, view, mode, showEmas, initialReferenceValue }: EquityChartCoreProps) => {
    const theme = useTheme();

    const emaLegendItems = useMemo(
      () => [
        { label: 'EMA 14', color: CHART_COLORS.EMA_14 },
        { label: 'EMA 50', color: CHART_COLORS.EMA_50 },
        { label: 'EMA 200', color: CHART_COLORS.EMA_200 },
      ],
      []
    );

    const formatValue = useCallback(
      (val: number) => {
        if (mode === 'percent') return `${val.toFixed(1)}%`;
        return `$${Math.round(val).toLocaleString()}`;
      },
      [mode]
    );

    const renderEmaLegend = useCallback(
      (item: { label: string; color: string }) => (
        <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {item.label}
          </Typography>
        </Box>
      ),
      []
    );

    return (
      <>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={CHART_COLORS.EQUITY} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={CHART_COLORS.EQUITY} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tick={{ fill: theme.palette.text.secondary }}
                hide={data.length > 50}
              />
              <YAxis
                stroke={theme.palette.text.secondary}
                fontSize={12}
                tick={{ fill: theme.palette.text.secondary }}
                domain={['auto', 'auto']}
                tickFormatter={formatValue}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload;
                    const viewLabel = view === 'capital' ? 'Capital' : 'Deposit';
                    return (
                      <Box
                        sx={{
                          backgroundColor: '#132f4c',
                          border: '1px solid #1e4976',
                          borderRadius: '4px',
                          p: 1.5,
                          color: '#fff',
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{ color: CHART_COLORS.EQUITY, fontWeight: 'bold', mb: 1 }}
                        >
                          {viewLabel} {mode === 'percent' ? '%' : ''}: {formatValue(d.value)}
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                          {showEmas && d.ema14 !== null && (
                            <Typography variant="caption" sx={{ color: CHART_COLORS.EMA_14 }}>
                              EMA 14: {formatValue(d.ema14)}
                            </Typography>
                          )}
                          {showEmas && d.ema50 !== null && (
                            <Typography variant="caption" sx={{ color: CHART_COLORS.EMA_50 }}>
                              EMA 50: {formatValue(d.ema50)}
                            </Typography>
                          )}
                          {showEmas && d.ema200 !== null && (
                            <Typography variant="caption" sx={{ color: CHART_COLORS.EMA_200 }}>
                              EMA 200: {formatValue(d.ema200)}
                            </Typography>
                          )}
                        </Box>

                        {(d.pl_percent !== undefined || d.pl_usd !== undefined) && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                              pt: 0.5,
                            }}
                          >
                            Trade PL:{' '}
                            {mode === 'percent'
                              ? `${d.pl_percent > 0 ? '+' : ''}${d.pl_percent.toFixed(2)}%`
                              : `${
                                  d.pl_usd > 0 ? '+' : ''
                                }$${Math.round(d.pl_usd).toLocaleString()}`}
                          </Typography>
                        )}
                        {d.ticker && d.ticker !== '-' && (
                          <Typography
                            variant="caption"
                            sx={{ display: 'block', fontStyle: 'italic' }}
                          >
                            Ticker: {d.ticker}
                          </Typography>
                        )}
                      </Box>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine y={initialReferenceValue} stroke="#f44336" strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey="value"
                stroke={CHART_COLORS.EQUITY}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEquity)"
                animationDuration={1000}
                dot={false}
              />

              {showEmas && (
                <>
                  <Line
                    type="monotone"
                    dataKey="ema14"
                    stroke={CHART_COLORS.EMA_14}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ema50"
                    stroke={CHART_COLORS.EMA_50}
                    strokeWidth={1.5}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="ema200"
                    stroke={CHART_COLORS.EMA_200}
                    strokeWidth={2}
                    dot={false}
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {showEmas && (
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
            {emaLegendItems.map(renderEmaLegend)}
          </Box>
        )}
      </>
    );
  }
);

EquityChartCore.displayName = 'EquityChartCore';
