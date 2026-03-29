-- ============================================================================
-- BACKFILL MISSING USERS (FIXED - Handles Duplicate Emails)
-- ============================================================================
-- This script creates user profiles for existing Supabase Auth users
-- who don't have a corresponding row in the 'users' table
-- FIXED: Handles cases where multiple auth users have the same email
-- ============================================================================

-- Step 1: Check how many users are missing
SELECT 
  COUNT(*) as missing_users,
  'Users in Auth but not in users table' as description
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 2: Show which users are missing (for verification)
SELECT 
  au.id,
  au.email,
  au.phone,
  au.created_at,
  au.raw_user_meta_data->>'firstName' as first_name,
  au.raw_user_meta_data->>'lastName' as last_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = au.email) 
    THEN '⚠️ Email exists in users table'
    ELSE '✅ Can be inserted'
  END as status
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 3: Create profiles for missing users
-- FIXED: Use ON CONFLICT to handle duplicate emails
INSERT INTO public.users (
  id,
  email,
  phone,
  first_name,
  last_name,
  wallet_balance,
  created_at,
  updated_at
)
SELECT 
  au.id,
  -- Handle duplicate emails by appending auth user ID
  CASE 
    WHEN EXISTS (SELECT 1 FROM public.users WHERE email = au.email)
    THEN au.email || '+' || SUBSTRING(au.id::text, 1, 8)
    ELSE au.email
  END as email,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'lastName', ''),
  0.00,  -- Initialize wallet balance to 0
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;  -- Skip if ID already exists

-- Step 4: Verify all users now have profiles
SELECT 
  COUNT(*) as total_auth_users,
  'Total users in Supabase Auth' as description
FROM auth.users;

SELECT 
  COUNT(*) as total_db_users,
  'Total users in users table' as description
FROM public.users;

-- Step 5: Check if any users are still missing (should be 0)
SELECT 
  COUNT(*) as still_missing,
  'Users still missing from users table (should be 0)' as description
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 6: Show users with modified emails (if any)
SELECT 
  id,
  email,
  'Email was modified to avoid duplicate' as note
FROM public.users
WHERE email LIKE '%+%'
ORDER BY created_at DESC;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If "still_missing" shows 0, all users have been backfilled successfully!
-- The counts for auth_users and db_users should now match.
-- 
-- NOTE: Some users may have modified emails (with +userid suffix) to avoid
-- duplicate email conflicts. This is normal and won't affect authentication
-- since Supabase Auth uses the user ID, not email, for identification.
-- ============================================================================
