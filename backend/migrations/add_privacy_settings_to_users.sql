-- Add privacy and security settings to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS data_sharing BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS analytics_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS push_notifications BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS location_services BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS dietary_restrictions TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS show_nutrition BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS preferred_units VARCHAR(20) DEFAULT 'imperial',
ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE;

-- Create index for email verification
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create index for two factor authentication
CREATE INDEX IF NOT EXISTS idx_users_two_factor ON users(two_factor_enabled);

