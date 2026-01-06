/**
 * Calculates PL% (profit/loss percentage) from capital before trade and change amount
 * @param capitalBefore - Capital before the trade
 * @param changeAmount - Profit/loss amount in USD (can be positive or negative)
 * @returns PL% as a number (e.g., 2.5 for 2.5%)
 */
export function calculatePlPercent(capitalBefore: number, changeAmount: number): number {
  if (capitalBefore <= 0) {
    return 0;
  }
  return (changeAmount / capitalBefore) * 100;
}

/**
 * Calculates PL% from capital after trade and change amount
 * First calculates capital before, then calculates PL%
 * @param capitalAfter - Capital after the trade
 * @param changeAmount - Profit/loss amount in USD (can be positive or negative)
 * @returns PL% as a number (e.g., 2.5 for 2.5%)
 */
export function calculatePlPercentFromAfter(capitalAfter: number, changeAmount: number): number {
  const capitalBefore = capitalAfter - changeAmount;
  return calculatePlPercent(capitalBefore, changeAmount);
}
