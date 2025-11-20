-- Fix Briana's co-founder account
UPDATE users 
SET 
    has_lifetime_subscription = true,
    subscription_status = 'lifetime',
    is_co_founder = true
WHERE email = 'brianaolszewski1@gmail.com';

-- Create or update Mom's special user account
INSERT INTO users (
    id, email, password_hash, first_name, last_name,
    is_special_user, has_lifetime_subscription, age_verified, email_verified,
    subscription_status
) VALUES (
    'user_mom_special_' || EXTRACT(EPOCH FROM NOW())::bigint,
    'dwoodswoods2@gmail.com',
    '$2b$10$defaulthashforspecialusers1234567890123456789012',
    'Mom',
    'Woods',
    true,
    true,
    true,
    true,
    'lifetime'
)
ON CONFLICT (email) DO UPDATE SET
    is_special_user = true,
    has_lifetime_subscription = true,
    subscription_status = 'lifetime',
    email_verified = true;

-- Verify all three accounts
SELECT 
    email,
    first_name,
    is_co_founder,
    is_special_user,
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
