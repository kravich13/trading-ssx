import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'trading.db');

export const db = new Database(DB_PATH);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('TRADE', 'CAPITAL_CHANGE', 'DEPOSIT_CHANGE')),
    ticker TEXT,
    pl_percent REAL,
    pl_usd REAL DEFAULT 0,
    capital_before REAL NOT NULL,
    deposit_before REAL NOT NULL,
    capital_after REAL NOT NULL,
    deposit_after REAL NOT NULL,
    closed_date DATETIME,
    default_risk_percent REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES investors(id)
  );

  -- Create a view for total stats
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
