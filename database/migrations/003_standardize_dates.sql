-- Migration: Standardize dates to YYYY-MM-DD format
-- This handles conversion from DD.MM.YYYY to YYYY-MM-DD

-- 1. Update trades table
UPDATE trades 
SET closed_date = substr(closed_date, 7, 4) || '-' || substr(closed_date, 4, 2) || '-' || substr(closed_date, 1, 2)
WHERE closed_date LIKE '__.__.____';

-- 2. Update ledger table
UPDATE ledger 
SET closed_date = substr(closed_date, 7, 4) || '-' || substr(closed_date, 4, 2) || '-' || substr(closed_date, 1, 2)
WHERE closed_date LIKE '__.__.____';

-- Ensure empty strings are NULL
UPDATE trades SET closed_date = NULL WHERE closed_date = '';
UPDATE ledger SET closed_date = NULL WHERE closed_date = '';

