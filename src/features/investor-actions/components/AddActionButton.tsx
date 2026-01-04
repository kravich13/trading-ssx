'use client';

import { Investor } from '@/entities/investor/types';
import { UpdateInvestorBalanceModal } from '@/features/investor-update-balance';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useState } from 'react';

interface AddActionButtonProps {
  investor: Investor;
}

export function AddActionButton({ investor }: AddActionButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<AddIcon />}
        onClick={() => setIsModalOpen(true)}
        sx={{
          flex: { xs: '1 1 100%', sm: 'none' },
          minWidth: { xs: '100%', sm: '140px' },
          whiteSpace: 'nowrap',
        }}
      >
        Add Action
      </Button>

      <UpdateInvestorBalanceModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        investor={investor}
      />
    </>
  );
}
