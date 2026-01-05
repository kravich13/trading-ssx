'use client';

import { AddTradeModal } from '@/entities/trade';
import { TradeType } from '@/shared/enum';
import AddIcon from '@mui/icons-material/Add';
import { Button } from '@mui/material';
import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AddPrivateTradeButtonProps {
  investorId: number;
}

export function AddPrivateTradeButton({ investorId }: AddPrivateTradeButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleSuccess = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen}>
        Add Trade
      </Button>

      <AddTradeModal
        open={isModalOpen}
        onClose={handleClose}
        onSuccess={handleSuccess}
        defaultTradeType={TradeType.PRIVATE}
        defaultInvestorId={investorId}
      />
    </>
  );
}
