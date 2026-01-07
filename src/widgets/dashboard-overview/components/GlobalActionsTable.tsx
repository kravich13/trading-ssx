'use client';

import { deleteLedgerEntry } from '@/entities/investor/api';
import { LedgerEntryWithInvestor } from '@/entities/investor/types';
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
import { EditActionModal } from '@/features/investor-actions/components/EditActionModal';
import { GlobalActionRow } from './GlobalActionRow';

interface GlobalActionsTableProps {
  actions: LedgerEntryWithInvestor[];
}

export const GlobalActionsTable = memo(({ actions }: GlobalActionsTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntryWithInvestor | null>(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleDeleteClick = useCallback((entry: LedgerEntryWithInvestor, rowNumber: number) => {
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedEntry) {
      await deleteLedgerEntry(selectedEntry.id, selectedEntry.investor_id);
      setDeleteModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedEntry]);

  const handleEditClick = useCallback((entry: LedgerEntryWithInvestor, rowNumber: number) => {
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setEditModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
    setSelectedEntry(null);
  }, []);

  const renderActionRow = useCallback(
    (row: LedgerEntryWithInvestor, index: number) => {
      const isInitial = row.capital_before === 0 && row.deposit_before === 0;
      const canDelete =
        !isInitial || actions.filter((a) => a.investor_id === row.investor_id).length === 1;

      return (
        <GlobalActionRow
          key={row.id}
          row={row}
          rowNumber={actions.length - index}
          formatCurrency={formatCurrency}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          canDelete={canDelete}
        />
      );
    },
    [actions, formatCurrency, handleEditClick, handleDeleteClick]
  );

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small" sx={{ minWidth: 800 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '100px' }}>
                Date
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Investor</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Action Type</TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 'bold', width: '120px', whiteSpace: 'nowrap' }}
              >
                After Trade
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Change Amount
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Capital After
              </TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                Deposit After
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', width: '100px' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {actions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No balance actions found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              actions.map(renderActionRow)
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ConfirmModal
        open={deleteModalOpen}
        title={`Delete Entry № ${selectedRowNumber}`}
        description={`Are you sure you want to delete balance change entry № ${selectedRowNumber} for investor ${selectedEntry?.investor_name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
        color="error"
        confirmText="Delete"
      />

      <EditActionModal
        open={editModalOpen}
        entry={selectedEntry}
        rowNumber={selectedRowNumber}
        investorId={selectedEntry?.investor_id || 0}
        investorName={selectedEntry?.investor_name}
        onClose={handleCloseEditModal}
      />
    </>
  );
});

GlobalActionsTable.displayName = 'GlobalActionsTable';
