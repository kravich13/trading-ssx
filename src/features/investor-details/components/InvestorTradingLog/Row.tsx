'use client';

import { COLORS } from '@/shared/consts';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { calculatePlPercent, formatDate } from '@/shared/utils';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import {
  Box,
  Chip,
  IconButton,
  MenuItem,
  Select,
  SelectChangeEvent,
  TableCell,
  TableRow,
} from '@mui/material';
import { memo, useCallback } from 'react';
import { LedgerWithStatus, StatusChangeParams } from '../../types';
import { PlAmountCell } from './PlAmountCell';

interface RowProps {
  row: LedgerWithStatus;
  index: number;
  totalRows: number;
  hasPrivateTrades: boolean;
  formatCurrency: (value: number) => string;
  onEdit: (row: LedgerWithStatus) => void;
  onDelete: (row: LedgerWithStatus) => void;
  onStatusChange: (params: StatusChangeParams) => void;
}

export const Row = memo(
  ({
    row,
    index,
    totalRows,
    hasPrivateTrades,
    formatCurrency,
    onEdit,
    onDelete,
    onStatusChange,
  }: RowProps) => {
    const plColor =
      row.change_amount > 0 ? 'success.main' : row.change_amount < 0 ? 'error.main' : 'inherit';

    const isPrivate = row.trade_type === TradeType.PRIVATE;

    const handleEditClick = useCallback(() => {
      onEdit(row);
    }, [onEdit, row]);

    const handleDeleteClick = useCallback(() => {
      onDelete(row);
    }, [onDelete, row]);

    const handleStatusChangeWrapper = useCallback(
      (e: SelectChangeEvent<TradeStatus>) => {
        onStatusChange({
          tradeId: row.trade_id || row.id,
          closedDate: row.closed_date || '',
          status: e.target.value as TradeStatus,
        });
      },
      [onStatusChange, row]
    );

    return (
      <TableRow hover>
        <TableCell>{row.trade_number || totalRows - index}</TableCell>
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
                <IconButton size="small" color="primary" onClick={handleEditClick} title="Edit">
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={handleDeleteClick} title="Delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
          </TableCell>
        )}
      </TableRow>
    );
  }
);

Row.displayName = 'Row';
