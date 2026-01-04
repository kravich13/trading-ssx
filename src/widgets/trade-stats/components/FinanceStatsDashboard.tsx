import { calculateFinanceStats, FinanceStats } from '@/entities/investor';
import { LedgerEntry } from '@/entities/investor/types';
import { Box, Card, CardContent, Grid, Typography, Divider } from '@mui/material';

interface FinanceStatsDashboardProps {
  ledger?: LedgerEntry[];
  stats?: FinanceStats;
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

export function FinanceStatsDashboard({
  ledger,
  stats: providedStats,
}: FinanceStatsDashboardProps) {
  const stats = providedStats || (ledger ? calculateFinanceStats(ledger) : null);

  if (!stats) return null;

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const getGrowthColor = (value: number) => {
    if (value > 0) return 'success.main';
    if (value < 0) return 'error.main';
    return 'text.secondary';
  };

  return (
    <Box sx={{ mb: 4, px: 0.5 }}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 'bold', color: '#2196f3' }}
              >
                Capital Metrics
              </Typography>
              <StatRow
                label="Current Capital"
                value={`$${formatCurrency(stats.currentCapital)}`}
                isBold
              />
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              <StatRow
                label="Growth MTD ($)"
                value={`${stats.monthCapitalGrowthUsd >= 0 ? '+' : ''}$${formatCurrency(
                  stats.monthCapitalGrowthUsd
                )}`}
                color={getGrowthColor(stats.monthCapitalGrowthUsd)}
              />
              <StatRow
                label="Growth MTD (%)"
                value={`${stats.monthCapitalGrowthPercent >= 0 ? '+' : ''}${stats.monthCapitalGrowthPercent.toFixed(
                  2
                )}%`}
                color={getGrowthColor(stats.monthCapitalGrowthPercent)}
                isBold
              />
              <StatRow
                label="Growth QTD (%)"
                value={`${stats.quarterCapitalGrowthPercent >= 0 ? '+' : ''}${stats.quarterCapitalGrowthPercent.toFixed(
                  2
                )}%`}
                color={getGrowthColor(stats.quarterCapitalGrowthPercent)}
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card elevation={1} sx={{ bgcolor: 'background.paper', border: '1px solid #1e4976' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography
                variant="subtitle2"
                sx={{ mb: 1.5, fontWeight: 'bold', color: '#ff9800' }}
              >
                Deposit Metrics
              </Typography>
              <StatRow
                label="Current Deposit"
                value={`$${formatCurrency(stats.currentDeposit)}`}
                isBold
              />
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              <StatRow
                label="Growth MTD ($)"
                value={`${stats.monthDepositGrowthUsd >= 0 ? '+' : ''}$${formatCurrency(
                  stats.monthDepositGrowthUsd
                )}`}
                color={getGrowthColor(stats.monthDepositGrowthUsd)}
              />
              <StatRow
                label="Growth MTD (%)"
                value={`${stats.monthDepositGrowthPercent >= 0 ? '+' : ''}${stats.monthDepositGrowthPercent.toFixed(
                  2
                )}%`}
                color={getGrowthColor(stats.monthDepositGrowthPercent)}
                isBold
              />
              <StatRow
                label="Growth QTD (%)"
                value={`${stats.quarterDepositGrowthPercent >= 0 ? '+' : ''}${stats.quarterDepositGrowthPercent.toFixed(
                  2
                )}%`}
                color={getGrowthColor(stats.quarterDepositGrowthPercent)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
