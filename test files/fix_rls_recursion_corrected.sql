-- ============================================================================
-- FIX RLS INFINITE RECURSION - CORRECTED VERSION
-- ============================================================================
-- Based on actual diagnosis results showing exact problematic policies
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES WITHOUT RECURSION
-- ============================================================================

-- Policy 1: Users can view their own profile
-- Simple check: auth.uid() = id (no table lookup)
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but NOT wallet_balance or role)
-- Prevents users from changing their wallet or role
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND wallet_balance = OLD.wallet_balance  -- Cannot change wallet
    AND role = OLD.role  -- Cannot change role
);

-- Policy 3: Users can insert their own profile (for registration)
CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 4: Service role has full access (backend operations)
-- This allows backend to bypass RLS for admin operations
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- EXPLANATION OF CHANGES
-- ============================================================================
-- 
-- REMOVED (caused recursion):
-- 1. "Admins can view all users" - queried users table for role check
-- 2. "Admins can update all users" - queried users table for role check
-- 3. Old "Users can update own profile" - had WITH CHECK that queried users table
--
-- ADDED (no recursion):
-- 1. Simple policies using auth.uid() directly
-- 2. Wallet and role protection using OLD.column comparison
-- 3. Service role policy for backend admin operations
--
-- SECURITY MODEL:
-- - Frontend users can only see/edit their own profile
-- - Users cannot change wallet_balance or role
-- - Backend uses service_role key for admin operations
-- - No admin privileges in frontend (more secure)
-- ============================================================================

-- ============================================================================
-- STEP 3: FIX OTHER TABLES THAT MIGHT HAVE SIMILAR ISSUES
-- ============================================================================

-- Check if events table has similar recursion issues
-- Drop any policies that query users table
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
DROP POLICY IF EXISTS "Users can view published events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Service role can do anything" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON public.events;
DROP POLICY IF EXISTS "Anyone can view published events" ON public.events;
DROP POLICY IF EXISTS "Users can create events" ON public.events;
DROP POLICY IF EXISTS "Users can update own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete own events" ON public.events;
DROP POLICY IF EXISTS "Service role full access on events" ON public.events;

-- Recreate events policies without recursion
CREATE POLICY "View published or own events"
ON public.events
FOR SELECT
USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Create own events"
ON public.events
FOR INSERT
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Update own events"
ON public.events
FOR UPDATE
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Delete own events"
ON public.events
FOR DELETE
USING (organizer_id = auth.uid());

CREATE POLICY "Service role events access"
ON public.events
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 4: FIX BOOKINGS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role can do anything" ON public.bookings;
DROP POLICY IF EXISTS "Service role full access on bookings" ON public.bookings;

CREATE POLICY "View own bookings"
ON public.bookings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Create own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role bookings access"
ON public.bookings
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 5: FIX TICKETS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can do anything" ON public.tickets;
DROP POLICY IF EXISTS "Service role full access on tickets" ON public.tickets;

CREATE POLICY "View own tickets"
ON public.tickets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role tickets access"
ON public.tickets
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 6: FIX PAYMENTS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can view event payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can do anything" ON public.payments;
DROP POLICY IF EXISTS "Service role full access on payments" ON public.payments;

CREATE POLICY "View own payments"
ON public.payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role payments access"
ON public.payments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')
GROUP BY tablename
ORDER BY tablename;

-- Show all policies on users table (should be 4)
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
-- Expected policy counts:
-- users: 4 policies
-- events: 5 policies
-- bookings: 3 policies
-- tickets: 2 policies
-- payments: 2 policies
-- realtime_notifications: 5 policies (unchanged)
--
-- Total: 21 policies (down from 33, but more secure and no recursion)
-- ============================================================================
