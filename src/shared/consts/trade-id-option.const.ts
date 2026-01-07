export const TRADE_ID_OPTION = {
  NONE: 'none',
  AT_THE_BEGINNING: 'at_the_beginning',
} as const;

export type TradeIdOption = (typeof TRADE_ID_OPTION)[keyof typeof TRADE_ID_OPTION];
