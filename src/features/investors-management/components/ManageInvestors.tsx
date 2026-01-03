import { getInvestors } from '@/entities/investor';
import HistoryIcon from '@mui/icons-material/History';
import {
  Box,
  Card,
  CardContent,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { ToggleInvestorStatusButton } from './ToggleInvestorStatusButton';
import { AddInvestorForm } from './AddInvestorForm';

export async function ManageInvestors() {
  const investors = await getInvestors();

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
        Investor Management
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { md: '1fr 2fr' }, gap: 4, mt: 4 }}>
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add New Investor
              </Typography>
              <AddInvestorForm />
            </CardContent>
          </Card>
        </Box>

        <Box>
          <Typography variant="h6" gutterBottom>
            Existing Investors
          </Typography>
          <TableContainer component={Paper} elevation={2}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Current Capital
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    Current Deposit
                  </TableCell>
                  <TableCell align="left" sx={{ fontWeight: 'bold', width: '120px' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {investors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No investors found. Add one to get started.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  investors.map((investor) => (
                    <TableRow
                      key={investor.id}
                      hover
                      sx={{ opacity: investor.is_active ? 1 : 0.6 }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Link
                            href={`/investors/${investor.id}`}
                            style={{
                              color: investor.is_active ? '#2196f3' : '#9e9e9e',
                              textDecoration: 'none',
                              fontWeight: 'medium',
                            }}
                          >
                            {investor.name}
                          </Link>
                          {!investor.is_active && (
                            <Chip
                              label="Archived"
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        $
                        {investor.current_capital.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell align="right">
                        $
                        {investor.current_deposit.toLocaleString(undefined, {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 0,
                        })}
                      </TableCell>
                      <TableCell align="left">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 1 }}>
                          <Link href={`/investors/${investor.id}/trades`} passHref>
                            <IconButton color="info" size="small" title="View Trade Log">
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Link>
                          <ToggleInvestorStatusButton
                            investorId={investor.id}
                            investorName={investor.name}
                            isActive={investor.is_active}
                          />
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
}
