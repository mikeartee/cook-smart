-- Migration: Add cancellation fields to subscriptions table
-- Description: Track when and why subscriptions are canceled

-- Add cancellation columns
ALTER TABLE subscriptions 
ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- Add trial status to enum if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid  
    WHERE t.typname = 'subscriptions_status' 
    AND e.enumlabel = 'trial'
  ) THEN
    ALTER TYPE subscriptions_status ADD VALUE 'trial';
  END IF;
END $$;

-- Add comments
COMMENT ON COLUMN subscriptions.canceled_at IS 'Timestamp when subscription was canceled';
COMMENT ON COLUMN subscriptions.cancellation_reason IS 'Reason provided for cancellation';
