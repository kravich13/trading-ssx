'use client';

import { deleteLedgerEntry, updateLedgerEntry } from '@/entities/investor/api';
import { LedgerEntry } from '@/entities/investor/types';
import { LedgerType } from '@/shared/enum';
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
import { memo, useCallback, useMemo, useState } from 'react';

interface InvestorActionsTableProps {
  ledger: LedgerEntry[];
  investorId: number;
}

export const InvestorActionsTable = memo(({ ledger, investorId }: InvestorActionsTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');
  const [editDepositAmount, setEditDepositAmount] = useState('');
  const [editDate, setEditDate] = useState('');

  const actionsOnly = useMemo(
    () =>
      ledger.filter(
        (row) =>
          row.type === LedgerType.CAPITAL_CHANGE ||
          row.type === LedgerType.DEPOSIT_CHANGE ||
          row.type === LedgerType.BOTH_CHANGE
      ),
    [ledger]
  );

  const formatCurrency = useCallback(
    (value: number) =>
      value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    []
  );

  const handleDeleteClick = useCallback((entry: LedgerEntry, rowNumber: number) => {
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (selectedEntry) {
      await deleteLedgerEntry(selectedEntry.id, investorId);
      setDeleteModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedEntry, investorId]);

  const handleEditClick = useCallback((entry: LedgerEntry, rowNumber: number) => {
    const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setEditAmount(isInitial ? entry.capital_after.toString() : entry.change_amount.toString());
    setEditDepositAmount(isInitial ? entry.deposit_after.toString() : '');
    setEditDate(normalizeDate(entry.created_at));
    setEditModalOpen(true);
  }, []);

  const handleConfirmEdit = useCallback(async () => {
    if (selectedEntry && editAmount !== '') {
      const isInitial = selectedEntry.capital_before === 0 && selectedEntry.deposit_before === 0;
      await updateLedgerEntry({
        id: selectedEntry.id,
        investorId,
        amount: parseFloat(editAmount),
        depositAmount: isInitial ? parseFloat(editDepositAmount) : undefined,
        createdAt: editDate + ' 00:00:00',
      });
      setEditModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedEntry, editAmount, editDepositAmount, editDate, investorId]);

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'action.hover' }}>
              <TableCell sx={{ fontWeight: 'bold', width: '50px' }}>№</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', width: '100px' }}>
                Date
              </TableCell>
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
            {actionsOnly.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    No balance actions found.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              actionsOnly.map((row, index) => {
                const color = row.change_amount > 0 ? 'success.main' : 'error.main';
                const isInitial = row.capital_before === 0 && row.deposit_before === 0;

                let chipLabel = row.type.replace('_CHANGE', '');
                let chipColor: 'primary' | 'secondary' | 'warning' | 'info' | 'default' =
                  'secondary';

                if (isInitial) {
                  chipLabel = 'INITIAL';
                  chipColor = 'primary';
                } else if (row.type === LedgerType.DEPOSIT_CHANGE) {
                  chipLabel = `DEPOSIT ${row.change_amount > 0 ? 'IN' : 'OUT'}`;
                  chipColor = 'warning';
                } else if (row.type === LedgerType.CAPITAL_CHANGE) {
                  chipLabel = `CAPITAL ${row.change_amount > 0 ? 'ADD' : 'SUB'}`;
                  chipColor = 'secondary';
                } else if (row.type === LedgerType.BOTH_CHANGE) {
                  chipLabel = `BOTH ${row.change_amount > 0 ? 'ADD' : 'SUB'}`;
                  chipColor = 'info';
                }

                const rowNumber = actionsOnly.length - index;

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{rowNumber}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {row.created_at ? row.created_at.split(' ')[0] : '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={chipLabel}
                        size="small"
                        color={chipColor}
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ color, fontWeight: 'medium' }}>
                      {row.change_amount > 0 ? '+' : ''}
                      {formatCurrency(row.change_amount)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                      ${formatCurrency(row.capital_after)}
                    </TableCell>
                    <TableCell align="right">${formatCurrency(row.deposit_after)}</TableCell>
                    <TableCell align="left">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(row, rowNumber)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {(!isInitial || actionsOnly.length === 1) && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDeleteClick(row, rowNumber)}
                            title="Delete"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
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
        title={`Delete Entry № ${selectedRowNumber}`}
        description={`Are you sure you want to delete balance change entry № ${selectedRowNumber}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        color="error"
        confirmText="Delete"
      />

      <Dialog
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        slotProps={{
          paper: {
            sx: {
              width: '100%',
              maxWidth: '360px',
            },
          },
        }}
      >
        <DialogTitle>Edit Action (№ {selectedRowNumber})</DialogTitle>
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

InvestorActionsTable.displayName = 'InvestorActionsTable';
