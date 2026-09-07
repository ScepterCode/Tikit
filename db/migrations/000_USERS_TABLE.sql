-- ============================================================================
-- USERS TABLE  (baseline - run this FIRST)
-- ============================================================================
-- public.users is the profile table every other migration and the whole API
-- depend on, and it was never captured in a migration - it only ever existed
-- in the live database. A clean environment therefore could not be built from
-- this directory at all.
--
-- Reconstructed from the columns the code actually reads and writes
-- (services/auth_service.py user_record, users router, wallet, analytics).
--
-- Numbered 000 because AUTH_USER_PROFILE_TRIGGER.sql and everything else
-- reference it.
--
-- SAFE TO RE-RUN.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id                  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- identity
  email               text UNIQUE,
  phone_number        text UNIQUE,
  first_name          text,
  last_name           text,
  state               text,
  preferred_language  text        NOT NULL DEFAULT 'en',

  -- authorisation. NEVER derived from a JWT's user_metadata, which the user
  -- can write themselves; this column is the authority.
  role                text        NOT NULL DEFAULT 'attendee'
                      CHECK (role IN ('attendee', 'organizer', 'admin')),

  -- organizer profile
  organization_name   text,
  organization_type   text,

  -- verification
  email_verified      boolean     DEFAULT false,
  phone_verified      boolean     NOT NULL DEFAULT false,
  is_verified         boolean     NOT NULL DEFAULT false,
  verification_token  text,
  verification_expires timestamptz,

  -- money. Authoritative balance; see also public.wallets.
  wallet_balance      numeric(14,2) NOT NULL DEFAULT 0 CHECK (wallet_balance >= 0),

  -- misc
  referral_code       text UNIQUE,
  event_preferences   jsonb       NOT NULL DEFAULT '[]'::jsonb,

  -- Legacy: the backend's own /api/auth/register hashes a password here.
  -- Accounts created through supabase.auth.signUp() leave it null - Supabase
  -- Auth holds the real credential.
  password            text,

  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.users.role IS
  'Authorisation source of truth. Never read the role from a JWT.';
COMMENT ON COLUMN public.users.password IS
  'Legacy backend-register path only. Null for Supabase Auth signups.';

CREATE INDEX IF NOT EXISTS idx_users_role  ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (lower(email));

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_users()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_users ON public.users;
CREATE TRIGGER trg_touch_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.touch_users();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS users_select_own ON public.users;
CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- The policy above permits UPDATE on the row; column privileges decide WHICH
-- columns. Without this a user could set their own role to 'admin' or edit
-- their own wallet_balance - the same class of hole as trusting the JWT.
REVOKE ALL ON public.users FROM anon, authenticated;
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (
  first_name, last_name, state, preferred_language,
  organization_name, organization_type, event_preferences
) ON public.users TO authenticated;

-- Nothing for anon: profiles are never world-readable.

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = 'users') AS policy_count
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'users';

-- Columns `authenticated` may write. role / wallet_balance / is_verified
-- must NOT appear here.
SELECT column_name
FROM information_schema.column_privileges
WHERE table_name = 'users' AND grantee = 'authenticated' AND privilege_type = 'UPDATE'
ORDER BY column_name;
