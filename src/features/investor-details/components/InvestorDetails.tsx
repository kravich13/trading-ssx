import { getInvestorById, getInvestorLedger } from '@/entities/investor';
import { LedgerType, TradeType } from '@/shared/enum';
import { calculatePlPercent } from '@/shared/utils';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, Button, Typography } from '@mui/material';
import Link from 'next/link';
import { AddPrivateTradeButton } from './AddPrivateTradeButton';
import { InvestorDetailsTabs } from './InvestorDetailsTabs';

interface InvestorDetailsProps {
  id: number;
}

export async function InvestorDetails({ id }: InvestorDetailsProps) {
  const [investor, ledger] = await Promise.all([getInvestorById(id), getInvestorLedger(id)]);

  if (!investor) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Investor not found
        </Typography>
        <Link href="/investors" passHref>
          <Button variant="outlined" sx={{ mt: 2 }} startIcon={<ArrowBackIcon />}>
            Back to Investors
          </Button>
        </Link>
      </Box>
    );
  }

  const tradesOnly = ledger
    .filter((row) => row.type === LedgerType.TRADE)
    .map((row) => {
      const plPercent = calculatePlPercent(row.capital_before, row.change_amount);
      return {
        id: row.trade_id || row.id,
        ticker: row.ticker || '',
        pl_percent: plPercent,
        change_amount: row.change_amount,
        absolute_value: row.capital_after,
        deposit_value: row.deposit_after,
        default_risk_percent: row.default_risk_percent,
      };
    });

  const firstTrade = ledger.find((r) => r.type === LedgerType.TRADE);
  const initialInvestorDeposit = firstTrade ? firstTrade.deposit_before : 0;
  const initialInvestorCapital = firstTrade ? firstTrade.capital_before : 0;

  return (
    <Box sx={{ py: 4 }}>
      <Box
        sx={{
          mb: 4,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link href="/investors" passHref>
            <Button
              variant="text"
              startIcon={<ArrowBackIcon />}
              sx={{ color: 'text.secondary', minWidth: 'auto' }}
            >
              Back
            </Button>
          </Link>
          <Typography
            variant="h4"
            component="h1"
            fontWeight="bold"
            sx={{ fontSize: { xs: '1.5rem', sm: '2.125rem' } }}
          >
            {investor.name}&apos;s Trading Log
          </Typography>
        </Box>
        {investor.type === TradeType.PRIVATE && <AddPrivateTradeButton investorId={investor.id} />}
      </Box>

      <InvestorDetailsTabs
        investorName={investor.name}
        ledger={ledger}
        tradesOnly={tradesOnly}
        initialInvestorDeposit={initialInvestorDeposit}
        initialInvestorCapital={initialInvestorCapital}
      />
    </Box>
  );
}
