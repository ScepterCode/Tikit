-- ============================================================================
-- RLS AUDIT — GROUND TRUTH FOR THE LIVE DATABASE
-- ============================================================================
-- Read-only. Safe to run in the Supabase SQL Editor. Makes no changes.
-- Purpose: the repo's schema is managed by ad-hoc, order-dependent SQL scripts,
-- so the files cannot tell you the ACTUAL live state. This query does.
--
-- The danger: any table in an API-exposed schema (public) with RLS DISABLED is
-- readable/writable by anyone holding the anon key — and this project's anon key
-- + URL are public (they were committed to a public repo). RLS is the only thing
-- standing between the public and that data.
-- ============================================================================

-- CHECK 1: Every public table, RLS on/off, and policy count.
-- Anything with rls_enabled = false AND is reachable via PostgREST is EXPOSED.
SELECT
  t.tablename,
  t.rowsecurity                              AS rls_enabled,
  COALESCE(p.policy_count, 0)                AS policy_count,
  CASE
    WHEN t.rowsecurity = false THEN '🔴 RLS OFF — publicly read/writable via anon key'
    WHEN COALESCE(p.policy_count, 0) = 0 THEN '🟠 RLS on, 0 policies — locked to service_role only'
    ELSE '🟢 RLS on with policies'
  END                                        AS verdict
FROM pg_tables t
LEFT JOIN (
  SELECT schemaname, tablename, COUNT(*) AS policy_count
  FROM pg_policies
  GROUP BY schemaname, tablename
) p ON p.schemaname = t.schemaname AND p.tablename = t.tablename
WHERE t.schemaname = 'public'
ORDER BY t.rowsecurity ASC, t.tablename;

-- CHECK 2: The blunt summary — how many public tables have RLS OFF?
SELECT
  COUNT(*) FILTER (WHERE rowsecurity = false) AS tables_without_rls,
  COUNT(*)                                    AS total_public_tables
FROM pg_tables
WHERE schemaname = 'public';

-- CHECK 3: Extra attention on sensitive tables (financial / PII / access control).
-- Adjust the list to your actual schema.
SELECT
  t.tablename,
  t.rowsecurity AS rls_enabled,
  COALESCE(p.policy_count, 0) AS policy_count
FROM pg_tables t
LEFT JOIN (
  SELECT tablename, COUNT(*) AS policy_count FROM pg_policies
  WHERE schemaname = 'public' GROUP BY tablename
) p ON p.tablename = t.tablename
WHERE t.schemaname = 'public'
  AND t.tablename IN (
    'users', 'payments', 'transactions', 'wallets', 'spray_money',
    'tickets', 'bookings', 'ticket_scans', 'notifications',
    'interaction_logs', 'memberships', 'membership_payments',
    'secret_events', 'otp_codes', 'password_reset_tokens'
  )
ORDER BY t.rowsecurity ASC, t.tablename;

-- CHECK 4: Anon/authenticated role table grants (the other half of exposure).
-- Even with RLS on, surprising GRANTs can matter. Review anything granted to 'anon'.
SELECT grantee, table_name, string_agg(privilege_type, ', ' ORDER BY privilege_type) AS privileges
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated')
GROUP BY grantee, table_name
ORDER BY grantee, table_name;
