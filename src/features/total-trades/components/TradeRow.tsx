'use client';

import { Trade } from '@/entities/trade/types';
import { TradeStatus, TradeType } from '@/shared/enum';
import { calculatePlPercentFromAfter, formatDate } from '@/shared/utils';
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

interface TradeRowProps {
  trade: Trade;
  formatCurrency: (value: number) => string;
  onEdit: (trade: Trade) => void;
  onDelete: (trade: Trade) => void;
  onStatusChange: (id: number, date: string, status: TradeStatus) => void;
}

export const TradeRow: React.FC<TradeRowProps> = memo(
  ({ trade, formatCurrency, onEdit, onDelete, onStatusChange }) => {
    const totalPlUsd = trade.total_pl_usd;

    const plPercent = calculatePlPercentFromAfter(trade.total_capital_after, totalPlUsd);

    let plColor = 'inherit';
    if (totalPlUsd > 0) {
      plColor = 'success.main';
    } else if (totalPlUsd < 0) {
      plColor = 'error.main';
    }

    const handleEditClick = useCallback(() => {
      onEdit(trade);
    }, [onEdit, trade]);

    const handleDeleteClick = useCallback(() => {
      onDelete(trade);
    }, [onDelete, trade]);

    const handleStatusChangeWrapper = useCallback(
      (e: SelectChangeEvent<TradeStatus>) => {
        onStatusChange(trade.id, trade.closed_date || '', e.target.value as TradeStatus);
      },
      [onStatusChange, trade]
    );

    return (
      <TableRow hover>
        <TableCell>{trade.id}</TableCell>
        <TableCell align="right" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
          {formatDate(trade.closed_date)}
        </TableCell>
        <TableCell>
          <Chip
            label={trade.type === TradeType.GLOBAL ? 'Global' : 'Private'}
            size="small"
            variant="outlined"
            color={trade.type === TradeType.GLOBAL ? 'primary' : 'secondary'}
            sx={{ fontSize: '0.65rem', height: 20, fontWeight: 'bold' }}
          />
        </TableCell>
        <TableCell sx={{ fontWeight: 'medium' }}>{trade.ticker}</TableCell>
        <TableCell>
          <Select
            value={trade.status || TradeStatus.CLOSED}
            onChange={handleStatusChangeWrapper}
            size="small"
            sx={{
              fontSize: '0.65rem',
              fontWeight: 'bold',
              height: 24,
              '& .MuiSelect-select': {
                py: 0,
                display: 'flex',
                alignItems: 'center',
                color: trade.status === TradeStatus.IN_PROGRESS ? 'warning.main' : 'success.main',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor:
                  trade.status === TradeStatus.IN_PROGRESS ? 'warning.main' : 'success.main',
                opacity: 0.5,
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
          {plPercent.toFixed(2)}%
        </TableCell>
        <TableCell align="right" sx={{ color: plColor, fontWeight: 'bold' }}>
          ${formatCurrency(totalPlUsd)}
          {trade.total_deposit_after - totalPlUsd > 0 && (
            <Box component="span" sx={{ fontSize: '0.7rem', ml: 0.5, opacity: 0.8 }}>
              ({totalPlUsd >= 0 ? '+' : ''}
              {((totalPlUsd / (trade.total_deposit_after - totalPlUsd)) * 100).toFixed(2)}% on dep.)
            </Box>
          )}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
          ${formatCurrency(trade.total_capital_after)}
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
          ${formatCurrency(trade.total_deposit_after)}
        </TableCell>
        <TableCell align="right">
          {trade.default_risk_percent !== null ? `${trade.default_risk_percent.toFixed(2)}%` : '-'}
        </TableCell>
        <TableCell align="left">
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 0.5 }}>
            <IconButton size="small" color="primary" onClick={handleEditClick} title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={handleDeleteClick} title="Delete">
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        </TableCell>
      </TableRow>
    );
  }
);

TradeRow.displayName = 'TradeRow';
