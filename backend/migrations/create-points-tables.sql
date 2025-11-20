-- Create points system tables

-- User Points Table
CREATE TABLE IF NOT EXISTS user_points (
  user_id VARCHAR(255) PRIMARY KEY,
  total_points INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Points Transactions Table
CREATE TABLE IF NOT EXISTS points_transactions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  points INTEGER NOT NULL,
  action VARCHAR(100) NOT NULL,
  description TEXT,
  date_created TIMESTAMP NOT NULL DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_points_total ON user_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_points_transactions_user ON points_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_points_transactions_date ON points_transactions(date_created DESC);

-- Insert initial points for existing users (0 points, level 0)
INSERT INTO user_points (user_id, total_points, level, last_updated)
SELECT id, 0, 0, NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM user_points)
ON CONFLICT (user_id) DO NOTHING;

-- Verify tables created
SELECT 'user_points table created' as status, COUNT(*) as user_count FROM user_points;
SELECT 'points_transactions table created' as status, COUNT(*) as transaction_count FROM points_transactions;
