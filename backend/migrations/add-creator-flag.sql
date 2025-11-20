-- Add creator flag to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS is_creator BOOLEAN DEFAULT FALSE;

-- Create index for creator flag
CREATE INDEX IF NOT EXISTS idx_users_creator ON users(is_creator);

-- Show the column was added
\d users
