-- ============================================================================
-- FIX RLS INFINITE RECURSION ISSUE
-- ============================================================================
-- The issue: Policies on users table are causing infinite recursion
-- Root cause: Policies that check user role by querying the users table itself
-- Solution: Use auth.jwt() claims instead of querying the users table
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES ON USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Prevent wallet tampering" ON public.users;

-- ============================================================================
-- STEP 2: CREATE NEW POLICIES WITHOUT RECURSION
-- ============================================================================
-- Key change: Use auth.uid() directly instead of querying users table for role

-- Policy 1: Users can view their own profile
-- Uses auth.uid() which comes from JWT, no table lookup needed
CREATE POLICY "Users can view own profile"
ON public.users
FOR SELECT
USING (auth.uid() = id);

-- Policy 2: Users can update their own profile (but NOT wallet_balance)
-- Uses auth.uid() directly, restricts wallet_balance updates
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND (
        -- Allow updates to these fields only
        (NEW.wallet_balance = OLD.wallet_balance) OR
        -- Service role can update wallet
        (auth.jwt()->>'role' = 'service_role')
    )
);

-- Policy 3: Service role can do anything (backend operations)
-- This allows backend to bypass RLS for admin operations
CREATE POLICY "Service role full access"
ON public.users
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Policy 4: Users can insert their own profile (for registration)
CREATE POLICY "Users can create own profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STEP 3: VERIFY NO RECURSION
-- ============================================================================

-- Test query (should not cause recursion)
-- SELECT * FROM users WHERE id = auth.uid();

-- ============================================================================
-- EXPLANATION OF THE FIX
-- ============================================================================
-- 
-- BEFORE (CAUSED RECURSION):
-- CREATE POLICY "Admins can view all"
-- USING (
--     (SELECT role FROM users WHERE id = auth.uid()) = 'admin'  -- ❌ RECURSION!
-- );
-- 
-- This caused recursion because:
-- 1. User tries to SELECT from users table
-- 2. Policy checks: "Is user an admin?"
-- 3. To check admin, it queries users table again
-- 4. That query triggers the policy again
-- 5. Infinite loop!
--
-- AFTER (NO RECURSION):
-- CREATE POLICY "Users can view own"
-- USING (auth.uid() = id);  -- ✅ NO RECURSION
--
-- This works because:
-- 1. auth.uid() comes from JWT token (no table lookup)
-- 2. No circular reference to users table
-- 3. Simple comparison, no recursion
--
-- For admin access, we rely on service_role key in backend
-- Frontend users can only see their own data
-- ============================================================================

-- ============================================================================
-- STEP 4: UPDATE OTHER TABLES TO AVOID RECURSION
-- ============================================================================

-- Events table - Fix policies that might check user role
DROP POLICY IF EXISTS "Organizers can create events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
DROP POLICY IF EXISTS "Users can view published events" ON public.events;
DROP POLICY IF EXISTS "Users can view own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Service role can do anything" ON public.events;
DROP POLICY IF EXISTS "Organizers can manage own events" ON public.events;

-- Recreate events policies without recursion
CREATE POLICY "Anyone can view published events"
ON public.events
FOR SELECT
USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Users can create events"
ON public.events
FOR INSERT
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Users can update own events"
ON public.events
FOR UPDATE
USING (organizer_id = auth.uid())
WITH CHECK (organizer_id = auth.uid());

CREATE POLICY "Users can delete own events"
ON public.events
FOR DELETE
USING (organizer_id = auth.uid());

CREATE POLICY "Service role full access on events"
ON public.events
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 5: FIX BOOKINGS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role can do anything" ON public.bookings;

CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role full access on bookings"
ON public.bookings
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 6: FIX TICKETS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can do anything" ON public.tickets;

CREATE POLICY "Users can view own tickets"
ON public.tickets
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role full access on tickets"
ON public.tickets
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 7: FIX PAYMENTS POLICIES
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can create payments" ON public.payments;
DROP POLICY IF EXISTS "Organizers can view event payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can do anything" ON public.payments;

CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Service role full access on payments"
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

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see policy counts and no errors, the recursion is fixed!
-- 
-- Key changes:
-- 1. Removed all policies that query users table for role checks
-- 2. Use auth.uid() directly (from JWT, no table lookup)
-- 3. Admin operations use service_role key in backend
-- 4. Frontend users can only access their own data
-- 
-- This is more secure and performant:
-- - No recursion issues
-- - Faster (no extra table lookups)
-- - Simpler policies (easier to maintain)
-- - Backend has full control via service_role
-- ============================================================================
