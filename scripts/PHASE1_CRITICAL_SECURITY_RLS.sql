-- ============================================================================
-- PHASE 1: CRITICAL SECURITY - ENABLE RLS ON ALL TABLES
-- ============================================================================
-- This script enables Row Level Security on all user-facing tables
-- Run this FIRST before any other migrations
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON CRITICAL TABLES
-- ============================================================================

-- Users table (already done in setup_proper_users_table.sql, but ensuring)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Bookings table
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Tickets table
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Payments table
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Realtime notifications table
ALTER TABLE public.realtime_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: CREATE RLS POLICIES FOR EVENTS
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public can view published events" ON public.events;
DROP POLICY IF EXISTS "Organizers can view own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can update own events" ON public.events;
DROP POLICY IF EXISTS "Organizers can delete own events" ON public.events;
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
DROP POLICY IF EXISTS "Admins can manage all events" ON public.events;
DROP POLICY IF EXISTS "Service role can do anything" ON public.events;

-- Policy 1: Public can view published events
CREATE POLICY "Public can view published events"
ON public.events
FOR SELECT
USING (status = 'published' OR status = 'active');

-- Policy 2: Organizers can view their own events (all statuses)
CREATE POLICY "Organizers can view own events"
ON public.events
FOR SELECT
USING (host_id = auth.uid());

-- Policy 3: Organizers can update their own events
CREATE POLICY "Organizers can update own events"
ON public.events
FOR UPDATE
USING (host_id = auth.uid())
WITH CHECK (host_id = auth.uid());

-- Policy 4: Organizers can delete their own events
CREATE POLICY "Organizers can delete own events"
ON public.events
FOR DELETE
USING (host_id = auth.uid());

-- Policy 5: Organizers can create events
CREATE POLICY "Organizers can create events"
ON public.events
FOR INSERT
WITH CHECK (
  host_id = auth.uid() 
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role IN ('organizer', 'admin')
  )
);

-- Policy 6: Admins can view all events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 7: Admins can manage all events
CREATE POLICY "Admins can manage all events"
ON public.events
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 8: Service role can do anything
CREATE POLICY "Service role can do anything on events"
ON public.events
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 3: CREATE RLS POLICIES FOR BOOKINGS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Organizers can view event bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Service role can do anything on bookings" ON public.bookings;

-- Policy 1: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
ON public.bookings
FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Users can create bookings
CREATE POLICY "Users can create bookings"
ON public.bookings
FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Policy 3: Organizers can view bookings for their events
CREATE POLICY "Organizers can view event bookings"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = bookings.event_id
    AND events.host_id = auth.uid()
  )
);

-- Policy 4: Admins can view all bookings
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 5: Service role can do anything
CREATE POLICY "Service role can do anything on bookings"
ON public.bookings
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 4: CREATE RLS POLICIES FOR TICKETS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can do anything on tickets" ON public.tickets;

-- Policy 1: Users can view their own tickets
CREATE POLICY "Users can view own tickets"
ON public.tickets
FOR SELECT
USING (user_id = auth.uid());

-- Policy 2: Organizers can view tickets for their events (for scanning)
CREATE POLICY "Organizers can view event tickets"
ON public.tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tickets.event_id
    AND events.host_id = auth.uid()
  )
);

-- Policy 3: Organizers can update tickets for their events (check-in)
CREATE POLICY "Organizers can update event tickets"
ON public.tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.events
    WHERE events.id = tickets.event_id
    AND events.host_id = auth.uid()
  )
);

-- Policy 4: Admins can manage all tickets
CREATE POLICY "Admins can manage all tickets"
ON public.tickets
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 5: Service role can do anything
CREATE POLICY "Service role can do anything on tickets"
ON public.tickets
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES FOR PAYMENTS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can do anything on payments" ON public.payments;

-- Policy 1: Users can view their own payments
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
USING (user_id::uuid = auth.uid());  -- Cast text to uuid

-- Policy 2: Admins can view all payments
CREATE POLICY "Admins can view all payments"
ON public.payments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 3: Service role can do anything
CREATE POLICY "Service role can do anything on payments"
ON public.payments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 6: CREATE RLS POLICIES FOR REALTIME NOTIFICATIONS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.realtime_notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.realtime_notifications;
DROP POLICY IF EXISTS "Service role can do anything on notifications" ON public.realtime_notifications;

-- Policy 1: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
ON public.realtime_notifications
FOR SELECT
USING (user_id::uuid = auth.uid());  -- Cast text to uuid

-- Policy 2: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
ON public.realtime_notifications
FOR UPDATE
USING (user_id::uuid = auth.uid())
WITH CHECK (user_id::uuid = auth.uid());

-- Policy 3: Service role can do anything
CREATE POLICY "Service role can do anything on notifications"
ON public.realtime_notifications
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 7: VERIFY RLS IS ENABLED
-- ============================================================================

SELECT 
  'RLS Status Check' as check_type,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')
ORDER BY tablename;

-- ============================================================================
-- STEP 8: COUNT POLICIES PER TABLE
-- ============================================================================

SELECT 
  'Policy Count' as check_type,
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
-- If you see RLS enabled for all 6 tables and policies created, Phase 1 is complete!
-- 
-- Expected policy counts:
-- - users: 5 policies (from setup_proper_users_table.sql)
-- - events: 8 policies
-- - bookings: 5 policies
-- - tickets: 5 policies
-- - payments: 3 policies
-- - realtime_notifications: 3 policies
--
-- TOTAL: 29 policies protecting your data
-- ============================================================================
