-- Migration: Manual update of trade closed dates for IDs 30-60
-- Based on user provided sequence

-- ID 30-51: Incremental years from 2025 to 2046 (01.09)
UPDATE trades SET closed_date = '2025-09-01' WHERE id = 30;
UPDATE trades SET closed_date = '2026-09-01' WHERE id = 31;
UPDATE trades SET closed_date = '2027-09-01' WHERE id = 32;
UPDATE trades SET closed_date = '2028-09-01' WHERE id = 33;
UPDATE trades SET closed_date = '2029-09-01' WHERE id = 34;
UPDATE trades SET closed_date = '2030-09-01' WHERE id = 35;
UPDATE trades SET closed_date = '2031-09-01' WHERE id = 36;
UPDATE trades SET closed_date = '2032-09-01' WHERE id = 37;
UPDATE trades SET closed_date = '2033-09-01' WHERE id = 38;
UPDATE trades SET closed_date = '2034-09-01' WHERE id = 39;
UPDATE trades SET closed_date = '2035-09-01' WHERE id = 40;
UPDATE trades SET closed_date = '2036-09-01' WHERE id = 41;
UPDATE trades SET closed_date = '2037-09-01' WHERE id = 42;
UPDATE trades SET closed_date = '2038-09-01' WHERE id = 43;
UPDATE trades SET closed_date = '2039-09-01' WHERE id = 44;
UPDATE trades SET closed_date = '2040-09-01' WHERE id = 45;
UPDATE trades SET closed_date = '2041-09-01' WHERE id = 46;
UPDATE trades SET closed_date = '2042-09-01' WHERE id = 47;
UPDATE trades SET closed_date = '2043-09-01' WHERE id = 48;
UPDATE trades SET closed_date = '2044-09-01' WHERE id = 49;
UPDATE trades SET closed_date = '2045-09-01' WHERE id = 50;
UPDATE trades SET closed_date = '2046-09-01' WHERE id = 51;

-- ID 52-60: Specific dates from Sep to Oct 2025
UPDATE trades SET closed_date = '2025-09-26' WHERE id = 52;
UPDATE trades SET closed_date = '2025-09-27' WHERE id = 53;
UPDATE trades SET closed_date = '2025-10-09' WHERE id = 54;
UPDATE trades SET closed_date = '2025-10-08' WHERE id = 55;
UPDATE trades SET closed_date = '2025-10-14' WHERE id = 56;
UPDATE trades SET closed_date = '2025-10-22' WHERE id = 57;
UPDATE trades SET closed_date = '2025-10-27' WHERE id = 58;
UPDATE trades SET closed_date = '2025-10-29' WHERE id = 59;
UPDATE trades SET closed_date = '2025-10-31' WHERE id = 60;

-- Synchronize ledger table closed_date with trades table
UPDATE ledger
SET closed_date = (SELECT closed_date FROM trades WHERE trades.id = ledger.trade_id)
WHERE trade_id BETWEEN 30 AND 60;

