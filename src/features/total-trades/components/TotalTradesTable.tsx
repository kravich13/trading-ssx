'use client';

import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { Trade } from '@/entities/trade/types';
import { TradeStatus } from '@/shared/enum';
import { ConfirmModal } from '@/shared/ui/modals';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState, memo, useCallback } from 'react';

interface TotalTradesTableProps {
  trades: Trade[];
}

export const TotalTradesTable = memo(({ trades }: TotalTradesTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState<string>('');
  const [editStatus, setEditStatus] = useState<TradeStatus>(TradeStatus.CLOSED);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleDeleteClick = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedTrade) {
      await deleteTrade(selectedTrade.id);
      setDeleteModalOpen(false);
      setSelectedTrade(null);
    }
  }, [selectedTrade]);

  const handleEditClick = useCallback((trade: Trade) => {
    setSelectedTrade(trade);
    setEditDate(trade.closed_date ? trade.closed_date.split(' ')[0] : '');
    setEditStatus(trade.status || TradeStatus.CLOSED);
    setEditModalOpen(true);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedTrade) {
      await updateTrade(selectedTrade.id, editDate, editStatus);
      setEditModalOpen(false);
      setSelectedTrade(null);
    }
  }, [selectedTrade, editDate, editStatus]);

  const handleStatusChange = useCallback(
    async (tradeId: number, closedDate: string, newStatus: TradeStatus) => {
      await updateTrade(tradeId, closedDate, newStatus);
    },
    []
  );

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px' }}>
                Closed Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticker</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total PL$
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total Capital
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Total Deposit
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Default Risk%
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', width: '100px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {trades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No trades found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trades.map((trade) => {
                const plColor =
                  trade.total_pl_usd > 0
                    ? 'success.main'
                    : trade.total_pl_usd < 0
                      ? 'error.main'
                      : 'inherit';

                return (
                  <TableRow key={trade.id} hover>
                    <TableCell>{trade.id}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {trade.closed_date || '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>{trade.ticker}</TableCell>
                    <TableCell>
                      <Select
                        value={trade.status || TradeStatus.CLOSED}
                        onChange={(e) =>
                          handleStatusChange(
                            trade.id,
                            trade.closed_date || '',
                            e.target.value as TradeStatus
                          )
                        }
                        size="small"
                        sx={{
                          fontSize: '0.65rem',
                          fontWeight: 'bold',
                          height: 24,
                          '& .MuiSelect-select': {
                            py: 0,
                            display: 'flex',
                            alignItems: 'center',
                            color:
                              trade.status === TradeStatus.IN_PROGRESS
                                ? 'warning.main'
                                : 'success.main',
                          },
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor:
                              trade.status === TradeStatus.IN_PROGRESS
                                ? 'warning.main'
                                : 'success.main',
                            opacity: 0.5,
                          },
                        }}
                      >
                        <MenuItem value={TradeStatus.IN_PROGRESS} sx={{ fontSize: '0.75rem' }}>
                          IN PROGRESS
                        </MenuItem>
                        <MenuItem value={TradeStatus.CLOSED} sx={{ fontSize: '0.75rem' }}>
                          CLOSED
                        </MenuItem>
                      </Select>
                    </TableCell>
                    <TableCell align="right" sx={{ color: plColor }}>
                      {trade.pl_percent.toFixed(2)}%
                    </TableCell>
                    <TableCell align="right" sx={{ color: plColor, fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_pl_usd)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_capital_after)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${formatCurrency(trade.total_deposit_after)}
                    </TableCell>
                    <TableCell align="right">
                      {trade.default_risk_percent !== null
                        ? `${trade.default_risk_percent.toFixed(2)}%`
                        : '-'}
                    </TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(trade)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(trade)}
                          title="Delete"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmModal
        open={deleteModalOpen}
        title={`Delete Trade № ${selectedTrade?.id}`}
        description={`Are you sure you want to delete trade № ${selectedTrade?.id} (${selectedTrade?.ticker})? This will also remove all associated ledger entries. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Edit Trade № {selectedTrade?.id}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Closed Date"
              type="date"
              fullWidth
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              variant="outlined"
              size="small"
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />
            <FormControl fullWidth size="small">
              <InputLabel id="trade-status-label">Status</InputLabel>
              <Select
                labelId="trade-status-label"
                label="Status"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TradeStatus)}
              >
                <MenuItem value={TradeStatus.IN_PROGRESS}>In Progress</MenuItem>
                <MenuItem value={TradeStatus.CLOSED}>Closed</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmEdit} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

TotalTradesTable.displayName = 'TotalTradesTable';
