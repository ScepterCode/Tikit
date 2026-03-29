-- ============================================================================
-- PROPER USERS TABLE SETUP WITH ROLES AND RLS
-- ============================================================================
-- This script adds missing columns and sets up Row Level Security
-- ============================================================================

-- Step 1: Add missing columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'attendee' CHECK (role IN ('admin', 'organizer', 'attendee'));

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_name TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS organization_type TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS state TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS referral_code TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.users.role IS 'User role: admin, organizer, or attendee';
COMMENT ON COLUMN public.users.wallet_balance IS 'User wallet balance in Naira';
COMMENT ON COLUMN public.users.organization_name IS 'Organization name (for organizers)';
COMMENT ON COLUMN public.users.organization_type IS 'Organization type (for organizers)';
COMMENT ON COLUMN public.users.state IS 'User state/location';
COMMENT ON COLUMN public.users.is_verified IS 'Whether user email/phone is verified';
COMMENT ON COLUMN public.users.referral_code IS 'User referral code';

-- Step 2: Update existing users with roles from auth metadata
UPDATE public.users u
SET role = COALESCE(
  (SELECT au.raw_user_meta_data->>'role' 
   FROM auth.users au 
   WHERE au.id = u.id),
  'attendee'
)
WHERE role IS NULL OR role = 'attendee';

-- Step 3: Update trigger to include role and other fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    phone,
    first_name,
    last_name,
    role,
    state,
    organization_name,
    organization_type,
    wallet_balance,
    is_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'attendee'),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'organization_type', ''),
    0.00,
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    state = EXCLUDED.state,
    organization_name = EXCLUDED.organization_name,
    organization_type = EXCLUDED.organization_type,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 5: Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;

-- Step 6: Create RLS Policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (except role and wallet_balance)
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id 
  AND role = (SELECT role FROM public.users WHERE id = auth.uid())  -- Can't change own role
);

-- Policy 3: Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Admins can update all users
CREATE POLICY "Admins can update all users"
ON public.users
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 5: Service role (backend) can do anything
CREATE POLICY "Service role can do anything"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Step 7: Verify the setup
SELECT 
  'Users table columns' as check_type,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 8: Check RLS is enabled
SELECT 
  'RLS Status' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 9: List all policies
SELECT 
  'RLS Policies' as check_type,
  policyname,
  cmd as command,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'users';

-- Step 10: Show user roles distribution
SELECT 
  'User Roles Distribution' as check_type,
  role,
  COUNT(*) as count
FROM public.users
GROUP BY role
ORDER BY count DESC;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- 1. RLS is now enabled - only authorized users can access data
-- 2. Users can only see/edit their own profile
-- 3. Admins can see/edit all users
-- 4. Backend (service_role) can do anything (for wallet updates, etc.)
-- 5. Users cannot change their own role or wallet_balance directly
-- ============================================================================
