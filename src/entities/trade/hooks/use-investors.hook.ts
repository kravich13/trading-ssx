import { getInvestors } from '@/entities/investor/api';
import { Investor } from '@/entities/investor/types';
import { useEffect, useState } from 'react';

interface UseInvestorsProps {
  open: boolean;
  defaultInvestorId?: number;
  onInvestorsLoaded?: (investors: Investor[]) => void;
}

export function useInvestors({ open, defaultInvestorId, onInvestorsLoaded }: UseInvestorsProps) {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [investorId, setInvestorId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInvestors = async () => {
      if (open) {
        setLoading(true);
        try {
          const data = await getInvestors();

          setInvestors(data);
          onInvestorsLoaded?.(data);

          if (defaultInvestorId) {
            setInvestorId(defaultInvestorId.toString());
          } else {
            const me = data.find((inv) => inv.name === 'Me');

            if (me) {
              setInvestorId(me.id.toString());
            } else if (data.length > 0) {
              setInvestorId(data[0].id.toString());
            }
          }
        } catch (error) {
          console.error('Failed to fetch investors:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchInvestors();
  }, [open, defaultInvestorId, onInvestorsLoaded]);

  return {
    investors,
    investorId,
    setInvestorId,
    loading,
  };
}
