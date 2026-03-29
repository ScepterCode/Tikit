-- ============================================================================
-- FIX USERS TABLE RLS RECURSION - MINIMAL FIX
-- ============================================================================
-- This script ONLY fixes the users table recursion issue
-- We'll handle other tables separately after checking their actual schema
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Create own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- ============================================================================
-- STEP 2: CREATE SIMPLE POLICIES FOR USERS TABLE
-- ============================================================================

-- Policy 1: Users can view their own profile
-- Simple check: auth.uid() = id (no table lookup, no recursion)
-- Cast auth.uid() to text to match id column type
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = id);

-- Policy 2: Users can insert their own profile (for registration)
CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid()::text = id);

-- Policy 3: Service role has full access (backend operations)
-- This is the ONLY way to update wallet_balance and role
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Show all policies on users table
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- Expected: 3 policies on users table
-- 1. Users can view own profile (SELECT)
-- 2. Users can create own profile (INSERT)
-- 3. Service role full access (ALL)
--
-- This fixes the recursion issue on users table
-- Other tables will be handled separately
-- ============================================================================
