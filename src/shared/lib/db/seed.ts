import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'database', 'trading.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    pl_percent REAL NOT NULL,
    default_risk_percent REAL,
    closed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    trade_id INTEGER,
    type TEXT NOT NULL CHECK(type IN ('TRADE', 'CAPITAL_CHANGE', 'DEPOSIT_CHANGE')),
    change_amount REAL DEFAULT 0,
    capital_before REAL NOT NULL,
    capital_after REAL NOT NULL,
    deposit_before REAL NOT NULL,
    deposit_after REAL NOT NULL,
    ticker TEXT,
    pl_percent REAL,
    default_risk_percent REAL,
    closed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES investors(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );
`);

async function seed() {
  console.log('🌱 Starting fresh seeding...');

  db.exec('DELETE FROM ledger');
  db.exec('DELETE FROM trades');
  db.exec('DELETE FROM investors');
  db.exec("DELETE FROM sqlite_sequence WHERE name IN ('investors', 'trades', 'ledger')");

  const createInv = db.prepare('INSERT INTO investors (name) VALUES (?)');
  const meId = createInv.run('Me').lastInsertRowid;
  const maxId = createInv.run('Max').lastInsertRowid;
  const annaId = createInv.run('Anna').lastInsertRowid;
  const angelinaId = createInv.run('Angelina').lastInsertRowid;

  const investorIds: Record<string, number | bigint> = {
    Me: meId,
    Max: maxId,
    Anna: annaId,
    Angelina: angelinaId,
  };

  console.log('Created investors:', Object.keys(investorIds).join(', '));

  const getInvestorBalance = (id: number | bigint) => {
    return db
      .prepare(
        'SELECT capital_after, deposit_after FROM ledger WHERE investor_id = ? ORDER BY id DESC LIMIT 1'
      )
      .get(id) as { capital_after: number; deposit_after: number } | undefined;
  };

  db.prepare(
    `
    INSERT INTO ledger (investor_id, type, change_amount, capital_before, capital_after, deposit_before, deposit_after)
    VALUES (?, 'CAPITAL_CHANGE', 6000, 0, 6000, 0, 6000)
  `
  ).run(meId);

  const addTrade = (
    ticker: string,
    plPercent: number,
    totalPlUsd: number,
    date?: string,
    risk?: number
  ) => {
    const tradeId = db
      .prepare(
        'INSERT INTO trades (ticker, pl_percent, closed_date, default_risk_percent) VALUES (?, ?, ?, ?)'
      )
      .run(ticker, plPercent, date || null, risk || null).lastInsertRowid;

    const investors = db.prepare('SELECT id FROM investors').all() as { id: number }[];
    const activeStates = investors
      .map((inv) => ({ id: inv.id, state: getInvestorBalance(inv.id) }))
      .filter((s) => s.state && s.state.capital_after > 0);

    const totalCapitalBefore = activeStates.reduce((sum, s) => sum + s.state!.capital_after, 0);

    activeStates.forEach((s) => {
      const share = s.state!.capital_after / totalCapitalBefore;
      const investorPlUsd = totalPlUsd * share;
      const newCapital = s.state!.capital_after + investorPlUsd;

      db.prepare(
        `
        INSERT INTO ledger (
          investor_id, trade_id, type, ticker, pl_percent, change_amount, 
          capital_before, capital_after, deposit_before, deposit_after, closed_date, default_risk_percent
        ) VALUES (?, ?, 'TRADE', ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      ).run(
        s.id,
        tradeId,
        ticker,
        plPercent,
        investorPlUsd,
        s.state!.capital_after,
        newCapital,
        s.state!.deposit_after,
        s.state!.deposit_after,
        date || null,
        risk || null
      );
    });
  };

  const changeCapital = (id: number | bigint, amount: number) => {
    const last = getInvestorBalance(id);
    const capB = last?.capital_after || 0;
    const depB = last?.deposit_after || 0;
    const newDep = depB === 0 ? amount : depB;

    db.prepare(
      `
      INSERT INTO ledger (investor_id, type, change_amount, capital_before, capital_after, deposit_before, deposit_after)
      VALUES (?, 'CAPITAL_CHANGE', ?, ?, ?, ?, ?)
    `
    ).run(id, amount, capB, capB + amount, depB, newDep);
  };

  const DATA_PATH = path.join(process.cwd(), 'src', 'shared', 'lib', 'db', 'initial-data.json');

  if (!fs.existsSync(DATA_PATH)) {
    console.log('⚠️ No initial-data.json found. Skipping seed events.');
    return;
  }

  interface SeedEvent {
    type: 'TRADE' | 'CHANGE';
    t?: string;
    p?: number;
    u?: number;
    d?: string;
    r?: number;
    invName?: string;
    amount?: number;
  }

  const events: SeedEvent[] = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

  for (const event of events) {
    if (event.type === 'TRADE') {
      addTrade(event.t!, event.p!, event.u!, event.d, event.r);
    } else if (event.type === 'CHANGE') {
      const invId = investorIds[event.invName!];
      if (invId) {
        changeCapital(invId, event.amount!);
      }
    }
  }

  console.log('✅ Seeding completed correctly!');
}

seed().catch(console.error);
