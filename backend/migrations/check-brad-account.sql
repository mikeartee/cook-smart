SELECT id, email, first_name, is_creator, has_lifetime_subscription, 
       subscription_status, email_verified, password_hash IS NOT NULL as has_password
FROM users 
WHERE email = 'bradturnbough80@gmail.com';
