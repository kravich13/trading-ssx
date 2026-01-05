'use client';

import { AddTradeModal } from '@/entities/trade';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';

export function AddTradeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen}>
        Add Trade
      </Button>

      <AddTradeModal open={isModalOpen} onClose={handleClose} />
    </>
  );
}
