'use client';

import { useState, memo, useCallback } from 'react';
import { IconButton } from '@mui/material';
import ArchiveIcon from '@mui/icons-material/Archive';
import UnarchiveIcon from '@mui/icons-material/Unarchive';
import { ConfirmModal } from '@/shared/ui';
import { toggleInvestorStatusAction } from '../api';

interface ToggleInvestorStatusButtonProps {
  investorId: number;
  investorName: string;
  isActive: boolean;
}

export const ToggleInvestorStatusButton = memo(
  ({ investorId, investorName, isActive }: ToggleInvestorStatusButtonProps) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleToggle = useCallback(() => {
      toggleInvestorStatusAction(investorId, !isActive);
    }, [investorId, isActive]);

    const title = isActive ? 'Archive Investor' : 'Restore Investor';
    const description = isActive
      ? `Are you sure you want to archive investor "${investorName}"? They will no longer participate in new trades.`
      : `Do you want to restore investor "${investorName}"? They will be active again.`;

    return (
      <>
        <IconButton
          color={isActive ? 'warning' : 'success'}
          size="small"
          title={title}
          onClick={() => setIsModalOpen(true)}
        >
          {isActive ? <ArchiveIcon fontSize="small" /> : <UnarchiveIcon fontSize="small" />}
        </IconButton>

        <ConfirmModal
          open={isModalOpen}
          title={title}
          description={description}
          confirmText={isActive ? 'Archive' : 'Restore'}
          cancelText="Cancel"
          color={isActive ? 'warning' : 'success'}
          onConfirm={handleToggle}
          onClose={() => setIsModalOpen(false)}
        />
      </>
    );
  }
);

ToggleInvestorStatusButton.displayName = 'ToggleInvestorStatusButton';
