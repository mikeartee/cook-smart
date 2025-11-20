-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  age_verified BOOLEAN DEFAULT FALSE,
  is_co_founder BOOLEAN DEFAULT FALSE,
  is_special_user BOOLEAN DEFAULT FALSE,
  has_lifetime_subscription BOOLEAN DEFAULT FALSE,
  subscription_status VARCHAR(50) DEFAULT 'free',
  points INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
