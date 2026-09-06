-- ============================================================================
-- AUTH -> PROFILE TRIGGER
-- ============================================================================
-- The frontend registers with supabase.auth.signUp(), which writes to
-- auth.users only. Nothing has ever populated public.users, which is why
-- db/ops/backfill_missing_users.sql exists.
--
-- Since role resolution reads public.users (the JWT's user_metadata is
-- writable by the user themselves and must never decide authorisation), a
-- missing profile row means the account is treated as an ordinary attendee.
-- For an organizer that means losing access to their own events.
--
-- This trigger creates the profile row at signup.
--
-- SAFE TO RE-RUN.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Role whitelist
-- ---------------------------------------------------------------------------
-- signUp() metadata is attacker-controlled: anyone can POST
-- {"data":{"role":"admin"}} to the Supabase auth endpoint. Only self-service
-- roles may be claimed at registration; `admin` is granted out of band.
CREATE OR REPLACE FUNCTION public.claimable_role(requested text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN lower(coalesce(requested, '')) IN ('attendee', 'organizer') THEN lower(requested)
    ELSE 'attendee'
  END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Profile creation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta jsonb := coalesce(NEW.raw_user_meta_data, '{}'::jsonb);
BEGIN
  INSERT INTO public.users (
    id, email, phone_number, first_name, last_name,
    state, role, organization_name, organization_type,
    referral_code, wallet_balance, created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- the frontend writes snake_case; older rows used camelCase
    coalesce(meta->>'phone_number', meta->>'phoneNumber', NEW.phone),
    coalesce(meta->>'first_name',   meta->>'firstName'),
    coalesce(meta->>'last_name',    meta->>'lastName'),
    coalesce(meta->>'state',        meta->>'stateOfResidence'),
    public.claimable_role(coalesce(meta->>'role', 'attendee')),
    coalesce(meta->>'organization_name', meta->>'organizationName'),
    coalesce(meta->>'organization_type', meta->>'organizationType'),
    upper(substr(replace(NEW.id::text, '-', ''), 1, 8)),
    0,
    coalesce(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block account creation because the profile insert failed; the
  -- backfill in db/ops/ can repair afterwards.
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3. Wire it up
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 4. Verify
-- ---------------------------------------------------------------------------
-- Should return one row.
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Accounts still missing a profile. Run db/ops/backfill_missing_users.sql
-- if this is greater than zero.
SELECT count(*) AS accounts_without_profile
FROM auth.users au
LEFT JOIN public.users u ON u.id = au.id
WHERE u.id IS NULL;
