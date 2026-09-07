# Walking-skeleton end-to-end tests

These are the tests that would have caught every finding in the platform
audit. They run against a **real staging Supabase and a real running API**,
and they assert outcomes in the database rather than the presence of UI
elements — a ticket row that exists, an organizer wallet that was credited, a
profile row created by the signup trigger.

They skip cleanly when staging is not configured, so they are safe to leave in
CI for anyone without an environment.

## Setting up staging (once)

1. **Create a second Supabase project** — never point these at production.
   They create and delete users.

2. **Build the schema.** In the SQL editor, run everything in `db/migrations/`
   in this order:

   ```
   000_USERS_TABLE.sql              <- must be first, everything references it
   COMPLETE_DATABASE_MIGRATION.sql
   AUTH_USER_PROFILE_TRIGGER.sql
   PHASE1_CRITICAL_SECURITY_RLS.sql
   add_ticket_code_column.sql
   add_ticket_tiers_column.sql
   EMAIL_VERIFICATION_MIGRATION.sql
   SECRET_EVENTS_MIGRATION.sql
   MEMBERSHIP_SYSTEM_MIGRATION.sql
   ORGANIZER_PAYMENT_MIGRATIONS.sql
   WALLET_SECURITY_PERSISTENCE.sql
   ```

   Then confirm with `db/ops/audit_rls_status.sql`.

3. **Run the API against it** with `ENVIRONMENT=staging`, the staging Supabase
   keys, `SUPABASE_JWT_SECRET`, and Flutterwave **test** credentials.

## Running

```bash
export E2E_SUPABASE_URL=https://<project>.supabase.co
export E2E_SUPABASE_SERVICE_KEY=<service-role key>
export E2E_SUPABASE_ANON_KEY=<anon key>
export E2E_API_URL=https://<staging api>
export BASE_URL=https://<staging frontend>   # optional

npm run test:e2e
```

Without those four `E2E_*` variables every test reports as skipped.

## What each test is defending

| Test | The bug it catches |
|---|---|
| profile row created with the right role | the signup trigger missing — organizers silently demoted to attendee |
| role cannot be claimed at signup | `signUp({data:{role:'admin'}})` self-promotion |
| API accepts a real token | `SUPABASE_JWT_SECRET` unset — every request 401s |
| API rejects a forged token | signature verification regressing to `verify_signature: False` |
| no ticket without a verified payment | free tickets from a fabricated `transaction_id` |
| withdrawal refused until a PIN is set | the auto-created `000000` PIN returning |
| the PIN is in `user_security` | PINs regressing to an in-memory dict wiped on deploy |
| notifications / analytics not 404 | the double-prefix bug returning |
| health reports the database connected | a deploy that boots without Supabase |

## Conventions

- Users are created through the admin API with `email_confirm: true`, using
  the same `user_metadata` shape the frontend's `signUp()` writes — so the
  trigger is exercised exactly as it is in production.
- Everything created is torn down in `afterAll`.
- Tests run serially: they share an organizer, an event and a PIN.
- Assertions read through the **service-role** client, so RLS never hides a
  row the test needs to see.
