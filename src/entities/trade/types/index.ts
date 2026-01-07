import { TradeStatus, TradeType } from '@/shared/enum';

export type Trade = {
  id: number;
  number: number;
  ticker: string;
  pl_percent?: number;
  default_risk_percent: number | null;
  closed_date: string | null;
  total_pl_usd: number;
  total_capital_after: number;
  total_deposit_after: number;
  status: TradeStatus;
  type: TradeType;
  investor_id: number | null;
  investor_name?: string;
  created_at: string;
  profits: number[];
};
