-- ============================================================================
-- RLS IMPLEMENTATION VERIFICATION SCRIPT
-- ============================================================================
-- Run this AFTER running setup_proper_users_table.sql and PHASE1_CRITICAL_SECURITY_RLS.sql
-- This will verify that RLS is properly configured
-- ============================================================================

-- ============================================================================
-- CHECK 1: Verify RLS is enabled on all critical tables
-- ============================================================================
SELECT 
  '✅ CHECK 1: RLS Enabled Status' as check_name,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ ENABLED'
    ELSE '❌ NOT ENABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')
ORDER BY tablename;

-- Expected: All 6 tables should show "✅ ENABLED"

-- ============================================================================
-- CHECK 2: Count policies per table
-- ============================================================================
SELECT 
  '✅ CHECK 2: Policy Count' as check_name,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN tablename = 'users' AND COUNT(*) = 5 THEN '✅ CORRECT'
    WHEN tablename = 'events' AND COUNT(*) = 8 THEN '✅ CORRECT'
    WHEN tablename = 'bookings' AND COUNT(*) = 5 THEN '✅ CORRECT'
    WHEN tablename = 'tickets' AND COUNT(*) = 5 THEN '✅ CORRECT'
    WHEN tablename = 'payments' AND COUNT(*) = 3 THEN '✅ CORRECT'
    WHEN tablename = 'realtime_notifications' AND COUNT(*) = 3 THEN '✅ CORRECT'
    ELSE '⚠️ UNEXPECTED COUNT'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')
GROUP BY tablename
ORDER BY tablename;

-- Expected policy counts:
-- users: 5 policies
-- events: 8 policies
-- bookings: 5 policies
-- tickets: 5 policies
-- payments: 3 policies
-- realtime_notifications: 3 policies
-- TOTAL: 29 policies

-- ============================================================================
-- CHECK 3: Verify users table has role column
-- ============================================================================
SELECT 
  '✅ CHECK 3: Users Table Columns' as check_name,
  column_name,
  data_type,
  CASE 
    WHEN column_name = 'role' THEN '✅ ROLE COLUMN EXISTS'
    WHEN column_name = 'wallet_balance' THEN '✅ WALLET COLUMN EXISTS'
    WHEN column_name = 'organization_name' THEN '✅ ORG NAME EXISTS'
    ELSE '✅ EXISTS'
  END as status
FROM information_schema.columns
WHERE table_name = 'users' 
  AND table_schema = 'public'
  AND column_name IN ('role', 'wallet_balance', 'organization_name', 'organization_type', 'state', 'is_verified', 'referral_code')
ORDER BY column_name;

-- Expected: All 7 columns should be listed

-- ============================================================================
-- CHECK 4: Verify all users have roles assigned
-- ============================================================================
SELECT 
  '✅ CHECK 4: User Roles Distribution' as check_name,
  role,
  COUNT(*) as user_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.users
GROUP BY role
ORDER BY user_count DESC;

-- Expected: All users should have a role (admin, organizer, or attendee)
-- No NULL roles should exist

-- ============================================================================
-- CHECK 5: Verify role constraint is working
-- ============================================================================
SELECT 
  '✅ CHECK 5: Role Constraint' as check_name,
  cc.constraint_name,
  cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.constraint_column_usage ccu 
  ON cc.constraint_name = ccu.constraint_name
WHERE cc.constraint_schema = 'public'
  AND cc.constraint_name LIKE '%role%'
  AND ccu.table_name = 'users';

-- Expected: Should show CHECK constraint limiting role to admin/organizer/attendee

-- ============================================================================
-- CHECK 6: List all policies for review
-- ============================================================================
SELECT 
  '✅ CHECK 6: All Policies' as check_name,
  tablename,
  policyname,
  cmd as command_type,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_status,
  CASE 
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as check_status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')
ORDER BY tablename, policyname;

-- Expected: 29 policies total across 6 tables

-- ============================================================================
-- CHECK 7: Verify trigger exists for new users
-- ============================================================================
SELECT 
  '✅ CHECK 7: User Creation Trigger' as check_name,
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users'
  AND trigger_schema = 'auth'
  AND trigger_name LIKE '%new_user%';

-- Expected: Should show handle_new_user trigger

-- ============================================================================
-- CHECK 8: Test users with specific roles
-- ============================================================================
SELECT 
  '✅ CHECK 8: Sample Users by Role' as check_name,
  role,
  email,
  organization_name,
  wallet_balance,
  is_verified
FROM public.users
WHERE role IN ('admin', 'organizer')
ORDER BY role, email;

-- Expected: Should show any admin or organizer users

-- ============================================================================
-- CHECK 9: Verify no users with NULL roles
-- ============================================================================
SELECT 
  '✅ CHECK 9: Users with NULL roles' as check_name,
  COUNT(*) as null_role_count,
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ NO NULL ROLES (GOOD)'
    ELSE '❌ FOUND NULL ROLES (BAD)'
  END as status
FROM public.users
WHERE role IS NULL;

-- Expected: 0 users with NULL roles

-- ============================================================================
-- CHECK 10: Summary Report
-- ============================================================================
SELECT 
  '✅ SUMMARY REPORT' as report_name,
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications') AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('users', 'events', 'bookings', 'tickets', 'payments', 'realtime_notifications')) as total_policies,
  (SELECT COUNT(*) FROM public.users) as total_users,
  (SELECT COUNT(*) FROM public.users WHERE role IS NOT NULL) as users_with_roles,
  (SELECT COUNT(*) FROM public.users WHERE role = 'admin') as admin_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'organizer') as organizer_count,
  (SELECT COUNT(*) FROM public.users WHERE role = 'attendee') as attendee_count;

-- Expected:
-- tables_with_rls: 6
-- total_policies: 29
-- total_users: 16 (or your actual count)
-- users_with_roles: 16 (should equal total_users)
-- admin_count: 1+ (at least one admin)
-- organizer_count: 1+ (at least one organizer)
-- attendee_count: remaining users

-- ============================================================================
-- ✅ SUCCESS CRITERIA
-- ============================================================================
-- If all checks pass, you should see:
-- 1. ✅ 6 tables with RLS enabled
-- 2. ✅ 29 total policies created
-- 3. ✅ All users have roles (no NULL)
-- 4. ✅ Role constraint exists
-- 5. ✅ Trigger exists for new users
-- 6. ✅ At least one admin and one organizer
--
-- If any check fails, review the output and fix the issue before proceeding.
-- ============================================================================
