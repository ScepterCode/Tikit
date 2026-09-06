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
--
-- Reads BOTH key casings: the frontend's signUp() writes snake_case, older
-- accounts used camelCase. The previous version of this script read only
-- camelCase and never copied `role`, so every backfilled organizer came out
-- as an attendee with a blank name.
--
-- `role` is whitelisted for the same reason it is in the trigger: signUp()
-- metadata is attacker-controlled, so only self-service roles are honoured.
INSERT INTO public.users (
  id,
  email,
  phone_number,
  first_name,
  last_name,
  state,
  role,
  organization_name,
  organization_type,
  wallet_balance,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'phone_number', au.raw_user_meta_data->>'phoneNumber', au.phone),
  COALESCE(au.raw_user_meta_data->>'first_name',   au.raw_user_meta_data->>'firstName', ''),
  COALESCE(au.raw_user_meta_data->>'last_name',    au.raw_user_meta_data->>'lastName',  ''),
  COALESCE(au.raw_user_meta_data->>'state',        au.raw_user_meta_data->>'stateOfResidence'),
  CASE
    WHEN lower(COALESCE(au.raw_user_meta_data->>'role', '')) IN ('attendee', 'organizer')
      THEN lower(au.raw_user_meta_data->>'role')
    ELSE 'attendee'
  END,
  COALESCE(au.raw_user_meta_data->>'organization_name', au.raw_user_meta_data->>'organizationName'),
  COALESCE(au.raw_user_meta_data->>'organization_type', au.raw_user_meta_data->>'organizationType'),
  0.00,  -- balances live in the wallet tables, never seeded from a token
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL;

-- Step 3b: Repair rows an earlier run of this script created with a blank
-- name / demoted role. Only touches rows that are actually empty.
UPDATE public.users u
SET
  first_name = COALESCE(NULLIF(u.first_name, ''), au.raw_user_meta_data->>'first_name', au.raw_user_meta_data->>'firstName'),
  last_name  = COALESCE(NULLIF(u.last_name,  ''), au.raw_user_meta_data->>'last_name',  au.raw_user_meta_data->>'lastName'),
  role       = CASE
                 WHEN u.role IS DISTINCT FROM 'admin'
                  AND lower(COALESCE(au.raw_user_meta_data->>'role', '')) = 'organizer'
                   THEN 'organizer'
                 ELSE COALESCE(u.role, 'attendee')
               END,
  updated_at = NOW()
FROM auth.users au
WHERE au.id = u.id
  AND (u.first_name IS NULL OR u.first_name = ''
       OR u.role IS NULL
       OR (u.role = 'attendee' AND lower(COALESCE(au.raw_user_meta_data->>'role','')) = 'organizer'));

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
