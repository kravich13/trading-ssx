import { Trade, calculateTradeStats } from '@/entities/trade';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';

interface TradeStatsDashboardProps {
  trades: Trade[];
}

const StatRow = ({
  label,
  value,
  color,
  isBold = false,
}: {
  label: string;
  value: string | number;
  color?: string;
  isBold?: boolean;
}) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
    <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
      {label}
    </Typography>
    <Typography
      variant="body2"
      sx={{
        color: color || 'text.primary',
        fontWeight: isBold ? 'bold' : 'medium',
        minWidth: '80px',
        textAlign: 'right',
      }}
    >
      {value}
    </Typography>
  </Box>
);

export function TradeStatsDashboard({ trades }: TradeStatsDashboardProps) {
  const stats = calculateTradeStats(trades);

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  return (
    <Box sx={{ mb: 4, px: 0.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <StatRow label="Total trades" value={stats.totalTrades} />
              <StatRow label="Number of P trades" value={stats.wins} color="success.main" />
              <StatRow label="Number of N trades" value={stats.losses} color="error.main" />
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              <StatRow label="Total profit" value={formatCurrency(stats.totalProfitUsd)} />
              <StatRow
                label="Total loss"
                value={formatCurrency(stats.totalLossUsd)}
                color="error.main"
              />
              <StatRow
                label="Accuracy of 1k trades"
                value={`${stats.winRate.toFixed(1)}%`}
                isBold
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <StatRow label="Correlation P/L" value={stats.rewardRatio.toFixed(2)} isBold />
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              <StatRow
                label="P avg (USD)"
                value={formatCurrency(stats.avgWinUsd)}
                color="success.main"
              />
              <StatRow
                label="L avg (USD)"
                value={formatCurrency(stats.avgLossUsd)}
                color="error.main"
              />
              <StatRow
                label="P avg (% of depo)"
                value={`${stats.avgWinPercent.toFixed(1)}%`}
                color="success.main"
              />
              <StatRow
                label="L avg (% of depo)"
                value={`${stats.avgLossPercent.toFixed(1)}%`}
                color="error.main"
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 4 }}>
          <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <StatRow
                label="Max Profit"
                value={`${stats.maxProfitPercent.toFixed(1)}%`}
                color="success.main"
                isBold
              />
              <StatRow
                label="Max Loss"
                value={`${stats.maxLossPercent.toFixed(1)}%`}
                color="error.main"
                isBold
              />
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              <StatRow label="Max P series" value={stats.maxWinStreak} color="success.main" />
              <StatRow label="Max L series" value={stats.maxLossStreak} color="error.main" />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
