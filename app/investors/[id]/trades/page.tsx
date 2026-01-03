import { InvestorDetails } from '@/features/investor-details';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  return <InvestorDetails id={parseInt(id)} />;
}
