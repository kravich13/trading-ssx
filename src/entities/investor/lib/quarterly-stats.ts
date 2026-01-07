import { DateTime } from 'luxon';
import { LedgerType } from '@/shared/enum';
import { LedgerEntry, YearlyDepositStat } from '../types';

const parseDate = (dateStr: string | null | undefined): DateTime | null => {
  if (!dateStr) return null;
  let dt = DateTime.fromISO(dateStr.replace(' ', 'T'));
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd.MM.yyyy');
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd HH:mm:ss');
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd.MM.yyyy HH:mm:ss');
  return dt.isValid ? dt : null;
};

export function calculateQuarterlyDepositStats(ledger: LedgerEntry[]): YearlyDepositStat[] {
  const trades = ledger
    .filter((e) => e.type === LedgerType.TRADE && e.closed_date)
    .sort((a, b) => {
      const dtA = parseDate(a.closed_date);
      const dtB = parseDate(b.closed_date);
      return (dtA?.toMillis() || 0) - (dtB?.toMillis() || 0);
    });

  if (trades.length === 0) return [];

  const yearsMap = new Map<number, YearlyDepositStat>();

  trades.forEach((trade) => {
    const dt = parseDate(trade.closed_date);
    if (!dt) return;

    const year = dt.year;
    const month = dt.month - 1;
    const quarter = Math.ceil(dt.month / 3);

    if (!yearsMap.has(year)) {
      yearsMap.set(year, {
        year,
        depositStart: 0,
        depositEnd: 0,
        growthUsd: 0,
        growthPercent: 0,
        tradesCount: 0,
        quarters: [],
      });
    }
    const yearStat = yearsMap.get(year)!;

    let quarterStat = yearStat.quarters.find((q) => q.quarter === quarter);
    if (!quarterStat) {
      quarterStat = {
        year,
        quarter,
        depositStart: 0,
        depositEnd: 0,
        growthUsd: 0,
        growthPercent: 0,
        tradesCount: 0,
        months: [],
      };
      yearStat.quarters.push(quarterStat);
      yearStat.quarters.sort((a, b) => a.quarter - b.quarter);
    }

    let monthStat = quarterStat.months.find((m) => m.month === month);
    if (!monthStat) {
      monthStat = {
        year,
        quarter,
        month,
        monthName: dt.toLocaleString({ month: 'long' }),
        depositStart: trade.deposit_before,
        depositEnd: trade.deposit_after,
        growthUsd: trade.change_amount,
        growthPercent: 0,
        tradesCount: 1,
      };
      quarterStat.months.push(monthStat);
      quarterStat.months.sort((a, b) => a.month - b.month);
    } else {
      monthStat.depositEnd = trade.deposit_after;
      monthStat.growthUsd += trade.change_amount;
      monthStat.tradesCount += 1;
    }

    if (quarterStat.depositStart === 0) {
      quarterStat.depositStart = trade.deposit_before;
    }
    quarterStat.depositEnd = trade.deposit_after;
    quarterStat.growthUsd += trade.change_amount;
    quarterStat.tradesCount += 1;

    if (yearStat.depositStart === 0) {
      yearStat.depositStart = trade.deposit_before;
    }
    yearStat.depositEnd = trade.deposit_after;
    yearStat.growthUsd += trade.change_amount;
    yearStat.tradesCount += 1;
  });

  yearsMap.forEach((yearStat) => {
    if (yearStat.depositStart > 0) {
      yearStat.growthPercent = (yearStat.growthUsd / yearStat.depositStart) * 100;
    }

    yearStat.quarters.forEach((qStat) => {
      if (qStat.depositStart > 0) {
        qStat.growthPercent = (qStat.growthUsd / qStat.depositStart) * 100;
      }

      qStat.months.forEach((mStat) => {
        if (mStat.depositStart > 0) {
          mStat.growthPercent = (mStat.growthUsd / mStat.depositStart) * 100;
        }
      });
    });
  });

  return Array.from(yearsMap.values()).sort((a, b) => b.year - a.year);
}

interface TotalDepositStats {
  totalGrowthUsd: number;
  totalGrowthPercent: number;
  initialDeposit: number;
  finalDeposit: number;
}

export function calculateTotalDepositStats(stats: YearlyDepositStat[]): TotalDepositStats {
  if (stats.length === 0) {
    return {
      totalGrowthUsd: 0,
      totalGrowthPercent: 0,
      initialDeposit: 0,
      finalDeposit: 0,
    };
  }

  const totalGrowthUsd = stats.reduce((sum, year) => sum + year.growthUsd, 0);
  const oldestYear = stats[stats.length - 1];
  const newestYear = stats[0];
  const initialDeposit = oldestYear?.depositStart || 0;
  const finalDeposit = newestYear?.depositEnd || 0;
  const totalGrowthPercent = initialDeposit > 0 ? (totalGrowthUsd / initialDeposit) * 100 : 0;

  return {
    totalGrowthUsd,
    totalGrowthPercent,
    initialDeposit,
    finalDeposit,
  };
}
