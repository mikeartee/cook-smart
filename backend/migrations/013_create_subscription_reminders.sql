-- Create subscription reminders table
CREATE TABLE IF NOT EXISTS subscription_reminders (
  id SERIAL PRIMARY KEY,
  subscription_id VARCHAR(255) NOT NULL,
  reminder_type VARCHAR(50) NOT NULL, -- 'expiry', 'payment_failed', 'grace_warning', 'access_restricted'
  days_before INTEGER,
  sent_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_reminders_sub_id ON subscription_reminders(subscription_id);
CREATE INDEX idx_subscription_reminders_type ON subscription_reminders(reminder_type);
CREATE INDEX idx_subscription_reminders_sent_at ON subscription_reminders(sent_at);

-- Add subscription_status to users if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE users ADD COLUMN subscription_status VARCHAR(50) DEFAULT 'none';
  END IF;
END $$;

-- Add grace_period_end to subscriptions if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'subscriptions' AND column_name = 'grace_period_end'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN grace_period_end TIMESTAMP;
  END IF;
END $$;
