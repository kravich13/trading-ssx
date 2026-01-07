'use client';

import { Box, TableCell } from '@mui/material';
import { memo, useMemo } from 'react';

const NUMBER_FORMAT_OPTIONS: Intl.NumberFormatOptions = {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
};

interface PlAmountCellProps {
  changeAmount: number;
  profitsJson?: string | null;
  color?: string;
}

export const PlAmountCell = memo(({ changeAmount, profitsJson, color }: PlAmountCellProps) => {
  const partsInfo = useMemo(() => {
    if (!profitsJson) return null;

    try {
      const profits = JSON.parse(profitsJson);

      if (Array.isArray(profits) && profits.length >= 2) {
        return {
          count: profits.length,
          values: profits.map((p: number) => p.toLocaleString()).join(', '),
        };
      }
    } catch {
      // Ignore parse errors
    }

    return null;
  }, [profitsJson]);

  return (
    <TableCell align="right" sx={{ color }}>
      ${changeAmount.toLocaleString(undefined, NUMBER_FORMAT_OPTIONS)}
      {partsInfo && (
        <Box
          component="span"
          sx={{ fontSize: '0.7rem', ml: 0.5, opacity: 0.8 }}
          title={partsInfo.values}
        >
          ({partsInfo.count} parts)
        </Box>
      )}
    </TableCell>
  );
});

PlAmountCell.displayName = 'PlAmountCell';
