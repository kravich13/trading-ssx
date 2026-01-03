'use client';

import { LedgerEntry } from '@/entities/investor/types';
import { LedgerType } from '@/shared/enum';
import { deleteLedgerEntry, updateLedgerEntry } from '@/entities/investor/api';
import { ConfirmModal } from '@/shared/ui/modals';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { useState, memo, useCallback } from 'react';
import Link from 'next/link';

interface GlobalActionsTableProps {
  actions: (LedgerEntry & { investor_name: string })[];
}

export const GlobalActionsTable = memo(({ actions }: GlobalActionsTableProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<
    (LedgerEntry & { investor_name: string }) | null
  >(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

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

  const handleDeleteClick = useCallback(
    (entry: LedgerEntry & { investor_name: string }, rowNumber: number) => {
      setSelectedEntry(entry);
      setSelectedRowNumber(rowNumber);
      setDeleteModalOpen(true);
    },
    []
  );

  const handleConfirmDelete = useCallback(async () => {
    if (selectedEntry) {
      await deleteLedgerEntry(selectedEntry.id, selectedEntry.investor_id);
      setDeleteModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedEntry]);

  const handleEditClick = useCallback(
    (entry: LedgerEntry & { investor_name: string }, rowNumber: number) => {
      setSelectedEntry(entry);
      setSelectedRowNumber(rowNumber);
      setEditAmount(entry.change_amount.toString());
      setEditDate(entry.created_at ? entry.created_at.split(' ')[0] : '');
      setEditModalOpen(true);
    },
    []
  );

  const handleConfirmEdit = useCallback(async () => {
    if (selectedEntry && editAmount !== '') {
      await updateLedgerEntry(
        selectedEntry.id,
        selectedEntry.investor_id,
        parseFloat(editAmount),
        editDate + ' 00:00:00'
      );
      setEditModalOpen(false);
      setSelectedEntry(null);
    }
  }, [selectedEntry, editAmount, editDate]);

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
              actions.map((row, index) => {
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

                const rowNumber = actions.length - index;

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>{rowNumber}</TableCell>
                    <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                      {row.created_at ? row.created_at.split(' ')[0] : '-'}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      <Link
                        href={`/investors/${row.investor_id}`}
                        style={{
                          color: '#2196f3',
                          textDecoration: 'none',
                        }}
                      >
                        {row.investor_name}
                      </Link>
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
                      {formatCurrency(row.capital_after)}
                    </TableCell>
                    <TableCell align="right">{formatCurrency(row.deposit_after)}</TableCell>
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
                        {(!isInitial ||
                          actions.filter((a) => a.investor_id === row.investor_id).length ===
                            1) && (
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
        description={`Are you sure you want to delete balance change entry № ${selectedRowNumber} for investor ${selectedEntry?.investor_name}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>
          Edit Action (№ {selectedRowNumber} - {selectedEntry?.investor_name})
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Change Amount"
              type="number"
              fullWidth
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
              variant="outlined"
              size="small"
              autoFocus
            />
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

GlobalActionsTable.displayName = 'GlobalActionsTable';
