import { getInvestors } from '@/entities/investor';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { addInvestorAction, deleteInvestorAction } from '../api';
import Link from 'next/link';

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
              <Box
                component="form"
                action={addInvestorAction}
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                <TextField
                  name="name"
                  label="Name"
                  variant="outlined"
                  fullWidth
                  required
                  size="small"
                />
                <TextField
                  name="capital"
                  label="Initial Capital ($)"
                  type="number"
                  variant="outlined"
                  fullWidth
                  required
                  size="small"
                  slotProps={{ htmlInput: { step: '0.01' } }}
                />
                <TextField
                  name="deposit"
                  label="Initial Deposit ($)"
                  type="number"
                  variant="outlined"
                  fullWidth
                  required
                  size="small"
                  slotProps={{ htmlInput: { step: '0.01' } }}
                />
                <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 1 }}>
                  Add Investor
                </Button>
              </Box>
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
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
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
                    <TableRow key={investor.id} hover>
                      <TableCell>
                        <Link
                          href={`/investors/${investor.id}`}
                          style={{
                            color: '#2196f3',
                            textDecoration: 'none',
                            fontWeight: 'medium',
                          }}
                        >
                          {investor.name}
                        </Link>
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
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                          <Link href={`/investors/${investor.id}/trades`} passHref>
                            <IconButton color="info" size="small" title="View Trade Log">
                              <HistoryIcon fontSize="small" />
                            </IconButton>
                          </Link>
                          <Link href={`/investors/${investor.id}/update`} passHref>
                            <IconButton color="primary" size="small" title="Update Balance">
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Link>
                          <form action={deleteInvestorAction.bind(null, investor.id)}>
                            <IconButton
                              type="submit"
                              color="error"
                              size="small"
                              title="Delete investor"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </form>
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
