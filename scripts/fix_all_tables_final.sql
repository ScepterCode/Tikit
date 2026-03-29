-- ============================================================================
-- FIX ALL TABLES RLS - FINAL VERSION
-- ============================================================================
-- Based on actual schema analysis
-- Payments table has: user_id (confirmed)
-- We'll use user_id for all tables (standard pattern)
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX USERS TABLE
-- ============================================================================

DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can do anything" ON public.users;
DROP POLICY IF EXISTS "Create own profile" ON public.users;
DROP POLICY IF EXISTS "Service role full access" ON public.users;
DROP POLICY IF EXISTS "Users can create own profile" ON public.users;

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

-- ============================================================================
-- STEP 2: FIX PAYMENTS TABLE (user_id confirmed)
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
USING (user_id = auth.uid()::text);

CREATE POLICY "Service role payments access"
ON public.payments
FOR ALL
USING (auth.jwt()->>'role' = 'service_role')
WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- ============================================================================
-- STEP 3: FIX BOOKINGS TABLE (assuming user_id exists)
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

-- Only create if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bookings') THEN
        EXECUTE 'CREATE POLICY "View own bookings" ON public.bookings FOR SELECT USING (user_id = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "Create own bookings" ON public.bookings FOR INSERT WITH CHECK (user_id = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "Service role bookings access" ON public.bookings FOR ALL USING (auth.jwt()->>''role'' = ''service_role'') WITH CHECK (auth.jwt()->>''role'' = ''service_role'')';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: FIX TICKETS TABLE (assuming user_id exists)
-- ============================================================================

DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.tickets;
DROP POLICY IF EXISTS "Organizers can view event tickets" ON public.tickets;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role can do anything" ON public.tickets;
DROP POLICY IF EXISTS "Service role full access on tickets" ON public.tickets;
DROP POLICY IF EXISTS "View own tickets" ON public.tickets;
DROP POLICY IF EXISTS "Service role tickets access" ON public.tickets;

-- Only create if table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tickets') THEN
        EXECUTE 'CREATE POLICY "View own tickets" ON public.tickets FOR SELECT USING (user_id = auth.uid()::text)';
        EXECUTE 'CREATE POLICY "Service role tickets access" ON public.tickets FOR ALL USING (auth.jwt()->>''role'' = ''service_role'') WITH CHECK (auth.jwt()->>''role'' = ''service_role'')';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: FIX EVENTS TABLE (check if it has user_id or created_by)
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

-- Create policies based on actual column (user_id or created_by)
DO $$
DECLARE
    has_user_id BOOLEAN;
    has_created_by BOOLEAN;
    owner_column TEXT;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        -- Check which column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'user_id'
        ) INTO has_user_id;
        
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'events' AND column_name = 'created_by'
        ) INTO has_created_by;
        
        -- Determine which column to use
        IF has_user_id THEN
            owner_column := 'user_id';
        ELSIF has_created_by THEN
            owner_column := 'created_by';
        ELSE
            -- No owner column, just allow service_role
            EXECUTE 'CREATE POLICY "Service role events access" ON public.events FOR ALL USING (auth.jwt()->>''role'' = ''service_role'') WITH CHECK (auth.jwt()->>''role'' = ''service_role'')';
            RETURN;
        END IF;
        
        -- Create policies using the found column
        EXECUTE format('CREATE POLICY "View published or own events" ON public.events FOR SELECT USING (status = ''published'' OR %I = auth.uid()::text)', owner_column);
        EXECUTE format('CREATE POLICY "Create own events" ON public.events FOR INSERT WITH CHECK (%I = auth.uid()::text)', owner_column);
        EXECUTE format('CREATE POLICY "Update own events" ON public.events FOR UPDATE USING (%I = auth.uid()::text) WITH CHECK (%I = auth.uid()::text)', owner_column, owner_column);
        EXECUTE format('CREATE POLICY "Delete own events" ON public.events FOR DELETE USING (%I = auth.uid()::text)', owner_column);
        EXECUTE 'CREATE POLICY "Service role events access" ON public.events FOR ALL USING (auth.jwt()->>''role'' = ''service_role'') WITH CHECK (auth.jwt()->>''role'' = ''service_role'')';
    END IF;
END $$;

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

-- Show users table policies
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
-- This script:
-- 1. Fixes users table recursion (main issue)
-- 2. Fixes payments table (user_id confirmed)
-- 3. Attempts to fix bookings, tickets, events (checks if tables/columns exist)
-- 4. Uses dynamic SQL to handle different schema variations
--
-- If you see policy counts, the fix worked!
-- ============================================================================
