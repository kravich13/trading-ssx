import { getGlobalFinanceStats } from '@/entities/investor';
import { getAllTrades } from '@/entities/trade';
import { LedgerType, TradeType } from '@/shared/enum';
import { calculatePlPercent } from '@/shared/utils';
import { Box, Typography } from '@mui/material';
import { processTotalTradesData } from '../utils';
import { AddTradeButton } from './AddTradeButton';
import { ExportToExcelButton } from './ExportToExcelButton';
import { TotalTradesTabs } from './TotalTradesTabs';

export async function TotalTrades() {
  const [allTrades, financeStats] = await Promise.all([getAllTrades(), getGlobalFinanceStats()]);

  const trades = allTrades.filter((t) => t.type === TradeType.GLOBAL);

  const { tradeLikeData, initialTotalDeposit, initialTotalCapital } =
    processTotalTradesData(trades);

  const sortedTrades = [...trades].sort((a, b) => {
    const dateA = a.closed_date ? new Date(a.closed_date).getTime() : 0;
    const dateB = b.closed_date ? new Date(b.closed_date).getTime() : 0;
    return dateA - dateB;
  });

  const globalTradeLedger = sortedTrades.reduce(
    (acc, t) => {
      const changeAmount = t.total_pl_usd;

      const depositBefore = acc.runningDeposit;
      const capitalBefore = acc.runningCapital;

      const newDeposit = acc.runningDeposit + changeAmount;
      const newCapital = acc.runningCapital + changeAmount;

      const plPercent = calculatePlPercent(capitalBefore, changeAmount);

      acc.ledger.push({
        id: t.id,
        investor_id: 0,
        trade_id: t.id,
        type: LedgerType.TRADE,
        change_amount: changeAmount,
        capital_before: capitalBefore,
        capital_after: newCapital,
        deposit_before: depositBefore,
        deposit_after: newDeposit,
        ticker: t.ticker,
        pl_percent: plPercent,
        default_risk_percent: t.default_risk_percent,
        closed_date: t.closed_date,
        created_at: t.created_at,
      });

      acc.runningDeposit = newDeposit;
      acc.runningCapital = newCapital;

      return acc;
    },
    {
      runningDeposit: initialTotalDeposit,
      runningCapital: initialTotalCapital,
      ledger: [] as Array<{
        id: number;
        investor_id: number;
        trade_id: number;
        type: LedgerType;
        change_amount: number;
        capital_before: number;
        capital_after: number;
        deposit_before: number;
        deposit_after: number;
        ticker: string;
        pl_percent: number;
        default_risk_percent: number | null;
        closed_date: string | null;
        created_at: string;
      }>,
    }
  ).ledger;

  return (
    <Box sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          sx={{ fontSize: { xs: '1.8rem', sm: '2.125rem' } }}
        >
          Total Trades Log (Global only)
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <ExportToExcelButton trades={sortedTrades} />
          <AddTradeButton />
        </Box>
      </Box>

      <TotalTradesTabs
        allTrades={trades}
        tradeLikeData={tradeLikeData}
        financeStats={financeStats}
        initialTotalDeposit={initialTotalDeposit}
        initialTotalCapital={initialTotalCapital}
        globalTradeLedger={globalTradeLedger}
      />
    </Box>
  );
}
