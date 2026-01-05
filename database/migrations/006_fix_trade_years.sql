-- Migration: Fix trade dates for IDs 30-51 (correction of year auto-fill error)
-- Changes 01.09.2025-2046 to 01.09.2025-22.09.2025

UPDATE trades SET closed_date = '2025-09-01' WHERE id = 30;
UPDATE trades SET closed_date = '2025-09-02' WHERE id = 31;
UPDATE trades SET closed_date = '2025-09-03' WHERE id = 32;
UPDATE trades SET closed_date = '2025-09-04' WHERE id = 33;
UPDATE trades SET closed_date = '2025-09-05' WHERE id = 34;
UPDATE trades SET closed_date = '2025-09-06' WHERE id = 35;
UPDATE trades SET closed_date = '2025-09-07' WHERE id = 36;
UPDATE trades SET closed_date = '2025-09-08' WHERE id = 37;
UPDATE trades SET closed_date = '2025-09-09' WHERE id = 38;
UPDATE trades SET closed_date = '2025-09-10' WHERE id = 39;
UPDATE trades SET closed_date = '2025-09-11' WHERE id = 40;
UPDATE trades SET closed_date = '2025-09-12' WHERE id = 41;
UPDATE trades SET closed_date = '2025-09-13' WHERE id = 42;
UPDATE trades SET closed_date = '2025-09-14' WHERE id = 43;
UPDATE trades SET closed_date = '2025-09-15' WHERE id = 44;
UPDATE trades SET closed_date = '2025-09-16' WHERE id = 45;
UPDATE trades SET closed_date = '2025-09-17' WHERE id = 46;
UPDATE trades SET closed_date = '2025-09-18' WHERE id = 47;
UPDATE trades SET closed_date = '2025-09-19' WHERE id = 48;
UPDATE trades SET closed_date = '2025-09-20' WHERE id = 49;
UPDATE trades SET closed_date = '2025-09-21' WHERE id = 50;
UPDATE trades SET closed_date = '2025-09-22' WHERE id = 51;

-- Synchronize ledger table
UPDATE ledger
SET closed_date = (SELECT closed_date FROM trades WHERE trades.id = ledger.trade_id)
WHERE trade_id BETWEEN 30 AND 51;

