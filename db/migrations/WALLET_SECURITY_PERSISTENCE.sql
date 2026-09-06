-- ============================================================================
-- WALLET SECURITY PERSISTENCE
-- ============================================================================
-- Transaction PINs lived in a Python dict on the API process
-- (wallet_security_service.transaction_pins), so every deploy or restart
-- erased them. Combined with the fix that stops withdrawals when no PIN is
-- set, that made payouts impossible after any restart.
--
-- This table is the store of record. The hash format is
-- "<salt-hex>:<pbkdf2-sha256-hex>" (100k iterations) - the plaintext PIN is
-- never stored or logged.
--
-- SAFE TO RE-RUN.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_security (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  pin_hash        text        NOT NULL,
  failed_attempts int         NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  pin_set_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.user_security IS 'Transaction PIN + lockout state. One row per user.';
COMMENT ON COLUMN public.user_security.pin_hash IS 'salt:pbkdf2_sha256 - never the plaintext PIN';

CREATE INDEX IF NOT EXISTS idx_user_security_locked
  ON public.user_security (locked_until)
  WHERE locked_until IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
-- No policies are granted to `anon` or `authenticated`: this table is only
-- ever touched by the API using the service role. RLS on with zero policies
-- means the anon key cannot read a single row even if it knows the table name.
ALTER TABLE public.user_security ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_security FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_user_security()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_security ON public.user_security;
CREATE TRIGGER trg_touch_user_security
  BEFORE UPDATE ON public.user_security
  FOR EACH ROW EXECUTE FUNCTION public.touch_user_security();

-- ---------------------------------------------------------------------------
-- Verify
-- ---------------------------------------------------------------------------
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  (SELECT count(*) FROM pg_policies p WHERE p.tablename = t.tablename) AS policy_count
FROM pg_tables t
WHERE schemaname = 'public' AND tablename = 'user_security';
