'use server';

import { addInvestor, toggleInvestorStatus } from '@/entities/investor';
import { TradeType } from '@/shared/enum';

export async function addInvestorAction(formData: FormData) {
  const name = (formData.get('name') as string)?.trim();
  const capitalStr = formData.get('capital') as string;
  const depositStr = formData.get('deposit') as string;
  const type = formData.get('type') as TradeType;

  const capital = parseFloat(capitalStr);
  const deposit = parseFloat(depositStr);

  if (!name || isNaN(capital) || isNaN(deposit)) {
    throw new Error('Invalid input');
  }

  if (capital <= 0 || deposit <= 0) {
    throw new Error('Capital and deposit must be greater than zero');
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
    throw new Error(
      'Name must contain only English letters, numbers, underscores or hyphens and no spaces'
    );
  }

  if (!Number.isInteger(capital) || !Number.isInteger(deposit)) {
    throw new Error('Only integer values are allowed for capital and deposit');
  }

  await addInvestor(name, capital, deposit, type);
}

export async function toggleInvestorStatusAction(id: number, isActive: boolean) {
  await toggleInvestorStatus(id, isActive);
}
