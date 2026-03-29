-- ============================================================================
-- DIAGNOSE DUPLICATE EMAILS
-- ============================================================================
-- This script helps understand why there are duplicate emails
-- ============================================================================

-- Step 1: Find duplicate emails in Auth
SELECT 
  email,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ') as user_ids,
  'Duplicate emails in Auth' as issue
FROM auth.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- Step 2: Find which auth users are missing from users table
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  au.phone as auth_phone,
  au.created_at as auth_created,
  u.id as db_id,
  u.email as db_email,
  CASE 
    WHEN u.id IS NULL THEN '❌ Missing from users table'
    WHEN u.id = au.id THEN '✅ Correctly linked'
    ELSE '⚠️ ID mismatch'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
ORDER BY au.created_at DESC;

-- Step 3: Check if email is unique constraint in users table
SELECT 
  constraint_name,
  table_name,
  column_name
FROM information_schema.constraint_column_usage
WHERE table_name = 'users' AND column_name = 'email';

-- Step 4: Find the specific duplicate causing the error
SELECT 
  au.id as auth_user_id,
  au.email as auth_email,
  au.created_at as auth_created,
  u.id as existing_db_user_id,
  u.email as existing_db_email,
  u.created_at as db_created,
  'This auth user cannot be inserted because email already exists in DB' as issue
FROM auth.users au
INNER JOIN public.users u ON au.email = u.email
LEFT JOIN public.users u2 ON au.id = u2.id
WHERE u2.id IS NULL  -- Auth user not in users table
  AND au.email = 'scepterboss@gmail.com';

-- Step 5: Show all scepterboss@gmail.com accounts
SELECT 
  'AUTH' as source,
  id,
  email,
  phone,
  created_at,
  email_confirmed_at
FROM auth.users
WHERE email = 'scepterboss@gmail.com'
UNION ALL
SELECT 
  'DATABASE' as source,
  id,
  email,
  phone,
  created_at::timestamptz,
  NULL as email_confirmed_at
FROM public.users
WHERE email = 'scepterboss@gmail.com'
ORDER BY created_at;

-- ============================================================================
-- EXPLANATION
-- ============================================================================
-- The error occurs because:
-- 1. There are multiple auth users with email "scepterboss@gmail.com"
-- 2. One of them already has a profile in the users table
-- 3. When trying to insert another auth user with the same email, it fails
--    because the users table has a UNIQUE constraint on the email column
--
-- SOLUTION: Use the fixed backfill script that handles duplicate emails
-- ============================================================================
