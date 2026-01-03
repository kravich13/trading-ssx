import { getInvestorById } from '@/entities/investor';
import { Box, Button, Card, CardContent, Typography } from '@mui/material';
import Link from 'next/link';
import { UpdateInvestorBalanceForm } from './UpdateInvestorBalanceForm';

export async function UpdateInvestorBalance({ id }: { id: number }) {
  const investor = await getInvestorById(id);

  if (!investor) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom>
          Investor not found
        </Typography>
        <Link href="/investors" passHref>
          <Button variant="outlined" sx={{ mt: 2 }}>
            Back to Investors
          </Button>
        </Link>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Update Balance: {investor.name}
      </Typography>

      <Card elevation={2} sx={{ mt: 4, maxWidth: '600px', width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <UpdateInvestorBalanceForm
            id={id}
            initialCapital={investor.current_capital}
            initialDeposit={investor.current_deposit}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
