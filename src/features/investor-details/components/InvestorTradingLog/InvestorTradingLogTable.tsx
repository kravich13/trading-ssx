'use client';

import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { useNotification } from '@/shared/lib/hooks';
import { ConfirmModal } from '@/shared/ui/modals';
import { normalizeDate } from '@/shared/utils';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
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
import { LedgerWithStatus, StatusChangeParams } from '../../types';
import { Row } from './Row';

interface InvestorTradingLogTableProps {
  ledger: LedgerWithStatus[];
}

export const InvestorTradingLogTable = memo(({ ledger }: InvestorTradingLogTableProps) => {
  const { showNotification } = useNotification();
  const router = useRouter();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<LedgerWithStatus | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editTicker, setEditTicker] = useState('');
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
    setEditTicker(trade.ticker || '');
    setEditDate(normalizeDate(trade.closed_date));
    setEditRisk(trade.default_risk_percent != null ? trade.default_risk_percent.toString() : '');
    setEditModalOpen(true);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedTrade) {
      try {
        await updateTrade({
          id: selectedTrade.trade_id || selectedTrade.id,
          ticker: editTicker.toUpperCase().trim(),
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
  }, [selectedTrade, editTicker, editDate, editRisk, router, showNotification]);

  const handleStatusChange = useCallback(
    async ({ tradeId, closedDate, status }: StatusChangeParams) => {
      try {
        await updateTrade({ id: tradeId, closedDate, status });
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
    (row: LedgerWithStatus, index: number) => (
      <Row
        key={row.id}
        row={row}
        index={index}
        totalRows={tradesOnlyLedger.length}
        formatCurrency={formatCurrency}
        hasPrivateTrades={hasPrivateTrades}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onStatusChange={handleStatusChange}
      />
    ),
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
        title={`Delete Trade № ${selectedTrade?.trade_number || selectedTrade?.trade_id || selectedTrade?.id}`}
        description={`Are you sure you want to delete trade № ${selectedTrade?.trade_number || selectedTrade?.trade_id || selectedTrade?.id} (${selectedTrade?.ticker})? This will also remove associated ledger entries. This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={handleDialogClose} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Edit Trade № {selectedTrade?.trade_number || selectedTrade?.trade_id || selectedTrade?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Ticker"
              fullWidth
              value={editTicker}
              onChange={(e) => setEditTicker(e.target.value)}
              variant="outlined"
              size="small"
              placeholder="BTC/USDT"
            />

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
