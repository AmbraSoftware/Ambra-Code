-- Add CHECK constraint to prevent negative balance
-- This adds a database-level safety net to prevent balance < 0
-- even if application code has bugs or race conditions

ALTER TABLE "wallets" 
ADD CONSTRAINT "check_balance_non_negative" 
CHECK ("balance" >= 0);
