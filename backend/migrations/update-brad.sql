UPDATE users 
SET 
  is_creator = true,
  has_lifetime_subscription = true,
  subscription_status = 'lifetime'
WHERE email = 'bradturnbough80@gmail.com';

SELECT id, email, first_name, is_creator, has_lifetime_subscription, subscription_status
FROM users
WHERE email = 'bradturnbough80@gmail.com';
