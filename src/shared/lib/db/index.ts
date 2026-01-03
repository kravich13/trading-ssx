import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'database', 'trading.db');

export const db = new Database(DB_PATH);

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

  CREATE VIEW IF NOT EXISTS investor_current_stats AS
  SELECT 
    i.id,
    i.name,
    COALESCE(l.capital_after, 0) as current_capital,
    COALESCE(l.deposit_after, 0) as current_deposit
  FROM investors i
  LEFT JOIN ledger l ON l.investor_id = i.id 
  WHERE l.id = (SELECT MAX(id) FROM ledger WHERE investor_id = i.id)
  OR l.id IS NULL;
`);
