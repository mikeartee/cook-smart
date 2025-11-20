-- Set special user flags for Briana and Mom

-- Update Briana as co-founder
UPDATE users 
SET is_co_founder = true 
WHERE email ILIKE '%briana%' OR first_name ILIKE '%briana%';

-- Update Mom as special user  
UPDATE users 
SET is_special_user = true 
WHERE email ILIKE '%mom%' OR first_name ILIKE '%mom%' OR first_name ILIKE '%mother%';

-- Show updated users
SELECT id, email, first_name, last_name, is_co_founder, is_special_user 
FROM users 
WHERE is_co_founder = true OR is_special_user = true;
