'use client';

import { EditTradeModal } from '@/entities/trade';
import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { Trade } from '@/entities/trade/types';
import { TradeStatus } from '@/shared/enum';
import { ConfirmModal } from '@/shared/ui/modals';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { TradeRow } from './TradeRow';

interface TotalTradesTableProps {
  trades: Trade[];
}

export const TotalTradesTable = memo(({ trades }: TotalTradesTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

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
    setEditModalOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    async (tradeId: number, closedDate: string, newStatus: TradeStatus) => {
      await updateTrade({ id: tradeId, closedDate, status: newStatus });
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
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
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
              trades.map((trade) => (
                <TradeRow
                  key={trade.id}
                  trade={trade}
                  formatCurrency={formatCurrency}
                  onEdit={handleEditClick}
                  onDelete={handleDeleteClick}
                  onStatusChange={handleStatusChange}
                />
              ))
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

      <EditTradeModal
        key={selectedTrade ? `edit-${selectedTrade.id}-${editModalOpen}` : 'edit-none'}
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        trade={selectedTrade}
      />
    </>
  );
});

TotalTradesTable.displayName = 'TotalTradesTable';
