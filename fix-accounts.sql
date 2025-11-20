-- Fix admin accounts with correct information

-- Brad Turnbough - Creator & Co-founder
UPDATE users 
SET 
  first_name = 'Brad',
  last_name = 'Turnbough',
  is_co_founder = true,
  is_special_user = true,
  is_creator = true,
  has_lifetime_subscription = true,
  subscription_status = 'lifetime'
WHERE email = 'bradturnbough80@gmail.com';

-- Briana Olszewski - Co-founder
UPDATE users 
SET 
  first_name = 'Briana',
  last_name = 'Olszewski',
  is_co_founder = true,
  is_special_user = true,
  is_creator = false,
  has_lifetime_subscription = true,
  subscription_status = 'lifetime'
WHERE email = 'brianaolszewski1@gmail.com';

-- Donna Woods - Special user (Briana's mom)
UPDATE users 
SET 
  first_name = 'Donna',
  last_name = 'Woods',
  is_co_founder = false,
  is_special_user = true,
  is_creator = false,
  has_lifetime_subscription = true,
  subscription_status = 'lifetime'
WHERE email = 'dwoodswoods2@gmail.com';

-- Verify
SELECT email, first_name, last_name, is_co_founder, is_special_user, is_creator, has_lifetime_subscription
FROM users 
WHERE email IN ('bradturnbough80@gmail.com', 'brianaolszewski1@gmail.com', 'dwoodswoods2@gmail.com')
ORDER BY email;
