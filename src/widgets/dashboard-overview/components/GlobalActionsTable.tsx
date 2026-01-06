'use client';

import { deleteLedgerEntry, updateLedgerEntry } from '@/entities/investor/api';
import { useActionChanges } from '@/entities/investor/hooks';
import { LedgerEntryWithInvestor } from '@/entities/investor/types';
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
  Typography,
} from '@mui/material';
import { memo, useCallback, useState } from 'react';
import { GlobalActionRow } from './GlobalActionRow';

interface GlobalActionsTableProps {
  actions: LedgerEntryWithInvestor[];
}

export const GlobalActionsTable = memo(({ actions }: GlobalActionsTableProps) => {
  const { showNotification } = useNotification();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntryWithInvestor | null>(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDate, setEditDate] = useState('');

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
    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setEditAmount(isInitial ? entry.capital_after.toString() : entry.change_amount.toString());
    setEditDepositAmount(isInitial ? entry.deposit_after.toString() : '');
    setEditDate(normalizeDate(entry.created_at));
    setEditModalOpen(true);
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModalOpen(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setEditModalOpen(false);
  }, []);

  const hasChanges = useActionChanges({
    entry: selectedEntry,
    editAmount,
    editDepositAmount,
    editDate,
  });

  const handleDialogClose = useCallback((_event: object, reason?: string) => {
    if (reason !== 'backdropClick') {
      setEditModalOpen(false);
    }
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedEntry && editAmount !== '') {
      try {
        const isInitial = selectedEntry.capital_before === 0 && selectedEntry.deposit_before === 0;
        await updateLedgerEntry({
          id: selectedEntry.id,
          investorId: selectedEntry.investor_id,
          amount: parseFloat(editAmount),
          depositAmount: isInitial ? parseFloat(editDepositAmount) : undefined,
          createdAt: editDate + ' 00:00:00',
        });
        showNotification('Action updated successfully');
        setEditModalOpen(false);
        setSelectedEntry(null);
      } catch (error) {
        console.error('Failed to update entry:', error);
        showNotification('Failed to update entry', 'error');
      }
    }
  }, [selectedEntry, editAmount, editDepositAmount, editDate, showNotification]);

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
                <TableCell colSpan={8} align="center" sx={{ py: 3 }}>
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

      <Dialog
        open={editModalOpen}
        onClose={handleDialogClose}
        slotProps={{
          paper: {
            sx: {
              width: '100%',
              maxWidth: '360px',
            },
          },
        }}
      >
        <DialogTitle>
          Edit Action (№ {selectedRowNumber} - {selectedEntry?.investor_name})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label={
                selectedEntry &&
                selectedEntry.capital_before === 0 &&
                selectedEntry.deposit_before === 0
                  ? 'Initial Capital'
                  : 'Change Amount'
              }
              type="number"
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus
            />
            {selectedEntry &&
              selectedEntry.capital_before === 0 &&
              selectedEntry.deposit_before === 0 && (
                <TextField
                  label="Initial Deposit"
                  type="number"
                  fullWidth
                  value={editDepositAmount}
                  onChange={(e) => setEditDepositAmount(e.target.value)}
                  variant="outlined"
                  size="small"
                />
              )}
            <TextField
              label="Date"
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
          <Button onClick={handleCloseEditModal} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEdit}
            variant="contained"
            color="primary"
            disabled={!hasChanges}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
});

GlobalActionsTable.displayName = 'GlobalActionsTable';
