import { LedgerType, TradeType } from '@/shared/enum';

export type Investor = {
  id: number;
  name: string;
  is_active: boolean;
  type: TradeType;
  current_capital: number;
  current_deposit: number;
};

export type LedgerEntry = {
  id: number;
  investor_id: number;
  trade_id: number | null;
  type: LedgerType;
  change_amount: number;
  capital_before: number;
  capital_after: number;
  deposit_before: number;
  deposit_after: number;
  ticker: string | null;
  pl_percent: number | null;
  default_risk_percent: number | null;
  closed_date: string | null;
  created_at: string;
};

export interface LedgerEntryWithInvestor extends LedgerEntry {
  investor_name: string;
}

export interface MonthlyDepositStat {
  year: number;
  quarter: number;
  month: number;
  monthName: string;
  depositStart: number;
  depositEnd: number;
  growthUsd: number;
  growthPercent: number;
  tradesCount: number;
}

export interface QuarterlyDepositStat {
  year: number;
  quarter: number;
  depositStart: number;
  depositEnd: number;
  growthUsd: number;
  growthPercent: number;
  tradesCount: number;
  months: MonthlyDepositStat[];
}

export interface YearlyDepositStat {
  year: number;
  depositStart: number;
  depositEnd: number;
  growthUsd: number;
  growthPercent: number;
  tradesCount: number;
  quarters: QuarterlyDepositStat[];
}
