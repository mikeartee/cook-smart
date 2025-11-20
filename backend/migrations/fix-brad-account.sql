-- Fix Brad's account - set email_verified to true
UPDATE users 
SET email_verified = true
WHERE email = 'bradturnbough80@gmail.com';

-- Verify the fix
SELECT id, email, first_name, is_creator, has_lifetime_subscription, 
       subscription_status, email_verified
FROM users 
WHERE email = 'bradturnbough80@gmail.com';
