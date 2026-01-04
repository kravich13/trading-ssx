'use client';

import { LedgerEntry } from '@/entities/investor/types';
import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { ConfirmModal } from '@/shared/ui/modals';
import { normalizeDate } from '@/shared/utils/date.util';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
} from '@mui/material';
import { memo, useCallback, useState } from 'react';

type LedgerWithStatus = LedgerEntry & { status?: TradeStatus; trade_type?: TradeType };

interface InvestorTradingLogTableProps {
  ledger: LedgerWithStatus[];
}

export const InvestorTradingLogTable = memo(({ ledger }: InvestorTradingLogTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<LedgerWithStatus | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState('');

  const tradesOnlyLedger = ledger.filter((row) => row.type === LedgerType.TRADE);

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const handleDeleteClick = useCallback((trade: LedgerWithStatus) => {
    setSelectedTrade(trade);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedTrade) {
      await deleteTrade(selectedTrade.trade_id || selectedTrade.id);
      setDeleteModalOpen(false);
      setSelectedTrade(null);
    }
  }, [selectedTrade]);

  const handleEditClick = useCallback((trade: LedgerWithStatus) => {
    setSelectedTrade(trade);
    setEditDate(normalizeDate(trade.closed_date));
    setEditModalOpen(true);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedTrade) {
      await updateTrade({
        id: selectedTrade.trade_id || selectedTrade.id,
        closedDate: editDate,
        status: selectedTrade.status || TradeStatus.CLOSED,
      });
      setEditModalOpen(false);
      setSelectedTrade(null);
    }
  }, [selectedTrade, editDate]);

  const handleStatusChange = useCallback(
    async (tradeId: number, closedDate: string, newStatus: TradeStatus) => {
      await updateTrade({ id: tradeId, closedDate, status: newStatus });
    },
    []
  );

  return (
    <>
      <TableContainer component={Paper} elevation={2} sx={{ mb: 4 }}>
        <Table size="small" sx={{ minWidth: 1000 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '120px' }}>
                Closed Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Ticker</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL%
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                PL$
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Capital After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Deposit After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Risk%
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', width: '100px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tradesOnlyLedger.map((row, index) => {
              const plColor =
                row.change_amount > 0
                  ? 'success.main'
                  : row.change_amount < 0
                    ? 'error.main'
                    : 'inherit';

              return (
                <TableRow key={row.id} hover>
                  <TableCell>{tradesOnlyLedger.length - index}</TableCell>
                  <TableCell align="right" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
                    {row.closed_date || '-'}
                  </TableCell>
                  <TableCell>
                    {row.trade_type && (
                      <Chip
                        label={row.trade_type === TradeType.GLOBAL ? 'Global' : 'Private'}
                        size="small"
                        variant="outlined"
                        color={row.trade_type === TradeType.GLOBAL ? 'primary' : 'secondary'}
                        sx={{ fontSize: '0.65rem', height: 20, fontWeight: 'bold' }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{row.ticker || '-'}</TableCell>
                  <TableCell>
                    <Select
                      value={row.status || TradeStatus.CLOSED}
                      onChange={(e) =>
                        handleStatusChange(
                          row.trade_id || row.id,
                          row.closed_date || '',
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
                            row.status === TradeStatus.IN_PROGRESS
                              ? 'warning.main'
                              : 'success.main',
                        },
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor:
                            row.status === TradeStatus.IN_PROGRESS
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
                    {row.pl_percent !== null ? `${row.pl_percent.toFixed(2)}%` : '-'}
                  </TableCell>
                  <TableCell align="right" sx={{ color: plColor }}>
                    $
                    {row.change_amount.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    ${formatCurrency(row.capital_after)}
                  </TableCell>
                  <TableCell align="right">${formatCurrency(row.deposit_after)}</TableCell>
                  <TableCell align="right">
                    {row.default_risk_percent !== null
                      ? `${row.default_risk_percent.toFixed(2)}%`
                      : '-'}
                  </TableCell>
                  <TableCell align="left">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(row)}
                        title="Edit"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteClick(row)}
                        title="Delete"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmModal
        open={deleteModalOpen}
        title={`Delete Trade № ${selectedTrade?.trade_id || selectedTrade?.id}`}
        description={`Are you sure you want to delete trade № ${selectedTrade?.trade_id || selectedTrade?.id} (${selectedTrade?.ticker})? This will also remove associated ledger entries. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit Trade № {selectedTrade?.trade_id || selectedTrade?.id}
        </DialogTitle>
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

InvestorTradingLogTable.displayName = 'InvestorTradingLogTable';
