export type Trade = {
  id: number;
  ticker: string;
  pl_percent: number;
  default_risk_percent: number | null;
  closed_date: string | null;
  total_pl_usd: number;
  total_capital_after: number;
  total_deposit_after: number;
  created_at: string;
};
