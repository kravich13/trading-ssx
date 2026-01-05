'use client';

import { Investor } from '@/entities/investor/types';
import { UpdateInvestorBalanceModal } from '@/features/investor-update-balance';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';

interface AddActionButtonProps {
  investor: Investor;
}

export function AddActionButton({ investor }: AddActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={handleOpen}
        sx={{
          flex: { xs: '1 1 100%', sm: 'none' },
          minWidth: { xs: '100%', sm: '140px' },
          whiteSpace: 'nowrap',
        }}
      >
        Add Action
      </Button>

      <UpdateInvestorBalanceModal open={isModalOpen} onClose={handleClose} investor={investor} />
    </>
  );
}
