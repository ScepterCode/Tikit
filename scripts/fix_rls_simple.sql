-- ============================================================================
-- FIX RLS INFINITE RECURSION - SIMPLE VERSION
-- ============================================================================
-- Removes all policies that cause recursion
-- Creates simple policies without any table lookups
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

-- ============================================================================
-- STEP 2: CREATE SIMPLE POLICIES FOR USERS TABLE
-- ============================================================================

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can insert their own profile (for registration)
CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy 3: Service role has full access (backend operations)
-- This is the ONLY way to update wallet_balance and role
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- NOTE: We removed UPDATE policy for regular users
-- Users cannot update their profiles directly from frontend
-- All updates must go through backend API which uses service_role

-- ============================================================================
-- STEP 3: FIX EVENTS TABLE
-- ============================================================================

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
DROP POLICY IF EXISTS "View published or own events" ON public.events;
DROP POLICY IF EXISTS "Create own events" ON public.events;
DROP POLICY IF EXISTS "Update own events" ON public.events;
DROP POLICY IF EXISTS "Delete own events" ON public.events;
DROP POLICY IF EXISTS "Service role events access" ON public.events;

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
DROP POLICY IF EXISTS "View own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Create own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role bookings access" ON public.bookings;

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
DROP POLICY IF EXISTS "View own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role tickets access" ON public.tickets;

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
DROP POLICY IF EXISTS "View own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role payments access" ON public.payments;

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

-- Show all policies on users table
SELECT 
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- Expected policy counts:
-- users: 3 policies (SELECT, INSERT, ALL for service_role)
-- events: 5 policies
-- bookings: 3 policies
-- tickets: 2 policies
-- payments: 2 policies
-- realtime_notifications: 5 policies (unchanged)
--
-- Total: 20 policies
--
-- IMPORTANT NOTES:
-- 1. Users can only VIEW their profiles (no UPDATE from frontend)
-- 2. All profile updates must go through backend API
-- 3. Backend uses service_role key to update wallet_balance and role
-- 4. This is MORE secure - no way for users to tamper with data
-- ============================================================================
