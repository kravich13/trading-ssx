'use client';

import { useState } from 'react';
import { IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { ConfirmModal } from '@/shared/ui';
import { deleteInvestorAction } from '../api';

interface DeleteInvestorButtonProps {
  investorId: number;
  investorName: string;
}

export function DeleteInvestorButton({ investorId, investorName }: DeleteInvestorButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDelete = () => {
    deleteInvestorAction(investorId);
  };

  return (
    <>
      <IconButton
        color="error"
        size="small"
        title="Delete investor"
        onClick={() => setIsModalOpen(true)}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>

      <ConfirmModal
        open={isModalOpen}
        title="Delete Investor"
        description={`Are you sure you want to delete investor "${investorName}"? This action cannot be undone and will remove all their trading history.`}
        confirmText="Delete"
        cancelText="Cancel"
        color="error"
        onConfirm={handleDelete}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
