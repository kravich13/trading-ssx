-- Remove pl_percent column from trades and ledger tables
-- PL% is now calculated on-the-fly from capital and PL$ values

ALTER TABLE trades DROP COLUMN pl_percent;
ALTER TABLE ledger DROP COLUMN pl_percent;

