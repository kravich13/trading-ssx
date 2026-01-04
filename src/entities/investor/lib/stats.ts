import { LedgerEntry } from '../types';

export interface FinanceStats {
  currentCapital: number;
  currentDeposit: number;
  monthCapitalGrowthUsd: number;
  monthCapitalGrowthPercent: number;
  monthDepositGrowthUsd: number;
  monthDepositGrowthPercent: number;
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
    };
  }

  const latest = ledger[0];
  const currentCapital = latest.capital_after;
  const currentDeposit = latest.deposit_after;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const prevMonthEntries = ledger.filter((e) => new Date(e.created_at) < startOfMonth);

  let baseCapital = 0;
  let baseDeposit = 0;

  if (prevMonthEntries.length > 0) {
    baseCapital = prevMonthEntries[0].capital_after;
    baseDeposit = prevMonthEntries[0].deposit_after;
  } else {
    const oldest = ledger[ledger.length - 1];
    baseCapital = oldest.capital_before;
    baseDeposit = oldest.deposit_before;
  }

  const monthCapitalGrowthUsd = currentCapital - baseCapital;
  const monthCapitalGrowthPercent =
    baseCapital !== 0 ? (monthCapitalGrowthUsd / baseCapital) * 100 : 0;

  const monthDepositGrowthUsd = currentDeposit - baseDeposit;
  const monthDepositGrowthPercent =
    baseDeposit !== 0 ? (monthDepositGrowthUsd / baseDeposit) * 100 : 0;

  return {
    currentCapital,
    currentDeposit,
    monthCapitalGrowthUsd,
    monthCapitalGrowthPercent,
    monthDepositGrowthUsd,
    monthDepositGrowthPercent,
  };
}
