-- Fix Mom's bonus points (her user_id has spaces)

-- Add bonus transaction for Mom
INSERT INTO points_transactions (user_id, points, action, description, date_created)
VALUES (' user_mom_ 1763602234', 250, 'special_user_bonus', 'Special User Welcome Bonus', NOW());

-- Create or update user_points record for Mom
INSERT INTO user_points (user_id, total_points, level, last_updated)
VALUES (' user_mom_ 1763602234', 250, 2, NOW())
ON CONFLICT (user_id)
DO UPDATE SET 
  total_points = user_points.total_points + 250,
  level = CASE 
    WHEN (user_points.total_points + 250) >= 10000 THEN 5
    WHEN (user_points.total_points + 250) >= 5000 THEN 4
    WHEN (user_points.total_points + 250) >= 2000 THEN 3
    WHEN (user_points.total_points + 250) >= 500 THEN 2
    WHEN (user_points.total_points + 250) >= 100 THEN 1
    ELSE 0
  END,
  last_updated = NOW();

-- Show results
SELECT u.email, u.first_name, up.total_points, up.level
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.email = ' dwoodswoods2@gmail.com';
