-- Fix user points by recalculating from transactions
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
  last_updated = NOW();

-- Show results
SELECT user_id, total_points, level 
FROM user_points 
WHERE total_points > 0 
ORDER BY total_points DESC 
LIMIT 10;
