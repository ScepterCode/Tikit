# Grooovy

Nigerian event ticketing platform — events, tickets with QR/backup codes,
wallets, organizer payouts, memberships, and secret invite-only events.
Built for patchy connectivity: ticket scanning works offline and syncs later.

```
apps/frontend          React 18 + TypeScript + Vite (PWA)   → Netlify
apps/backend-fastapi   FastAPI (Python 3.11)                → Render
db/                    Supabase SQL — migrations + ops tooling
supabase/functions     Edge functions (email)
```

Supabase provides auth (JWT) and Postgres. Flutterwave handles payments.

## Getting started

```bash
# Backend
cd apps/backend-fastapi
cp .env.example .env          # fill in the Supabase + Flutterwave values
pip install -r requirements.txt
uvicorn main:app --reload     # http://localhost:8000  (docs at /docs)
```

```bash
# Frontend
cd apps/frontend
npm ci
npm run dev                   # http://localhost:5173
```

The frontend resolves its API base URL from `VITE_API_URL`
(see `apps/frontend/.env.production.example`). Nothing may hard-code
`localhost` — `npm run check:urls` enforces that and runs on every build.

### Required backend configuration

| Variable | Why |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY` | Database and auth |
| `SUPABASE_JWT_SECRET` | **Access-token signatures are verified.** Without it every authenticated request is rejected. Supabase → Project Settings → API → JWT Settings |
| `FLUTTERWAVE_SECRET_KEY` | `POST /api/payments/verify` returns 503 and issues no tickets without it |
| `FLUTTERWAVE_SECRET_HASH` | Webhook signature check |

For local work without the JWT secret, set `ENVIRONMENT=development` and
`ALLOW_UNVERIFIED_JWT=true`. That combination is ignored anywhere else.

## Tests

```bash
cd apps/backend-fastapi && python -m pytest      # 78 tests
cd apps/frontend        && npm test              # unit + property tests
cd apps/frontend        && npm run test:offline  # slower IndexedDB suites
```

CI (`.github/workflows/ci.yml`) runs the frontend build + tests and the backend
pytest suite on every push and PR to `main`.

## Security notes

The parts that are easy to get wrong, and how they behave:

- **Auth** — Supabase JWTs are signature-verified (HS256 secret or JWKS) and
  fail closed. Roles come from the `users` table, never from token
  `user_metadata`, which the user can write themselves.
- **Payments** — tickets are only issued after Flutterwave confirms the
  transaction as successful; the call is idempotent on `tx_ref` and enforces
  the expected amount.
- **Withdrawals** — require a transaction PIN the user set deliberately, and
  an OTP above the threshold. Balances are deducted on confirmation, not on
  request.
- **RLS** — the Supabase anon key is public by design, so Row Level Security is
  the only thing protecting the data. Run `db/ops/probe_rls_exposure.sh` to see
  what an anonymous user can actually read.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md). Both services deploy from `main` through
their own git integrations; there are no deploy workflows.
