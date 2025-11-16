-- Migration: Add user suspension fields
-- Description: Add is_suspended and suspension_reason columns to users table for admin user management

-- Add suspension columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create index for faster queries on suspended users
CREATE INDEX IF NOT EXISTS idx_users_suspended ON users(is_suspended) WHERE is_suspended = TRUE;

-- Add comment
COMMENT ON COLUMN users.is_suspended IS 'Whether the user account is suspended by an admin';
COMMENT ON COLUMN users.suspension_reason IS 'Reason provided by admin for suspension';
