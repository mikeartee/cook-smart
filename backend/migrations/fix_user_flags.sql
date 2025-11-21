-- Fix user flags to match correct roles
-- Brad = Developer (no special flags, just lifetime subscription)
-- Briana = Creator (is_creator = true)
-- Donna = Special User (is_special_user = true)

-- Fix Brad's account - remove is_creator flag
UPDATE users 
SET is_creator = false,
    is_co_founder = false,
    is_special_user = false,
    has_lifetime_subscription = true
WHERE email = 'bradturnbough80@gmail.com';

-- Fix Briana's account - set is_creator flag
UPDATE users 
SET is_creator = true,
    is_co_founder = false,
    is_special_user = false,
    has_lifetime_subscription = true
WHERE email = 'brianaolszewski1@gmail.com';

-- Fix Donna's account - set is_special_user flag
UPDATE users 
SET is_creator = false,
    is_co_founder = false,
    is_special_user = true,
    has_lifetime_subscription = true
WHERE email = 'dwoodswoods2@gmail.com';

-- Verify the changes
SELECT email, is_creator, is_co_founder, is_special_user, has_lifetime_subscription 
FROM users 
WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
ORDER BY email;
