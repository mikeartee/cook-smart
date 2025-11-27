-- Fix subscriptions table user_id type mismatch
-- Change user_id from INTEGER to VARCHAR(255) to match users table

-- Drop existing foreign key constraint if it exists
ALTER TABLE subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_user_id_fkey;

-- Change user_id column type from INTEGER to VARCHAR(255)
ALTER TABLE subscriptions 
ALTER COLUMN user_id TYPE VARCHAR(255);

-- Add foreign key constraint to users table
ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Also fix subscription_transactions table
ALTER TABLE subscription_transactions
DROP CONSTRAINT IF EXISTS subscription_transactions_user_id_fkey;

ALTER TABLE subscription_transactions
ALTER COLUMN user_id TYPE VARCHAR(255);

ALTER TABLE subscription_transactions
ADD CONSTRAINT subscription_transactions_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Update indexes
DROP INDEX IF EXISTS idx_subscriptions_user_id;
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);

DROP INDEX IF EXISTS idx_subscription_transactions_user_id;
CREATE INDEX idx_subscription_transactions_user_id ON subscription_transactions(user_id);

