import { Investor } from '@/entities/investor/types';
import { TradeType } from '@/shared/enum';
import { useEffect, useMemo } from 'react';

interface UseFilteredInvestorsProps {
  investors: Investor[];
  tradeType: TradeType;
  investorId: string;
  setInvestorId: (id: string) => void;
}

export function useFilteredInvestors({
  investors,
  tradeType,
  investorId,
  setInvestorId,
}: UseFilteredInvestorsProps) {
  const filteredInvestors = useMemo(() => {
    if (tradeType === TradeType.PRIVATE) {
      return investors.filter((inv) => inv.type === TradeType.PRIVATE);
    }
    return investors;
  }, [investors, tradeType]);

  useEffect(() => {
    if (tradeType === TradeType.PRIVATE && filteredInvestors.length > 0) {
      const currentInvestor = filteredInvestors.find((inv) => inv.id.toString() === investorId);

      if (!currentInvestor) {
        const me = filteredInvestors.find((inv) => inv.name === 'Me');

        if (me) {
          setInvestorId(me.id.toString());
        } else if (filteredInvestors.length > 0) {
          setInvestorId(filteredInvestors[0].id.toString());
        }
      }
    }
  }, [tradeType, filteredInvestors, investorId, setInvestorId]);

  return filteredInvestors;
}
