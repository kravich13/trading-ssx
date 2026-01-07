import { LedgerEntry } from '@/entities/investor/types';
import { TradeStatus, TradeType } from '@/shared/enum';

export interface LedgerWithStatus extends LedgerEntry {
  status?: TradeStatus;
  trade_type?: TradeType;
  profits_json?: string | null;
  trade_number?: number;
}

export interface StatusChangeParams {
  tradeId: number;
  closedDate: string;
  status: TradeStatus;
}
