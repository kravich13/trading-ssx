-- Migration: Complete date standardization for all tables
-- Standardizes created_at and archived_at fields if they were imported in DD.MM.YYYY format

-- 1. Investors table
UPDATE investors 
SET created_at = substr(created_at, 7, 4) || '-' || substr(created_at, 4, 2) || '-' || substr(created_at, 1, 2) || substr(created_at, 11)
WHERE created_at LIKE '__.__.____%';

UPDATE investors 
SET archived_at = substr(archived_at, 7, 4) || '-' || substr(archived_at, 4, 2) || '-' || substr(archived_at, 1, 2) || substr(archived_at, 11)
WHERE archived_at LIKE '__.__.____%';

-- 2. Trades table
UPDATE trades 
SET created_at = substr(created_at, 7, 4) || '-' || substr(created_at, 4, 2) || '-' || substr(created_at, 1, 2) || substr(created_at, 11)
WHERE created_at LIKE '__.__.____%';

-- 3. Ledger table
UPDATE ledger 
SET created_at = substr(created_at, 7, 4) || '-' || substr(created_at, 4, 2) || '-' || substr(created_at, 1, 2) || substr(created_at, 11)
WHERE created_at LIKE '__.__.____%';

-- Final cleanup: ensure nulls
UPDATE investors SET archived_at = NULL WHERE archived_at = '' OR archived_at = 'null';

