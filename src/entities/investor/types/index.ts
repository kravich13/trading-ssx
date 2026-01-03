import { LedgerType } from '@/shared/enum';

export type Investor = {
  id: number;
  name: string;
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
