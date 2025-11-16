-- Subscription Pricing System Database Schema
-- This migration creates tables for subscription pricing with promotional and referral support

-- Table: subscription_plans
-- Stores available subscription plans with Stripe product/price IDs
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
CREATE INDEX idx_subscription_plans_plan_name ON subscription_plans(plan_name);
CREATE INDEX idx_subscription_plans_available_in_beta ON subscription_plans(available_in_beta);

-- Table: app_configuration
-- Stores application-wide configuration settings
CREATE TABLE IF NOT EXISTS app_configuration (
  id SERIAL PRIMARY KEY,
  config_key VARCHAR(50) UNIQUE NOT NULL,
  config_value VARCHAR(255) NOT NULL,
  updated_by INTEGER REFERENCES admin_users(id),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for app_configuration
CREATE INDEX idx_app_configuration_config_key ON app_configuration(config_key);

-- Add new columns to subscriptions table
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS promotional_price_used BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS referral_code_used VARCHAR(50),
  ADD COLUMN IF NOT EXISTS initial_price DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS renewal_price DECIMAL(10,2);

-- Add indexes to subscriptions table for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_promotional_price_used ON subscriptions(promotional_price_used);

-- Insert initial phase configuration (beta phase)
INSERT INTO app_configuration (config_key, config_value, updated_by, updated_at) 
VALUES ('beta_phase', 'true', NULL, CURRENT_TIMESTAMP)
ON CONFLICT (config_key) DO NOTHING;

-- Add comments to document the tables
COMMENT ON TABLE subscription_plans IS 'Available subscription plans with Stripe product and price IDs';
COMMENT ON COLUMN subscription_plans.promotional_price_id IS 'Stripe price ID for promotional pricing (e.g., $24.99 for yearly)';
COMMENT ON COLUMN subscription_plans.standard_price_id IS 'Stripe price ID for standard pricing (e.g., $34.99 for yearly)';
COMMENT ON COLUMN subscription_plans.available_in_beta IS 'Whether this plan is available during beta phase';
COMMENT ON COLUMN subscription_plans.trial_days IS 'Number of free trial days (0 for no trial)';

COMMENT ON TABLE app_configuration IS 'Application-wide configuration settings';
COMMENT ON COLUMN app_configuration.config_key IS 'Unique configuration key (e.g., beta_phase)';
COMMENT ON COLUMN app_configuration.config_value IS 'Configuration value as string';
COMMENT ON COLUMN app_configuration.updated_by IS 'Admin user who last updated this configuration';

COMMENT ON COLUMN subscriptions.promotional_price_used IS 'Whether user received promotional pricing on initial purchase';
COMMENT ON COLUMN subscriptions.referral_code_used IS 'Referral code used during subscription purchase';
COMMENT ON COLUMN subscriptions.initial_price IS 'Price paid for first billing period';
COMMENT ON COLUMN subscriptions.renewal_price IS 'Price charged on renewal';

-- Table: subscription_events
-- Logs all Stripe webhook events for subscriptions
CREATE TABLE IF NOT EXISTS subscription_events (
  id SERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for subscription_events
CREATE INDEX IF NOT EXISTS idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at);

COMMENT ON TABLE subscription_events IS 'Logs all Stripe webhook events for audit trail';
