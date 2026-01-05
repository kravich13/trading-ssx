import { InvestorActions } from '@/features/investor-actions';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <InvestorActions id={parseInt(id)} />;
}
