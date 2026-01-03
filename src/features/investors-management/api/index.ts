'use server';

import { addInvestor, deleteInvestor } from '@/entities/investor';

export async function addInvestorAction(formData: FormData) {
  const name = formData.get('name') as string;
  const capital = parseFloat(formData.get('capital') as string);
  const deposit = parseFloat(formData.get('deposit') as string);

  if (!name || isNaN(capital) || isNaN(deposit)) {
    throw new Error('Invalid input');
  }

  await addInvestor(name, capital, deposit);
}

export async function deleteInvestorAction(id: number) {
  await deleteInvestor(id);
}
