-- Create Brad's creator account
INSERT INTO users (
  id, email, password_hash, first_name, last_name,
  is_creator, has_lifetime_subscription, age_verified, email_verified,
  subscription_status
) VALUES (
  'user_brad_creator',
  'bradturnbough80@gmail.com',
  '$2b$10$iMCLItobOJYzSSAXez4OI.cNuYVEIkzEAM.pjxJFYAAQtJtszdeTO',
  'Brad',
  'Turnbough',
  true,
  true,
  true,
  true,
  'lifetime'
)
ON CONFLICT (email) DO UPDATE SET
  is_creator = true,
  has_lifetime_subscription = true,
  subscription_status = 'lifetime'
RETURNING id, email, first_name, is_creator, has_lifetime_subscription;

-- Add creator points (using the actual user ID from the account)
INSERT INTO user_points (user_id, total_points, level, last_updated)
SELECT id, 1000, 2, NOW()
FROM users
WHERE email = 'bradturnbough80@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  total_points = 1000,
  level = 2,
  last_updated = NOW();

-- Add points transaction
INSERT INTO points_transactions (user_id, points, action, description, date_created)
SELECT id, 1000, 'creator_bonus', 'Creator Welcome Bonus', NOW()
FROM users
WHERE email = 'bradturnbough80@gmail.com';
