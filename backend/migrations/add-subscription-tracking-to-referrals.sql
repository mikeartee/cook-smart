-- Add subscription tracking to referrals table

-- Add columns for subscription tracking
ALTER TABLE referrals 
ADD COLUMN IF NOT EXISTS subscription_purchased BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS subscription_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS access_months_awarded INTEGER DEFAULT 0;

-- Add column to users table to track extended access from referrals
ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_access_months INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS access_extended_until TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_subscription ON referrals(subscription_purchased, subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_access_extended ON users(access_extended_until);

-- Show current referral stats
SELECT 
  COUNT(*) as total_referrals,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN subscription_purchased = true THEN 1 END) as with_subscription
FROM referrals;
