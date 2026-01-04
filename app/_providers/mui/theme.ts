'use client';

import { COLORS } from '@/shared/consts';
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: COLORS.primaryMain,
    },
    background: {
      default: COLORS.bgDefault,
      paper: COLORS.bgPaper,
    },
  },
  typography: {
    fontFamily: 'var(--font-roboto), Roboto, sans-serif',
  },
});
