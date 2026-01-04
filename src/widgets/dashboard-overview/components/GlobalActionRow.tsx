import { LedgerEntryWithInvestor } from '@/entities/investor/types';
import { LedgerType } from '@/shared/enum';
import { COLORS } from '@/shared/consts';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Box, Chip, IconButton, TableCell, TableRow } from '@mui/material';
import Link from 'next/link';
import { memo } from 'react';

interface GlobalActionRowProps {
  row: LedgerEntryWithInvestor;
  rowNumber: number;
  canDelete: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (entry: LedgerEntryWithInvestor, rowNumber: number) => void;
  onDelete: (entry: LedgerEntryWithInvestor, rowNumber: number) => void;
}

export const GlobalActionRow = memo(
  ({ row, rowNumber, canDelete, formatCurrency, onEdit, onDelete }: GlobalActionRowProps) => {
    const color = row.change_amount > 0 ? 'success.main' : 'error.main';
    const isInitial = row.capital_before === 0 && row.deposit_before === 0;

    let chipLabel = row.type.replace('_CHANGE', '');
    let chipColor: 'primary' | 'secondary' | 'warning' | 'info' | 'default' = 'secondary';

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

    return (
      <TableRow hover>
        <TableCell>{rowNumber}</TableCell>
        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
          {row.created_at ? row.created_at.split(' ')[0] : '-'}
        </TableCell>
        <TableCell sx={{ fontWeight: 'medium' }}>
          <Link
            href={`/investors/${row.investor_id}`}
            style={{
              color: COLORS.primaryMain,
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
              onClick={() => onEdit(row, rowNumber)}
              title="Edit"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            {canDelete && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDelete(row, rowNumber)}
                title="Delete"
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </TableCell>
      </TableRow>
    );
  }
);

GlobalActionRow.displayName = 'GlobalActionRow';
