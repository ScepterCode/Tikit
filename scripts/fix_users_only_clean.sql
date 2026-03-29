-- ============================================================================
-- FIX USERS TABLE ONLY - ULTRA CLEAN VERSION
-- ============================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Create own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- Create 3 simple policies
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid()::text = id);

CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Show result
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'users' ORDER BY policyname;
