-- Complete Subscriptions System Migration
-- Creates all necessary tables for subscription pricing system

-- Table: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INTEGER NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'incomplete', 'trial')),
  current_period_start TIMESTAMP NOT NULL,
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP,
  cancellation_reason TEXT,
  promotional_price_used BOOLEAN DEFAULT FALSE,
  referral_code_used VARCHAR(50),
  initial_price DECIMAL(10,2),
  renewal_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_promotional_price_used ON subscriptions(promotional_price_used);

-- Table: subscription_plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  plan_name VARCHAR(50) UNIQUE NOT NULL,
  stripe_product_id VARCHAR(100) NOT NULL,
  promotional_price_id VARCHAR(100),
  standard_price_id VARCHAR(100) NOT NULL,
  billing_interval VARCHAR(20) NOT NULL CHECK (billing_interval IN ('year', 'month', 'week')),
  available_in_beta BOOLEAN DEFAULT FALSE,
  trial_days INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscription_plans
CREATE INDEX IF NOT EXISTS idx_subscription_plans_plan_name ON subscription_plans(plan_name);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_available_in_beta ON subscription_plans(available_in_beta);

-- Table: app_configuration
CREATE TABLE IF NOT EXISTS app_configuration (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value VARCHAR(255) NOT NULL,
  updated_by INTEGER REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for app_configuration
CREATE INDEX IF NOT EXISTS idx_app_configuration_config_key ON app_configuration(config_key);

-- Table: subscription_events
CREATE TABLE IF NOT EXISTS subscription_events (
  id SERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

-- Table: subscription_transactions
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id SERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20) NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  payment_method VARCHAR(50),
  failure_reason TEXT,
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for subscription_transactions
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_subscription_id ON subscription_transactions(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_status ON subscription_transactions(status);

-- Insert initial phase configuration (beta phase)
INSERT INTO app_configuration (config_key, config_value, updated_by, updated_at) 
VALUES ('beta_phase', 'true', NULL, CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;

-- Comments
COMMENT ON TABLE subscriptions IS 'User subscription records';
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with Stripe product and price IDs';
COMMENT ON TABLE app_configuration IS 'Application-wide configuration settings';
COMMENT ON TABLE subscription_events IS 'Logs all Stripe webhook events for audit trail';
COMMENT ON TABLE subscription_transactions IS 'Payment transaction history';
