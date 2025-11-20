-- Add bonus points for special users (Briana and Mom)

-- Give Briana (Co-Founder) 500 bonus points
INSERT INTO points_transactions (user_id, points, action, description, date_created)
SELECT id, 500, 'special_user_bonus', 'Co-Founder Welcome Bonus', NOW()
FROM users 
WHERE is_co_founder = true
AND NOT EXISTS (
  SELECT 1 FROM points_transactions 
  WHERE user_id = users.id 
  AND action = 'special_user_bonus'
);

-- Give Mom (Special User) 250 bonus points
INSERT INTO points_transactions (user_id, points, action, description, date_created)
SELECT id, 250, 'special_user_bonus', 'Special User Welcome Bonus', NOW()
FROM users 
WHERE is_special_user = true
AND NOT EXISTS (
  SELECT 1 FROM points_transactions 
  WHERE user_id = users.id 
  AND action = 'special_user_bonus'
);

-- Update user_points table with the new totals
UPDATE user_points up
SET 
  total_points = COALESCE((
    SELECT SUM(points) 
    FROM points_transactions pt 
    WHERE pt.user_id = up.user_id
  ), 0),
  level = CASE 
    WHEN COALESCE((SELECT SUM(points) FROM points_transactions pt WHERE pt.user_id = up.user_id), 0) >= 10000 THEN 5
    WHEN COALESCE((SELECT SUM(points) FROM points_transactions pt WHERE pt.user_id = up.user_id), 0) >= 5000 THEN 4
    WHEN COALESCE((SELECT SUM(points) FROM points_transactions pt WHERE pt.user_id = up.user_id), 0) >= 2000 THEN 3
    WHEN COALESCE((SELECT SUM(points) FROM points_transactions pt WHERE pt.user_id = up.user_id), 0) >= 500 THEN 2
    WHEN COALESCE((SELECT SUM(points) FROM points_transactions pt WHERE pt.user_id = up.user_id), 0) >= 100 THEN 1
    ELSE 0
  END,
  last_updated = NOW()
WHERE user_id IN (
  SELECT id FROM users WHERE is_co_founder = true OR is_special_user = true
);

-- Show results
SELECT u.email, u.first_name, u.is_co_founder, u.is_special_user, up.total_points, up.level
FROM users u
LEFT JOIN user_points up ON u.id = up.user_id
WHERE u.is_co_founder = true OR u.is_special_user = true
ORDER BY up.total_points DESC;
