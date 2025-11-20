SELECT email, 
       substring(password_hash, 1, 30) as hash_preview,
       length(password_hash) as hash_length
FROM users 
WHERE email = 'bradturnbough80@gmail.com';
