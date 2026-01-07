'use client';

import { LedgerEntry } from '@/entities/investor/types';
import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { COLORS } from '@/shared/consts';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { useNotification } from '@/shared/lib/hooks';
import { ConfirmModal } from '@/shared/ui/modals';
import { calculatePlPercent, formatDate, normalizeDate } from '@/shared/utils';
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
  SelectChangeEvent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import { memo, useCallback, useMemo, useState } from 'react';
import { PlAmountCell } from './PlAmountCell';

interface LedgerWithStatus extends LedgerEntry {
  status?: TradeStatus;
  trade_type?: TradeType;
  profits_json?: string | null;
}

interface InvestorTradingLogTableProps {
  ledger: LedgerWithStatus[];
}

export const InvestorTradingLogTable = memo(({ ledger }: InvestorTradingLogTableProps) => {
  const { showNotification } = useNotification();
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<LedgerWithStatus | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editRisk, setEditRisk] = useState('');

  const tradesOnlyLedger = useMemo(
    () => ledger.filter((row) => row.type === LedgerType.TRADE),
    [ledger]
  );

  const hasPrivateTrades = useMemo(
    () => tradesOnlyLedger.some((t) => t.trade_type === TradeType.PRIVATE),
    [tradesOnlyLedger]
  );

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleDeleteClick = useCallback((trade: LedgerWithStatus) => {
    setSelectedTrade(trade);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedTrade) {
      try {
        await deleteTrade(selectedTrade.trade_id || selectedTrade.id);
        showNotification('Trade deleted successfully');
        setDeleteModalOpen(false);
        setSelectedTrade(null);
      } catch (error) {
        console.error('Failed to delete trade:', error);
        showNotification('Failed to delete trade', 'error');
      }
    }
  }, [selectedTrade, showNotification]);

  const handleEditClick = useCallback((trade: LedgerWithStatus) => {
    setSelectedTrade(trade);
    setEditDate(normalizeDate(trade.closed_date));
    setEditRisk(trade.default_risk_percent != null ? trade.default_risk_percent.toString() : '');
    setEditModalOpen(true);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedTrade) {
      try {
        await updateTrade({
          id: selectedTrade.trade_id || selectedTrade.id,
          closedDate: editDate,
          status: selectedTrade.status || TradeStatus.CLOSED,
          risk: editRisk !== '' ? parseFloat(editRisk) : null,
        });
        router.refresh();
        showNotification('Trade updated successfully');
        setEditModalOpen(false);
        setSelectedTrade(null);
      } catch (error) {
        console.error('Failed to update trade:', error);
        showNotification('Failed to update trade', 'error');
      }
    }
  }, [selectedTrade, editDate, editRisk, router, showNotification]);

  const handleStatusChange = useCallback(
    async (tradeId: number, closedDate: string, newStatus: TradeStatus) => {
      try {
        await updateTrade({ id: tradeId, closedDate, status: newStatus });
        showNotification('Status updated');
      } catch (error) {
        console.error('Failed to update status:', error);
        showNotification('Failed to update status', 'error');
      }
    },
    [showNotification]
  );

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const handleDialogClose = useCallback((_event: object, reason?: string) => {
    if (reason !== 'backdropClick') {
      setEditModalOpen(false);
    }
  }, []);

  const renderRow = useCallback(
    (row: LedgerWithStatus, index: number) => {
      const plColor =
        row.change_amount > 0 ? 'success.main' : row.change_amount < 0 ? 'error.main' : 'inherit';

      const isPrivate = row.trade_type === TradeType.PRIVATE;

      const handleEditClickWrapper = () => handleEditClick(row);
      const handleDeleteClickWrapper = () => handleDeleteClick(row);
      const handleStatusChangeWrapper = (e: SelectChangeEvent<TradeStatus>) =>
        handleStatusChange(
          row.trade_id || row.id,
          row.closed_date || '',
          e.target.value as TradeStatus
        );

      return (
        <TableRow key={row.id} hover>
          <TableCell>{tradesOnlyLedger.length - index}</TableCell>
          <TableCell align="right" sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>
            {formatDate(row.closed_date)}
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
              onChange={handleStatusChangeWrapper}
              size="small"
              disabled={!isPrivate}
              sx={{
                fontSize: '0.65rem',
                fontWeight: 'bold',
                height: 24,
                '& .MuiSelect-select': {
                  py: 0,
                  display: 'flex',
                  alignItems: 'center',
                  color: row.status === TradeStatus.IN_PROGRESS ? 'warning.main' : 'success.main',
                },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor:
                    row.status === TradeStatus.IN_PROGRESS ? 'warning.main' : 'success.main',
                  opacity: 0.5,
                },
                '&.Mui-disabled': {
                  '& .MuiSelect-select': {
                    WebkitTextFillColor:
                      row.status === TradeStatus.IN_PROGRESS
                        ? COLORS.warningDark
                        : COLORS.successDark,
                  },
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
            {row.type === LedgerType.TRADE
              ? `${calculatePlPercent(row.capital_before, row.change_amount).toFixed(2)}%`
              : '-'}
          </TableCell>
          <PlAmountCell
            changeAmount={row.change_amount}
            profitsJson={row.profits_json}
            color={plColor}
          />
          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
            ${formatCurrency(row.capital_after)}
          </TableCell>
          <TableCell align="right">${formatCurrency(row.deposit_after)}</TableCell>
          <TableCell align="right">
            {row.default_risk_percent !== null ? `${row.default_risk_percent.toFixed(2)}%` : '-'}
          </TableCell>
          {hasPrivateTrades && (
            <TableCell align="left">
              {isPrivate && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={handleEditClickWrapper}
                    title="Edit"
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    color="error"
                    onClick={handleDeleteClickWrapper}
                    title="Delete"
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              )}
            </TableCell>
          )}
        </TableRow>
      );
    },
    [
      tradesOnlyLedger.length,
      formatCurrency,
      hasPrivateTrades,
      handleEditClick,
      handleDeleteClick,
      handleStatusChange,
    ]
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
              {hasPrivateTrades && (
                <TableCell align="left" sx={{ fontWeight: 'bold', width: '100px' }}>
                  Actions
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>{tradesOnlyLedger.map(renderRow)}</TableBody>
        </Table>
      </TableContainer>

      <ConfirmModal
        open={deleteModalOpen}
        title={`Delete Trade № ${selectedTrade?.trade_id || selectedTrade?.id}`}
        description={`Are you sure you want to delete trade № ${selectedTrade?.trade_id || selectedTrade?.id} (${selectedTrade?.ticker})? This will also remove associated ledger entries. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={handleDialogClose} fullWidth maxWidth="xs">
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

            <TextField
              label="Risk % (on capital)"
              type="number"
              fullWidth
              value={editRisk}
              onChange={(e) => setEditRisk(e.target.value)}
              variant="outlined"
              size="small"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseEditModal} color="inherit">
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
