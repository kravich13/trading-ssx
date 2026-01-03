import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'trading.db');

export const db = new Database(DB_PATH);

// Initialize database
db.exec(`
  -- Investors table
  CREATE TABLE IF NOT EXISTS investors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Global trades table (Master info)
  CREATE TABLE IF NOT EXISTS trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    pl_percent REAL NOT NULL,
    default_risk_percent REAL,
    closed_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Ledger table (Detailed row-by-row history for each investor)
  CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    investor_id INTEGER NOT NULL,
    trade_id INTEGER, -- NULL if it's a manual balance change
    type TEXT NOT NULL CHECK(type IN ('TRADE', 'CAPITAL_CHANGE', 'DEPOSIT_CHANGE')),
    
    -- Values for the specific row (from Excel)
    change_amount REAL DEFAULT 0,    -- PL$ for trades, or the change amount for manual updates
    capital_before REAL NOT NULL,
    capital_after REAL NOT NULL,
    deposit_before REAL NOT NULL,
    deposit_after REAL NOT NULL,
    
    -- Denormalized data for easier reporting (copied from trade or manual entry)
    ticker TEXT,                     -- Ticker for trades
    pl_percent REAL,                 -- PL% for trades
    default_risk_percent REAL,       -- Risk% for trades
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES investors(id),
    FOREIGN KEY (trade_id) REFERENCES trades(id)
  );

  -- View for current balance of each investor
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
