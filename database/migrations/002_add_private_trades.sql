-- Add type and investor_id to trades
ALTER TABLE trades ADD COLUMN type TEXT NOT NULL DEFAULT 'GLOBAL' CHECK(type IN ('GLOBAL', 'PRIVATE'));
ALTER TABLE trades ADD COLUMN investor_id INTEGER REFERENCES investors(id);

-- Add type to investors
ALTER TABLE investors ADD COLUMN type TEXT NOT NULL DEFAULT 'GLOBAL' CHECK(type IN ('GLOBAL', 'PRIVATE'));

