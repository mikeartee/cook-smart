-- Add/update points for Brad
INSERT INTO user_points (user_id, total_points, level, last_updated)
SELECT id, 1000, 2, NOW()
FROM users
WHERE email = 'bradturnbough80@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET
  total_points = GREATEST(user_points.total_points, 1000),
  level = CASE 
    WHEN GREATEST(user_points.total_points, 1000) >= 10000 THEN 5
    WHEN GREATEST(user_points.total_points, 1000) >= 5000 THEN 4
    WHEN GREATEST(user_points.total_points, 1000) >= 2000 THEN 3
    WHEN GREATEST(user_points.total_points, 1000) >= 500 THEN 2
    ELSE 1
  END,
  last_updated = NOW();

-- Add creator bonus transaction if not exists
INSERT INTO points_transactions (user_id, points, action, description, date_created)
SELECT id, 1000, 'creator_bonus', 'Creator Welcome Bonus', NOW()
FROM users
WHERE email = 'bradturnbough80@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM points_transactions 
  WHERE user_id = (SELECT id FROM users WHERE email = 'bradturnbough80@gmail.com')
  AND action = 'creator_bonus'
);

-- Verify
SELECT u.email, u.first_name, u.is_creator, u.has_lifetime_subscription, 
       up.total_points, up.level
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.email = 'bradturnbough80@gmail.com';
