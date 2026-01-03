'use client';

import { TradeLike } from '@/entities/trade';
import { Box, Card, CardContent, Typography, useTheme } from '@mui/material';
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface EquityChartProps {
  trades: TradeLike[];
  title?: string;
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

export function EquityChart({ trades, title = 'Equity Curve' }: EquityChartProps) {
  const theme = useTheme();

  const sortedTrades = [...trades].sort((a, b) => a.id - b.id);

  let currentPercent = 100;
  const equityValues = [100];
  const baseData = sortedTrades.map((t) => {
    const pl = t.pl_percent || 0;
    currentPercent += pl;
    equityValues.push(currentPercent);
    return {
      id: t.id,
      pl: pl,
      ticker: t.ticker || '-',
    };
  });

  const ema14 = calculateEMAs(equityValues, 14);
  const ema50 = calculateEMAs(equityValues, 50);
  const ema200 = calculateEMAs(equityValues, 200);

  const data = equityValues.map((v, i) => ({
    name: i === 0 ? 'Start' : `T ${baseData[i - 1].id}`,
    equity: Number(v.toFixed(2)),
    ema14: ema14[i] ? Number(ema14[i]!.toFixed(2)) : null,
    ema50: ema50[i] ? Number(ema50[i]!.toFixed(2)) : null,
    ema200: ema200[i] ? Number(ema200[i]!.toFixed(2)) : null,
    pl: i === 0 ? undefined : baseData[i - 1].pl,
    ticker: i === 0 ? undefined : baseData[i - 1].ticker,
  }));

  const chartColor = '#4caf50';
  const ema14Color = '#ff9800';
  const ema50Color = '#2196f3';
  const ema200Color = '#d32f2f';

  return (
    <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976', mb: 4 }}>
      <CardContent>
        <Typography
          variant="h6"
          gutterBottom
          fontWeight="bold"
          sx={{ color: 'primary.main', mb: 3 }}
        >
          {title}
        </Typography>
        <Box sx={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
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
                tickFormatter={(value) => `${value.toFixed(1)}%`}
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
                          sx={{ color: chartColor, fontWeight: 'bold', mb: 1 }}
                        >
                          Deposit: {d.equity.toFixed(2)}%
                        </Typography>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 1 }}>
                          {d.ema14 && (
                            <Typography variant="caption" sx={{ color: ema14Color }}>
                              EMA 14: {d.ema14.toFixed(2)}%
                            </Typography>
                          )}
                          {d.ema50 && (
                            <Typography variant="caption" sx={{ color: ema50Color }}>
                              EMA 50: {d.ema50.toFixed(2)}%
                            </Typography>
                          )}
                          {d.ema200 && (
                            <Typography variant="caption" sx={{ color: ema200Color }}>
                              EMA 200: {d.ema200.toFixed(2)}%
                            </Typography>
                          )}
                        </Box>

                        {d.pl !== undefined && (
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              borderTop: '1px solid rgba(255,255,255,0.1)',
                              pt: 0.5,
                            }}
                          >
                            Trade PL: {d.pl > 0 ? '+' : ''}
                            {d.pl.toFixed(2)}%
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
              <ReferenceLine y={100} stroke="#f44336" strokeDasharray="3 3" />

              <Area
                type="monotone"
                dataKey="equity"
                stroke={chartColor}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEquity)"
                animationDuration={1000}
                dot={false}
              />

              <Line
                type="monotone"
                dataKey="ema14"
                stroke={ema14Color}
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ema50"
                stroke={ema50Color}
                strokeWidth={1.5}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ema200"
                stroke={ema200Color}
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
          {[
            { label: 'EMA 14', color: ema14Color },
            { label: 'EMA 50', color: ema50Color },
            { label: 'EMA 200', color: ema200Color },
          ].map((item) => (
            <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {item.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}
