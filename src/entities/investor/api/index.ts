'use server';

import { db } from '@/shared/api';
import { LedgerType, TradeStatus, TradeType } from '@/shared/enum';
import { TotalStats } from '@/shared/types';
import { revalidatePath } from 'next/cache';
import { FinanceStats } from '../lib';
import { Investor, LedgerEntry, LedgerEntryWithInvestor } from '../types';

export async function getInvestors(): Promise<Investor[]> {
  const investorsRaw = db.prepare('SELECT id, name, is_active, type FROM investors').all() as {
    id: number;
    name: string;
    is_active: number;
    type: TradeType;
  }[];

  const allLedger = db
    .prepare(
      `
    SELECT investor_id, type, change_amount, capital_after, deposit_after, capital_before, deposit_before
    FROM ledger
  `
    )
    .all() as LedgerEntry[];

  return investorsRaw
    .map((inv) => {
      const history = allLedger.filter((l) => l.investor_id === inv.id);
      let cap = 0;
      let dep = 0;

      let isFirst = true;
      for (const entry of history) {
        if (entry.type === LedgerType.TRADE) {
          cap += entry.change_amount;
          dep += entry.change_amount;
        } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
          if (isFirst) {
            cap = entry.capital_after;
            dep = entry.deposit_after;
          } else {
            cap += entry.change_amount;
          }
        } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
          dep += entry.change_amount;
        } else if (entry.type === LedgerType.BOTH_CHANGE) {
          cap += entry.change_amount;
          dep += entry.change_amount;
        }
        isFirst = false;
      }

      return {
        ...inv,
        is_active: Boolean(inv.is_active),
        current_capital: cap,
        current_deposit: dep,
      };
    })
    .sort((a, b) => (b.is_active ? 0 : 1) - (a.is_active ? 0 : 1) || a.name.localeCompare(b.name));
}

export async function getInvestorById(id: number): Promise<Investor | undefined> {
  const investorRaw = db
    .prepare('SELECT id, name, is_active, type FROM investors WHERE id = ?')
    .get(id) as { id: number; name: string; is_active: number; type: TradeType } | undefined;

  if (!investorRaw) return undefined;

  const history = db
    .prepare(
      `
    SELECT type, change_amount, capital_after, deposit_after, capital_before, deposit_before
    FROM ledger 
    WHERE investor_id = ?
  `
    )
    .all(id) as LedgerEntry[];

  let cap = 0;
  let dep = 0;
  let isFirst = true;

  for (const entry of history) {
    if (entry.type === LedgerType.TRADE) {
      cap += entry.change_amount;
      dep += entry.change_amount;
    } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
      if (isFirst) {
        cap = entry.capital_after;
        dep = entry.deposit_after;
      } else {
        cap += entry.change_amount;
      }
    } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
      dep += entry.change_amount;
    } else if (entry.type === LedgerType.BOTH_CHANGE) {
      cap += entry.change_amount;
      dep += entry.change_amount;
    }
    isFirst = false;
  }

  return {
    ...investorRaw,
    is_active: Boolean(investorRaw.is_active),
    current_capital: cap,
    current_deposit: dep,
  };
}

export async function getTotalStats(): Promise<TotalStats> {
  const investors = await getInvestors();
  const activeInvestors = investors.filter((i) => i.is_active);

  return {
    total_capital: activeInvestors.reduce((sum, i) => sum + i.current_capital, 0),
    total_deposit: activeInvestors.reduce((sum, i) => sum + i.current_deposit, 0),
  };
}

export async function getGlobalTotalStats(): Promise<TotalStats> {
  const investors = await getInvestors();
  const activeGlobalInvestors = investors.filter((i) => i.is_active && i.type === TradeType.GLOBAL);

  return {
    total_capital: activeGlobalInvestors.reduce((sum, i) => sum + i.current_capital, 0),
    total_deposit: activeGlobalInvestors.reduce((sum, i) => sum + i.current_deposit, 0),
  };
}

export async function getInvestorLedger(
  id: number
): Promise<
  (LedgerEntry & { status?: TradeStatus; trade_type?: TradeType; trade_number?: number })[]
> {
  const investor = await getInvestorById(id);
  const investorType = investor?.type || TradeType.GLOBAL;

  const ledgerRaw = db
    .prepare(
      `
    SELECT l.*, t.status, t.type as trade_type, t.profits_json, t.number as trade_number,
           COALESCE(t.closed_date, l.created_at) as effective_date
    FROM ledger l
    LEFT JOIN trades t ON l.trade_id = t.id
    WHERE l.investor_id = ? 
    AND (
      l.type != 'TRADE' 
      OR t.type IS NULL 
      OR t.type = ?
    )
    ORDER BY 
      effective_date ASC,
      CASE 
        WHEN l.trade_id IS NULL THEN 0
        WHEN l.trade_id = -1 THEN 1
        ELSE 2
      END ASC,
      l.id ASC
  `
    )
    .all(id, investorType) as (LedgerEntry & {
    status?: TradeStatus;
    trade_type?: TradeType;
    profits_json?: string | null;
    trade_number?: number;
    effective_date: string;
  })[];

  let cap = 0;
  let dep = 0;
  let isFirst = true;

  const calculatedLedger = ledgerRaw.map((entry) => {
    const capBefore = cap;
    const depBefore = dep;

    if (entry.type === LedgerType.TRADE) {
      cap += entry.change_amount;
      dep += entry.change_amount;
    } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
      if (isFirst) {
        cap = entry.capital_after;
        dep = entry.deposit_after;
      } else {
        cap += entry.change_amount;
      }
    } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
      dep += entry.change_amount;
    } else if (entry.type === LedgerType.BOTH_CHANGE) {
      cap += entry.change_amount;
      dep += entry.change_amount;
    }

    isFirst = false;

    return {
      ...entry,
      capital_before: capBefore,
      capital_after: cap,
      deposit_before: depBefore,
      deposit_after: dep,
    };
  });

  return calculatedLedger.reverse();
}

export async function getGlobalActionsLog(): Promise<
  (LedgerEntryWithInvestor & { trade_number?: number })[]
> {
  // 1. Fetch all ledger entries across all investors to track balances correctly
  const allLedgerRaw = db
    .prepare(
      `
    SELECT l.*, i.name as investor_name, i.type as investor_type, t.number as trade_number,
           COALESCE(t.closed_date, l.created_at) as effective_date
    FROM ledger l
    JOIN investors i ON l.investor_id = i.id
    LEFT JOIN trades t ON l.trade_id = t.id
    ORDER BY 
      effective_date ASC,
      CASE 
        WHEN l.trade_id IS NULL THEN 0
        WHEN l.trade_id = -1 THEN 1
        ELSE 2
      END ASC,
      l.id ASC
  `
    )
    .all() as (LedgerEntryWithInvestor & { trade_number?: number; effective_date: string })[];

  const balances: Record<number, { cap: number; dep: number; isFirst: boolean }> = {};
  const processedEntries: (LedgerEntryWithInvestor & { trade_number?: number })[] = [];

  // 2. Process all entries to calculate balances at each point in time
  for (const entry of allLedgerRaw) {
    if (!balances[entry.investor_id]) {
      balances[entry.investor_id] = { cap: 0, dep: 0, isFirst: true };
    }

    const bal = balances[entry.investor_id];
    const capBefore = bal.cap;
    const depBefore = bal.dep;

    if (entry.type === LedgerType.TRADE) {
      bal.cap += entry.change_amount;
      bal.dep += entry.change_amount;
    } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
      if (bal.isFirst) {
        bal.cap = entry.capital_after;
        bal.dep = entry.deposit_after;
      } else {
        bal.cap += entry.change_amount;
      }
    } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
      bal.dep += entry.change_amount;
    } else if (entry.type === LedgerType.BOTH_CHANGE) {
      bal.cap += entry.change_amount;
      bal.dep += entry.change_amount;
    }

    bal.isFirst = false;

    // 3. Filter only for action entries but store calculated balances
    if (
      entry.type === LedgerType.CAPITAL_CHANGE ||
      entry.type === LedgerType.DEPOSIT_CHANGE ||
      entry.type === LedgerType.BOTH_CHANGE
    ) {
      processedEntries.push({
        ...entry,
        capital_before: capBefore,
        capital_after: bal.cap,
        deposit_before: depBefore,
        deposit_after: bal.dep,
      });
    }
  }

  return processedEntries.reverse();
}

export async function addInvestor({
  name,
  initialCapital,
  initialDeposit,
  type = TradeType.GLOBAL,
}: {
  name: string;
  initialCapital: number;
  initialDeposit: number;
  type?: TradeType;
}) {
  const insertInvestor = db.prepare('INSERT INTO investors (name, type) VALUES (?, ?)');
  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, type, capital_before, deposit_before, capital_after, deposit_after
    ) VALUES (?, '${LedgerType.CAPITAL_CHANGE}', 0, 0, ?, ?)
  `);

  const transaction = db.transaction(
    ({ n, cap, dep, t }: { n: string; cap: number; dep: number; t: TradeType }) => {
      const info = insertInvestor.run(n, t);
      const investorId = info.lastInsertRowid;
      insertLedger.run(investorId, cap, dep);
    }
  );

  transaction({ n: name, cap: initialCapital, dep: initialDeposit, t: type });
  revalidatePath('/');
  revalidatePath('/investors');
}

export async function toggleInvestorStatus(id: number, isActive: boolean) {
  if (isActive) {
    db.prepare('UPDATE investors SET is_active = 1, archived_at = NULL WHERE id = ?').run(id);
  } else {
    db.prepare(
      'UPDATE investors SET is_active = 0, archived_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(id);
  }
  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}

export async function updateInvestorBalance({
  id,
  amount,
  type,
  tradeId,
}: {
  id: number;
  amount: number;
  type: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE;
  tradeId?: number | null;
}) {
  // We no longer calculate complex "before/after" values here because they are calculated on-the-fly.
  // We just insert the change and some basic values to satisfy DB constraints.
  const insertLedger = db.prepare(`
    INSERT INTO ledger (
      investor_id, trade_id, type, change_amount, capital_before, capital_after, deposit_before, deposit_after
    ) VALUES (?, ?, ?, ?, 0, 0, 0, 0)
  `);

  const finalTradeId = tradeId !== undefined && tradeId !== null ? tradeId : null;
  if (finalTradeId === -1) {
    db.exec('PRAGMA foreign_keys = OFF');
    insertLedger.run(id, finalTradeId, type, amount);
    db.exec('PRAGMA foreign_keys = ON');
  } else {
    insertLedger.run(id, finalTradeId, type, amount);
  }

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${id}`);
}

export async function deleteLedgerEntry(id: number, investorId: number) {
  const entry = db.prepare('SELECT * FROM ledger WHERE id = ?').get(id) as LedgerEntry;
  if (!entry) return;

  const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;

  if (isInitial) {
    const otherEntries = db
      .prepare('SELECT COUNT(*) as count FROM ledger WHERE investor_id = ? AND id != ?')
      .get(investorId, id) as { count: number };

    if (otherEntries.count > 0) {
      throw new Error('Cannot delete initial entry when subsequent entries exist');
    }
  }

  db.prepare('DELETE FROM ledger WHERE id = ?').run(id);
  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
}

export async function updateLedgerEntry({
  id,
  investorId,
  amount,
  depositAmount,
  createdAt,
  type,
  tradeId,
}: {
  id: number;
  investorId: number;
  amount: number;
  depositAmount?: number;
  createdAt: string;
  type?: LedgerType.CAPITAL_CHANGE | LedgerType.DEPOSIT_CHANGE | LedgerType.BOTH_CHANGE;
  tradeId?: number | null;
}) {
  const entry = db.prepare('SELECT * FROM ledger WHERE id = ?').get(id) as LedgerEntry;
  if (!entry) return;

  const isInitial = entry.capital_before === 0 && entry.deposit_before === 0;
  const effectiveDepositAmount = depositAmount !== undefined ? depositAmount : amount;

  if (isInitial) {
    const newTradeId = tradeId !== undefined ? tradeId : entry.trade_id;

    if (newTradeId === -1) {
      db.exec('PRAGMA foreign_keys = OFF');
      db.prepare(
        'UPDATE ledger SET capital_after = ?, deposit_after = ?, created_at = ?, trade_id = ? WHERE id = ?'
      ).run(amount, effectiveDepositAmount, createdAt, newTradeId, id);
      db.exec('PRAGMA foreign_keys = ON');
    } else {
      db.prepare(
        'UPDATE ledger SET capital_after = ?, deposit_after = ?, created_at = ?, trade_id = ? WHERE id = ?'
      ).run(amount, effectiveDepositAmount, createdAt, newTradeId, id);
    }
  } else {
    const newType = type || entry.type;
    const newTradeId = tradeId !== undefined ? tradeId : entry.trade_id;

    if (newTradeId === -1) {
      db.exec('PRAGMA foreign_keys = OFF');
      try {
        db.prepare(
          'UPDATE ledger SET type = ?, trade_id = ?, change_amount = ?, created_at = ? WHERE id = ?'
        ).run(newType, newTradeId, amount, createdAt, id);
      } finally {
        db.exec('PRAGMA foreign_keys = ON');
      }
    } else {
      db.prepare(
        'UPDATE ledger SET type = ?, trade_id = ?, change_amount = ?, created_at = ? WHERE id = ?'
      ).run(newType, newTradeId, amount, createdAt, id);
    }
  }

  revalidatePath('/');
  revalidatePath('/investors');
  revalidatePath(`/investors/${investorId}`);
}

export async function getGlobalFinanceStats(): Promise<FinanceStats> {
  const current = await getGlobalTotalStats();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfQuarter = new Date(
    now.getFullYear(),
    Math.floor(now.getMonth() / 3) * 3,
    1
  ).toISOString();

  const getBaseStats = (date: string): TotalStats => {
    const allLedger = db
      .prepare(
        `
      SELECT l.*, i.type as investor_type, i.is_active
      FROM ledger l
      JOIN investors i ON l.investor_id = i.id
      WHERE COALESCE(l.closed_date, l.created_at) < ?
      ORDER BY 
        CASE 
          WHEN l.trade_id IS NULL THEN 0
          WHEN l.trade_id = -1 THEN 1
          ELSE 2
        END ASC,
        CASE 
          WHEN l.trade_id = -1 THEN 0
          WHEN l.trade_id IS NULL THEN 0
          ELSE l.trade_id
        END ASC,
        l.id ASC
    `
      )
      .all(date) as (LedgerEntry & { investor_type: TradeType; is_active: number })[];

    const balances: Record<number, { cap: number; dep: number }> = {};

    for (const entry of allLedger) {
      if (!balances[entry.investor_id]) {
        balances[entry.investor_id] = { cap: 0, dep: 0 };
      }

      const bal = balances[entry.investor_id];

      if (entry.type === LedgerType.TRADE) {
        bal.cap += entry.change_amount;
        bal.dep += entry.change_amount;
      } else if (entry.type === LedgerType.CAPITAL_CHANGE) {
        if (entry.capital_before === 0 && entry.deposit_before === 0) {
          bal.cap = entry.capital_after;
          bal.dep = entry.deposit_after;
        } else {
          bal.cap += entry.change_amount;
        }
      } else if (entry.type === LedgerType.DEPOSIT_CHANGE) {
        bal.dep += entry.change_amount;
      } else if (entry.type === LedgerType.BOTH_CHANGE) {
        bal.cap += entry.change_amount;
        bal.dep += entry.change_amount;
      }
    }

    let totalCap = 0;
    let totalDep = 0;

    // Filter only active GLOBAL investors
    const globalInvestors = db
      .prepare('SELECT id FROM investors WHERE is_active = 1 AND type = ?')
      .all(TradeType.GLOBAL) as { id: number }[];

    for (const inv of globalInvestors) {
      if (balances[inv.id]) {
        totalCap += balances[inv.id].cap;
        totalDep += balances[inv.id].dep;
      }
    }

    return { total_capital: totalCap, total_deposit: totalDep };
  };

  const monthBase = getBaseStats(startOfMonth);
  const quarterBase = getBaseStats(startOfQuarter);

  const monthBaseCapital = monthBase?.total_capital || 0;
  const monthBaseDeposit = monthBase?.total_deposit || 0;

  const quarterBaseCapital = quarterBase?.total_capital || 0;
  const quarterBaseDeposit = quarterBase?.total_deposit || 0;

  const monthCapitalGrowthUsd = current.total_capital - monthBaseCapital;
  const monthCapitalGrowthPercent =
    monthBaseCapital !== 0 ? (monthCapitalGrowthUsd / monthBaseCapital) * 100 : 0;

  const monthDepositGrowthUsd = current.total_deposit - monthBaseDeposit;
  const monthDepositGrowthPercent =
    monthBaseDeposit !== 0 ? (monthDepositGrowthUsd / monthBaseDeposit) * 100 : 0;

  const quarterCapitalGrowthUsd = current.total_capital - quarterBaseCapital;
  const quarterCapitalGrowthPercent =
    quarterBaseCapital !== 0 ? (quarterCapitalGrowthUsd / quarterBaseCapital) * 100 : 0;

  const quarterDepositGrowthUsd = current.total_deposit - quarterBaseDeposit;
  const quarterDepositGrowthPercent =
    quarterBaseDeposit !== 0 ? (quarterDepositGrowthUsd / quarterBaseDeposit) * 100 : 0;

  return {
    currentCapital: current.total_capital,
    currentDeposit: current.total_deposit,
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

export async function getGlobalLedger(): Promise<LedgerEntry[]> {
  const ledger = db
    .prepare(
      `
    SELECT l.*
    FROM ledger l
    JOIN investors i ON l.investor_id = i.id
    WHERE i.type = ?
    ORDER BY l.id DESC
  `
    )
    .all(TradeType.GLOBAL) as LedgerEntry[];
  return ledger;
}

export async function getInvestorTradesForSelection(
  investorId: number
): Promise<{ id: number; number: number }[]> {
  const investor = await getInvestorById(investorId);
  if (!investor) return [];

  const tradeType = investor.type === TradeType.PRIVATE ? TradeType.PRIVATE : TradeType.GLOBAL;

  const trades = db
    .prepare(
      `
    SELECT DISTINCT t.id, t.number
    FROM trades t
    LEFT JOIN ledger l ON l.trade_id = t.id AND l.investor_id = ?
    WHERE t.type = ? AND (l.id IS NOT NULL OR ? = 1)
    ORDER BY t.id ASC
  `
    )
    .all(investorId, tradeType, investor.type === TradeType.GLOBAL ? 1 : 0) as {
    id: number;
    number: number;
  }[];

  return trades.map((t) => ({
    id: t.id,
    number: t.number,
  }));
}

export async function getInvestorLedgerCount(id: number): Promise<number> {
  const result = db
    .prepare('SELECT COUNT(*) as count FROM ledger WHERE investor_id = ?')
    .get(id) as { count: number } | undefined;
  return result?.count || 0;
}
