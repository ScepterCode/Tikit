-- ============================================================================
-- DIAGNOSE RLS INFINITE RECURSION ISSUE
-- ============================================================================

-- Check all policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- Check if there are any circular dependencies
-- The issue is likely in the USING clause that references the same table
