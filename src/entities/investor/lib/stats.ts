import { DateTime } from 'luxon';
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

export interface PeriodicStat {
  label: string;
  usd: number;
  percent: number;
  isProfit: boolean;
}

export interface MonthStat extends PeriodicStat {
  month: number; // 0-11
}

export interface QuarterStat extends PeriodicStat {
  quarter: number; // 1-4
  months: MonthStat[];
}

export interface YearStat extends PeriodicStat {
  year: number;
  quarters: QuarterStat[];
}

const parseDate = (dateStr: string | null | undefined): DateTime | null => {
  if (!dateStr) return null;
  // Try ISO first
  let dt = DateTime.fromISO(dateStr.replace(' ', 'T'));
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd.MM.yyyy');
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'yyyy-MM-dd HH:mm:ss');
  if (!dt.isValid) dt = DateTime.fromFormat(dateStr, 'dd.MM.yyyy HH:mm:ss');
  return dt.isValid ? dt : null;
};

interface MonthStatInternal extends MonthStat {
  startDep?: number;
}

interface QuarterStatInternal extends Omit<QuarterStat, 'months'> {
  startDep?: number;
  months: MonthStatInternal[];
}

interface YearStatInternal extends Omit<YearStat, 'quarters'> {
  startDep?: number;
  quarters: QuarterStatInternal[];
}

export function calculatePeriodicStats(ledger: LedgerEntry[]): YearStat[] {
  const trades = ledger
    .filter((e) => e.type === 'TRADE' && e.closed_date)
    .sort((a, b) => {
      const dtA = parseDate(a.closed_date);
      const dtB = parseDate(b.closed_date);
      return (dtA?.toMillis() || 0) - (dtB?.toMillis() || 0);
    });

  if (trades.length === 0) return [];

  const yearsMap = new Map<number, YearStatInternal>();

  trades.forEach((trade) => {
    const dt = parseDate(trade.closed_date);
    if (!dt) return;

    const year = dt.year;
    const month = dt.month - 1;
    const quarter = Math.ceil(dt.month / 3);

    if (!yearsMap.has(year)) {
      yearsMap.set(year, {
        year,
        label: year.toString(),
        usd: 0,
        percent: 0,
        isProfit: true,
        quarters: [],
      });
    }
    const yearStat = yearsMap.get(year)!;

    let quarterStat = yearStat.quarters.find((q) => q.quarter === quarter);
    if (!quarterStat) {
      quarterStat = {
        quarter,
        label: `Q${quarter}`,
        usd: 0,
        percent: 0,
        isProfit: true,
        months: [],
      };
      yearStat.quarters.push(quarterStat);
      yearStat.quarters.sort((a, b) => a.quarter - b.quarter);
    }

    let monthStat = quarterStat.months.find((m) => m.month === month);
    if (!monthStat) {
      monthStat = {
        month,
        label: dt.toLocaleString({ month: 'long' }),
        usd: 0,
        percent: 0,
        isProfit: true,
      };
      quarterStat.months.push(monthStat);
      quarterStat.months.sort((a, b) => a.month - b.month);
    }

    monthStat.usd += trade.change_amount;
    quarterStat.usd += trade.change_amount;
    yearStat.usd += trade.change_amount;

    if (monthStat.startDep === undefined) monthStat.startDep = trade.deposit_before;
    if (quarterStat.startDep === undefined) quarterStat.startDep = trade.deposit_before;
    if (yearStat.startDep === undefined) yearStat.startDep = trade.deposit_before;

    monthStat.isProfit = monthStat.usd >= 0;
    quarterStat.isProfit = quarterStat.usd >= 0;
    yearStat.isProfit = yearStat.usd >= 0;
  });

  yearsMap.forEach((yearStat) => {
    const yStart = yearStat.startDep || 1;
    yearStat.percent = (yearStat.usd / yStart) * 100;

    yearStat.quarters.forEach((qStat) => {
      const qStart = qStat.startDep || 1;
      qStat.percent = (qStat.usd / qStart) * 100;

      qStat.months.forEach((mStat) => {
        const mStart = mStat.startDep || 1;
        mStat.percent = (mStat.usd / mStart) * 100;
      });
    });
  });

  return Array.from(yearsMap.values()).sort((a, b) => b.year - a.year) as YearStat[];
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

  const now = DateTime.now();
  const startOfMonth = now.startOf('month');
  const startOfQuarter = now.startOf('quarter');

  const getBaseValues = (threshold: DateTime) => {
    const prevEntries = ledger.filter((e) => {
      const dt = parseDate(e.closed_date || e.created_at);
      return dt && dt < threshold;
    });

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
