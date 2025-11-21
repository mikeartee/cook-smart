-- Fix special user flag for dwoodswoods2@gmail.com
-- This removes the special user flag from the account

UPDATE users 
SET is_special_user = false 
WHERE email = 'dwoodswoods2@gmail.com';

-- Verify the change
SELECT id, email, is_co_founder, is_special_user, has_lifetime_subscription 
FROM users 
WHERE email = 'dwoodswoods2@gmail.com';
