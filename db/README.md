# Database

Supabase (PostgreSQL). There is no migration runner — schema changes are
applied by pasting SQL into the **Supabase SQL Editor**.

## `migrations/`

Schema changes, in the order they were written. They are **ad-hoc and
order-dependent**, and several were authored against a schema that has since
drifted, so do not assume a clean checkout can be replayed from empty. On an
existing database, apply only what is missing.

Apply in the order listed. `000_USERS_TABLE.sql` must be first — everything
else references `public.users`.

| File | What it adds |
|---|---|
| `000_USERS_TABLE.sql` | **`public.users`** — the profile table the whole API depends on. It had never been captured in a migration, so a clean database could not be built from this directory at all. Includes RLS plus column-level grants that stop a user editing their own `role` or `wallet_balance`. |
| `COMPLETE_DATABASE_MIGRATION.sql` | Baseline tables |
| `AUTH_USER_PROFILE_TRIGGER.sql` | Creates the profile row on signup. Without it, `supabase.auth.signUp()` leaves `public.users` empty and every organizer resolves as an attendee. |
| `WALLET_SECURITY_PERSISTENCE.sql` | `public.user_security` — transaction PINs. They previously lived in a Python dict wiped on every deploy. |
| `PHASE1_CRITICAL_SECURITY_RLS.sql` | Row Level Security policies |
| `add_ticket_code_column.sql` | `tickets.ticket_code` |
| `add_ticket_tiers_column.sql` | `events.ticket_tiers` |
| `EMAIL_VERIFICATION_MIGRATION.sql` | Email verification tokens |
| `SECRET_EVENTS_MIGRATION.sql` | Secret events, invites, invite requests |
| `MEMBERSHIP_SYSTEM_MIGRATION.sql` | Membership tiers and payments |
| `ORGANIZER_PAYMENT_MIGRATIONS.sql` | `transactions` table + organizer earnings view |

⚠️ `ORGANIZER_PAYMENT_MIGRATIONS.sql` has never been confirmed as applied, and
`POST /api/payments/verify` credits organizers through the `transactions` table
it creates. Verify it exists before relying on organizer payouts.

## `ops/`

Read-only tooling. Nothing here changes data.

- **`audit_rls_status.sql`** — every public table with RLS on/off and its
  policy count. Run this first; the repo cannot tell you the live state.
- **`probe_rls_exposure.sh`** — empirically checks what the *public anon key*
  can read over PostgREST. Answers the question the SQL audit cannot: "can an
  anonymous user on the internet actually read this table?"
  ```bash
  bash db/ops/probe_rls_exposure.sh
  ```
- `verify_rls_implementation.sql`, `check_actual_schema.sql` — spot checks.
- `backfill_missing_users.sql` — inserts `public.users` rows for `auth.users`
  that have none. Relevant since roles are resolved from that table: a user
  with no row is treated as an ordinary attendee.

Any 🔴 from the probe means that table is world-readable. The anon key and
project URL are public by design (they ship in the frontend); RLS is the only
thing protecting the data behind them.
