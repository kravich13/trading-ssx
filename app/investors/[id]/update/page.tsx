import { UpdateInvestorBalance } from '@/features/investor-update-balance';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <UpdateInvestorBalance id={parseInt(id)} />;
}
