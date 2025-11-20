-- Check Brad, Briana, and Mom's accounts
SELECT 
    email,
    first_name,
    is_co_founder,
    is_special_user,
    is_creator,
    has_lifetime_subscription,
    subscription_status,
    subscription_expires_at
FROM users 
WHERE email IN (
    'bradturnbough80@gmail.com',
    'brianaolszewski1@gmail.com',
    'dwoodswoods2@gmail.com'
)
ORDER BY email;
