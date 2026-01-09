'use client';

import { EditTradeModal } from '@/entities/trade';
import { deleteTrade, updateTrade } from '@/entities/trade/api';
import { Trade } from '@/entities/trade/types';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { useNotification } from '@/shared/lib/hooks';
import { ConfirmModal } from '@/shared/ui/modals';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
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

  const tradesOnlyLedger = useMemo(
    () => ledger.filter((row) => row.type === LedgerType.TRADE),
    [ledger]
  );

  const tradeForModal = useMemo(() => {
    if (!selectedTrade) return null;

    const result: Trade = {
      id: selectedTrade.trade_id || selectedTrade.id,
      number: selectedTrade.trade_number || 0,
      ticker: selectedTrade.ticker || '',
      default_risk_percent: selectedTrade.default_risk_percent ?? null,
      closed_date: selectedTrade.closed_date || null,
      status: selectedTrade.status || TradeStatus.CLOSED,
      total_pl_usd: selectedTrade.change_amount || 0,
      total_capital_after: selectedTrade.capital_after || 0,
      total_deposit_after: selectedTrade.deposit_after || 0,
      type: selectedTrade.trade_type || TradeType.PRIVATE,
      investor_id: selectedTrade.investor_id,
      created_at: selectedTrade.created_at,
      profits: JSON.parse(selectedTrade.profits_json || '[]'),
    };

    return result;
  }, [selectedTrade]);

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
    setEditModalOpen(true);
  }, []);

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

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

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

      <EditTradeModal
        key={
          selectedTrade
            ? `edit-${selectedTrade.trade_id || selectedTrade.id}-${editModalOpen}`
            : 'edit-none'
        }
        open={editModalOpen}
        onClose={handleCloseEditModal}
        trade={tradeForModal}
        onSuccess={handleSuccess}
      />
    </>
  );
});

InvestorTradingLogTable.displayName = 'InvestorTradingLogTable';
