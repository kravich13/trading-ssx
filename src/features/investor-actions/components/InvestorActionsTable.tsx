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
import { useState } from 'react';

interface InvestorActionsTableProps {
  ledger: LedgerEntry[];
  investorId: number;
}

export function InvestorActionsTable({ ledger, investorId }: InvestorActionsTableProps) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<LedgerEntry | null>(null);
  const [selectedRowNumber, setSelectedRowNumber] = useState<number | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editDate, setEditDate] = useState<string>('');

  const actionsOnly = ledger.filter(
    (row) => row.type === LedgerType.CAPITAL_CHANGE || row.type === LedgerType.DEPOSIT_CHANGE
  );

  const formatCurrency = (value: number) =>
    value.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });

  const handleDeleteClick = (entry: LedgerEntry, rowNumber: number) => {
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedEntry) {
      await deleteLedgerEntry(selectedEntry.id, investorId);
      setDeleteModalOpen(false);
      setSelectedEntry(null);
    }
  };

  const handleEditClick = (entry: LedgerEntry, rowNumber: number) => {
    setSelectedEntry(entry);
    setSelectedRowNumber(rowNumber);
    setEditAmount(entry.change_amount.toString());
    setEditDate(entry.created_at ? entry.created_at.split(' ')[0] : '');
    setEditModalOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (selectedEntry && editAmount !== '') {
      await updateLedgerEntry(
        selectedEntry.id,
        investorId,
        parseFloat(editAmount),
        editDate + ' 00:00:00'
      );
      setEditModalOpen(false);
      setSelectedEntry(null);
    }
  };

  return (
    <>
      <TableContainer component={Paper} elevation={2}>
        <Table size="small">
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
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>
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
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEditClick(row, rowNumber)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(row, rowNumber)}
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
        title={`Delete Entry № ${selectedRowNumber}`}
        description={`Are you sure you want to delete balance change entry № ${selectedRowNumber}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteModalOpen(false)}
        color="error"
        confirmText="Delete"
      />

      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)}>
        <DialogTitle>Edit Action (№ {selectedRowNumber})</DialogTitle>
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
}
