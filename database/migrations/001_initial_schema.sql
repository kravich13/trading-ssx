CREATE TABLE IF NOT EXISTS investors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  is_active INTEGER DEFAULT 1,
  archived_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  pl_percent REAL NOT NULL,
  default_risk_percent REAL,
  status TEXT DEFAULT 'CLOSED',
  profits_json TEXT DEFAULT '[]',
  closed_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  investor_id INTEGER NOT NULL,
  trade_id INTEGER,
  type TEXT NOT NULL CHECK(type IN ('TRADE', 'CAPITAL_CHANGE', 'DEPOSIT_CHANGE', 'BOTH_CHANGE')),
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

