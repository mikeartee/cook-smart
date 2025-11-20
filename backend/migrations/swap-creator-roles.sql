-- Swap roles: Brad = Developer, Briana = Creator
-- Brad should be is_creator (developer)
-- Briana should be is_co_founder (creator of the idea)

-- Update Brad - keep is_creator, remove is_co_founder
UPDATE users 
SET 
    is_creator = true,
    is_co_founder = false
WHERE email = 'bradturnbough80@gmail.com';

-- Update Briana - keep is_co_founder, add is_creator for "Creator" title
UPDATE users 
SET 
    is_co_founder = true,
    is_creator = false
WHERE email = 'brianaolszewski1@gmail.com';

-- Verify the changes
SELECT 
    email,
    first_name,
    is_co_founder,
    is_creator,
    has_lifetime_subscription,
    subscription_status
FROM users 
WHERE email IN (
    'bradturnbough80@gmail.com',
    'brianaolszewski1@gmail.com',
    'dwoodswoods2@gmail.com'
)
ORDER BY email;
