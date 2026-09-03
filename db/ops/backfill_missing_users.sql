-- ============================================================================
-- BACKFILL MISSING USERS
-- ============================================================================
-- This script creates user profiles for all existing Supabase Auth users
-- who don't have a corresponding row in the 'users' table
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
  au.raw_user_meta_data->>'lastName' as last_name
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ORDER BY au.created_at DESC;

-- Step 3: Create profiles for missing users
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
  au.email,
  au.phone,
  COALESCE(au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'lastName', ''),
  0.00,  -- Initialize wallet balance to 0
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

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

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If "still_missing" shows 0, all users have been backfilled successfully!
-- The counts for auth_users and db_users should now match.
-- ============================================================================
