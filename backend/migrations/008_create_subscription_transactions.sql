-- Migration: Create subscription transactions table
-- Description: Track all subscription payments, failures, and refunds

CREATE TABLE IF NOT EXISTS subscription_transactions (
  id SERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method VARCHAR(100),
  failure_reason TEXT,
  refund_amount DECIMAL(10, 2),
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign keys
ALTER TABLE subscription_transactions
ADD CONSTRAINT fk_subscription_transactions_subscription
FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE;

ALTER TABLE subscription_transactions
ADD CONSTRAINT fk_subscription_transactions_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_subscription_id ON subscription_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_status ON subscription_transactions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_created_at ON subscription_transactions(created_at DESC);

-- Add comments
COMMENT ON TABLE subscription_transactions IS 'Tracks all subscription payment transactions';
COMMENT ON COLUMN subscription_transactions.status IS 'Transaction status: succeeded, failed, pending, or refunded';
COMMENT ON COLUMN subscription_transactions.refund_amount IS 'Amount refunded if status is refunded';
