-- Create referrals table with subscription tracking

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referrer_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_user_id VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  points_awarded INTEGER DEFAULT 0,
  subscription_purchased BOOLEAN DEFAULT FALSE,
  subscription_type VARCHAR(50),
  subscription_date TIMESTAMP,
  access_months_awarded INTEGER DEFAULT 0,
  date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_completed TIMESTAMP
);

-- Add columns to users table for referral access tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_access_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_extended_until TIMESTAMP;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_subscription ON referrals(subscription_purchased, subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_access_extended ON users(access_extended_until);

-- Show table structure
\d referrals
