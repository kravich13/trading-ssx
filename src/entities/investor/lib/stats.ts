import { LedgerEntry } from '../types';

export interface FinanceStats {
  currentCapital: number;
  currentDeposit: number;
  monthCapitalGrowthUsd: number;
  monthCapitalGrowthPercent: number;
  monthDepositGrowthUsd: number;
  monthDepositGrowthPercent: number;
  quarterCapitalGrowthUsd: number;
  quarterCapitalGrowthPercent: number;
  quarterDepositGrowthUsd: number;
  quarterDepositGrowthPercent: number;
}

export function calculateFinanceStats(ledger: LedgerEntry[]): FinanceStats {
  if (ledger.length === 0) {
    return {
      currentCapital: 0,
      currentDeposit: 0,
      monthCapitalGrowthUsd: 0,
      monthCapitalGrowthPercent: 0,
      monthDepositGrowthUsd: 0,
      monthDepositGrowthPercent: 0,
      quarterCapitalGrowthUsd: 0,
      quarterCapitalGrowthPercent: 0,
      quarterDepositGrowthUsd: 0,
      quarterDepositGrowthPercent: 0,
    };
  }

  const latest = ledger[0];
  const currentCapital = latest.capital_after;
  const currentDeposit = latest.deposit_after;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

  // Helper to get base values (last entry before specific date)
  const getBaseValues = (date: Date) => {
    const prevEntries = ledger.filter((e) => new Date(e.created_at) < date);
    if (prevEntries.length > 0) {
      return {
        capital: prevEntries[0].capital_after,
        deposit: prevEntries[0].deposit_after,
      };
    }
    const oldest = ledger[ledger.length - 1];
    return {
      capital: oldest.capital_before,
      deposit: oldest.deposit_before,
    };
  };

  const monthBase = getBaseValues(startOfMonth);
  const quarterBase = getBaseValues(startOfQuarter);

  const monthCapitalGrowthUsd = currentCapital - monthBase.capital;
  const monthCapitalGrowthPercent =
    monthBase.capital !== 0 ? (monthCapitalGrowthUsd / monthBase.capital) * 100 : 0;

  const monthDepositGrowthUsd = currentDeposit - monthBase.deposit;
  const monthDepositGrowthPercent =
    monthBase.deposit !== 0 ? (monthDepositGrowthUsd / monthBase.deposit) * 100 : 0;

  const quarterCapitalGrowthUsd = currentCapital - quarterBase.capital;
  const quarterCapitalGrowthPercent =
    quarterBase.capital !== 0 ? (quarterCapitalGrowthUsd / quarterBase.capital) * 100 : 0;

  const quarterDepositGrowthUsd = currentDeposit - quarterBase.deposit;
  const quarterDepositGrowthPercent =
    quarterBase.deposit !== 0 ? (quarterDepositGrowthUsd / quarterBase.deposit) * 100 : 0;

  return {
    currentCapital,
    currentDeposit,
    monthCapitalGrowthUsd,
    monthCapitalGrowthPercent,
    monthDepositGrowthUsd,
    monthDepositGrowthPercent,
    quarterCapitalGrowthUsd,
    quarterCapitalGrowthPercent,
    quarterDepositGrowthUsd,
    quarterDepositGrowthPercent,
  };
}
