-- ============================================================================
-- FIX USERS TABLE - CORRECT UUID HANDLING
-- ============================================================================
-- The id column is UUID type (not text!)
-- So we DON'T cast auth.uid() - we use it directly
-- ============================================================================

-- STEP 1: Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Create own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

-- STEP 3: Create new policies (id is UUID, so no casting needed)
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- STEP 4: Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- STEP 5: Verify
SELECT 
    'SUCCESS!' as status,
    policyname, 
    cmd 
FROM pg_policies 
WHERE tablename = 'users' 
ORDER BY policyname;
