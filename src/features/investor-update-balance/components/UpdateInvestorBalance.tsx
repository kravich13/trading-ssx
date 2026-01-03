import { getInvestorById } from '@/entities/investor';
import { LedgerType } from '@/shared/enum';
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { updateBalanceAction } from '../api';

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
          <Box
            component="form"
            action={updateBalanceAction.bind(null, id)}
            sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
          >
            <Typography variant="body2" color="text.secondary">
              Current Capital: ${Math.round(investor.current_capital).toLocaleString()} | Current
              Deposit: ${Math.round(investor.current_deposit).toLocaleString()}
            </Typography>

            <FormControl fullWidth size="small">
              <InputLabel id="change-type-label">Update Type</InputLabel>
              <Select
                name="type"
                labelId="change-type-label"
                label="Update Type"
                defaultValue={LedgerType.CAPITAL_CHANGE}
                required
              >
                <MenuItem value={LedgerType.CAPITAL_CHANGE}>Capital Change (Manual)</MenuItem>
                <MenuItem value={LedgerType.DEPOSIT_CHANGE}>Deposit Change (Actual Funds)</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="capital"
              label="New Capital Value ($)"
              type="number"
              variant="outlined"
              fullWidth
              required
              size="small"
              defaultValue={Math.round(investor.current_capital)}
              slotProps={{ htmlInput: { step: '1' } }}
            />

            <TextField
              name="deposit"
              label="New Deposit Value ($)"
              type="number"
              variant="outlined"
              fullWidth
              required
              size="small"
              defaultValue={Math.round(investor.current_deposit)}
              slotProps={{ htmlInput: { step: '1' } }}
            />

            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button type="submit" variant="contained" color="primary" fullWidth size="large">
                Save Changes
              </Button>
              <Link href="/investors" passHref style={{ width: '100%' }}>
                <Button
                  variant="outlined"
                  sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.3)' }}
                  fullWidth
                  size="large"
                >
                  Cancel
                </Button>
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
