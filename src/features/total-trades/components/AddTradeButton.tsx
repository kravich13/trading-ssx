'use client';

import { AddTradeModal } from '@/entities/trade';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useState } from 'react';

export function AddTradeButton() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setIsModalOpen(true)}
      >
        Add Trade
      </Button>

      <AddTradeModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
