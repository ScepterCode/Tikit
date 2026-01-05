-- Manually confirm the specific user who just registered
-- Replace 'scepterboss@gmail.com' with the actual email if different

UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'scepterboss@gmail.com' 
AND email_confirmed_at IS NULL;