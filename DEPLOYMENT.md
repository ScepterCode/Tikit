# Deployment

Both services deploy automatically from `main` via their platform's git
integration. There are no deploy GitHub Actions — CI (`.github/workflows/ci.yml`)
only builds and tests.

## Frontend → Netlify

- Config: [`netlify.toml`](netlify.toml) (base `apps/frontend`, `npm ci && npm run build`, publish `dist`).
- Netlify redeploys on every push to `main`.
- Set build-time env vars in **Netlify → Site settings → Environment variables**
  (see [`apps/frontend/.env.production.example`](apps/frontend/.env.production.example)):
  `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
  `VITE_FLUTTERWAVE_PUBLIC_KEY`, …
- `vercel.json` is kept only as a fallback for a Vercel deploy; Netlify is primary.

## Backend → Render

- Config: [`apps/backend-fastapi/render.yaml`](apps/backend-fastapi/render.yaml)
  (Render Blueprint). `uvicorn main:app`, health check `/health`.
- Render redeploys on every push to `main`.
- Set secrets (`sync: false` in the blueprint) in **Render → Environment**:
  `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`,
  `FLUTTERWAVE_SECRET_KEY`, `FLUTTERWAVE_PUBLIC_KEY`,
  `FLUTTERWAVE_ENCRYPTION_KEY`, `FLUTTERWAVE_SECRET_HASH`, `ALLOWED_HOSTS`.
- **`FLUTTERWAVE_SECRET_KEY` is required** — `POST /api/payments/verify` returns
  503 and issues no tickets without it.
- Redis is optional; leave `REDIS_URL` unset to run without caching.

## Local

```bash
# frontend
cd apps/frontend && npm ci && npm run dev

# backend
cd apps/backend-fastapi && pip install -r requirements.txt && uvicorn main:app --reload
```
