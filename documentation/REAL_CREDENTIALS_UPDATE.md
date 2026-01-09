# 🔧 Update Real Supabase Credentials

## Current Issue:
The `.env.local` file still contains placeholder values:
- `https://xyzcompany.supabase.co` (not a real domain)
- Demo JWT token

## What You Need to Do:

### 1. Get Your Real Supabase Credentials
1. Go to your Supabase project dashboard
2. Click **Settings → API**
3. Copy these values:
   - **Project URL** (looks like: `https://abcdefghijk.supabase.co`)
   - **Anon/Public Key** (long JWT token starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9`)

### 2. Update the Environment File
Replace the content in `apps/frontend/.env.local` with your real credentials:

```env
VITE_SUPABASE_URL=https://YOUR-ACTUAL-PROJECT-ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR-ACTUAL-ANON-KEY
```

### 3. Restart the Dev Server
After updating the file, restart the development server to pick up the new values.

## ⚠️ Important Notes:
- Replace `YOUR-ACTUAL-PROJECT-ID` with your real Supabase project ID
- Replace `YOUR-ACTUAL-ANON-KEY` with your real anon key
- The URL must be a real `.supabase.co` domain
- The anon key should be much longer than the demo one

## Expected Result:
After updating with real credentials:
- No more `net::ERR_NAME_NOT_RESOLVED` errors
- Registration and login should work
- You can then set up the database tables

**The app is working perfectly - it just needs your real Supabase project credentials!** 🎯