'use client';

import { AlertColor } from '@mui/material';
import { createContext } from 'react';

export interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
}

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);
