'use client';

import { TradeLike } from '@/entities/trade';
import { CHART_COLORS } from '@/shared/consts';
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from '@mui/material';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { EquityChartStorageKeys } from '../enums';

interface EquityChartProps {
  trades: TradeLike[];
  title?: string;
  initialBalance?: number;
}

function calculateEMAs(values: number[], period: number): (number | null)[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const result: (number | null)[] = [];
  let ema = values[0];
  result.push(ema);

  for (let i = 1; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

export function EquityChart({
  trades,
  title = 'Equity Curve',
  initialBalance = 0,
}: EquityChartProps) {
  const theme = useTheme();

  const [mode, setMode] = useState<'percent' | 'usd'>(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem(EquityChartStorageKeys.MODE);
      if (savedMode === 'percent' || savedMode === 'usd') {
        return savedMode;
      }
    }
    return 'percent';
  });

  const [showEmas, setShowEmas] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedShowEmas = localStorage.getItem(EquityChartStorageKeys.SHOW_EMAS);
      if (savedShowEmas !== null) {
        return savedShowEmas === 'true';
      }
    }
    return true;
  });

  const handleModeChange = useCallback((newMode: 'percent' | 'usd' | null) => {
    if (newMode) {
      setMode(newMode);
      localStorage.setItem(EquityChartStorageKeys.MODE, newMode);
    }
  }, []);

  const handleShowEmasChange = useCallback((newVal: boolean) => {
    setShowEmas(newVal);
    localStorage.setItem(EquityChartStorageKeys.SHOW_EMAS, newVal.toString());
  }, []);

  const { percentValues, usdValues, baseData } = useMemo(() => {
    const sorted = [...trades].sort((a, b) => a.id - b.id);
    const pValues = [100];
    const uValues = [initialBalance];
    const bData = [];
    let currentP = 100;

    for (const t of sorted) {
      currentP += t.pl_percent || 0;
      pValues.push(currentP);
      uValues.push(t.deposit_value);
      bData.push({
        id: t.id,
        pl_percent: t.pl_percent || 0,
        pl_usd: t.change_amount || 0,
        ticker: t.ticker || '-',
      });
    }

    return { percentValues: pValues, usdValues: uValues, baseData: bData };
  }, [trades, initialBalance]);

  const { data } = useMemo(() => {
    const activeValues = mode === 'percent' ? percentValues : usdValues;
    const e14 = calculateEMAs(activeValues, 14);
    const e50 = calculateEMAs(activeValues, 50);
    const e200 = calculateEMAs(activeValues, 200);

    const chartData = activeValues.map((v, i) => ({
      name: i === 0 ? 'Start' : `T ${baseData[i - 1].id}`,
      value: Number(v.toFixed(2)),
      ema14: e14[i] ? Number(e14[i]!.toFixed(2)) : null,
      ema50: e50[i] ? Number(e50[i]!.toFixed(2)) : null,
      ema200: e200[i] ? Number(e200[i]!.toFixed(2)) : null,
      pl_percent: i === 0 ? undefined : baseData[i - 1].pl_percent,
      pl_usd: i === 0 ? undefined : baseData[i - 1].pl_usd,
      ticker: i === 0 ? undefined : baseData[i - 1].ticker,
    }));

    return { data: chartData };
  }, [mode, percentValues, usdValues, baseData]);

  const formatValue = useCallback(
    (val: number) => {
      if (mode === 'percent') return `${val.toFixed(1)}%`;
      return `$${Math.round(val).toLocaleString()}`;
    },
    [mode]
  );

  return (
    <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976', mb: 4 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main' }}>
            {title}
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={showEmas}
                  onChange={(e) => handleShowEmasChange(e.target.checked)}
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
              value={mode}
              exclusive
              onChange={(_, newMode) => handleModeChange(newMode)}
              size="small"
              sx={{
                bgcolor: 'background.default',
                '& .MuiToggleButton-root': {
                  color: 'text.secondary',
                  px: 2,
                  '&.Mui-selected': {
                    color: 'primary.main',
                    bgcolor: 'action.selected',
                  },
                },
              }}
            >
              <ToggleButton value="percent">% Mode</ToggleButton>
              <ToggleButton value="usd">$ Mode</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
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
                          {mode === 'percent' ? 'Deposit %' : 'Deposit'}: {formatValue(d.value)}
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
                              : `${d.pl_usd > 0 ? '+' : ''}$${Math.round(d.pl_usd).toLocaleString()}`}
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
              <ReferenceLine
                y={mode === 'percent' ? 100 : initialBalance}
                stroke="#f44336"
                strokeDasharray="3 3"
              />

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
            {[
              { label: 'EMA 14', color: CHART_COLORS.EMA_14 },
              { label: 'EMA 50', color: CHART_COLORS.EMA_50 },
              { label: 'EMA 200', color: CHART_COLORS.EMA_200 },
            ].map((item) => (
              <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {item.label}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
