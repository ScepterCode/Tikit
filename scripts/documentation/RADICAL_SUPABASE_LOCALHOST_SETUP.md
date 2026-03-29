# 🔥 RADICAL APPROACH: Supabase-Only Localhost Setup

## 🎯 Goal
Completely eliminate SQLite and run the entire Tikit app on Supabase locally, then deploy to production.

## 🚀 Step 1: Create Real Supabase Project (3 minutes)

1. **Go to [supabase.com](https://supabase.com)**
2. **Create account/login**
3. **New Project:**
   - Name: `tikit-localhost-test`
   - Password: Generate strong password
   - Region: `West Europe (Frankfurt)`
   - Plan: **Free**

## 📋 Step 2: Get Real Credentials

Once project is ready:
1. **Settings → API**
2. **Copy these values:**
   ```
   Project URL: https://[project-id].supabase.co
   anon key: eyJhbGciOiJIUzI1NiIs...
   service_role key: eyJhbGciOiJIUzI1NiIs...
   ```

## 🔧 Step 3: Update Backend Environment

Replace `apps/backend/.env` with real Supabase credentials:

```env
PORT=4000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# SUPABASE DATABASE (NO MORE SQLITE!)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Supabase Configuration
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]
SUPABASE_PUBLIC_ANON_KEY=[anon-key]

# JWT Configuration
JWT_SECRET=your_jwt_secret_change_in_production
JWT_REFRESH_SECRET=your_jwt_refresh_secret_change_in_production

# Other configs remain the same...
```

## 💾 Step 4: Set Up Supabase Database Schema

Run this SQL in Supabase SQL Editor:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('attendee', 'organizer', 'admin')),
  state TEXT NOT NULL,
  organization_name TEXT,
  organization_type TEXT,
  referral_code TEXT UNIQUE,
  wallet_balance INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES public.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 100,
  tickets_sold INTEGER DEFAULT 0,
  is_hidden BOOLEAN DEFAULT FALSE,
  access_code TEXT,
  cultural_features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  tier_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  backup_code TEXT UNIQUE NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) NOT NULL,
  event_id UUID REFERENCES public.events(id),
  ticket_id UUID REFERENCES public.tickets(id),
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  reference TEXT UNIQUE NOT NULL,
  provider_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Real-time tables
CREATE TABLE IF NOT EXISTS public.event_capacity (
  event_id UUID REFERENCES public.events(id) PRIMARY KEY,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.group_buy_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES public.events(id) NOT NULL,
  initiator_id UUID REFERENCES public.users(id) NOT NULL,
  tier_name TEXT NOT NULL,
  price_per_person INTEGER NOT NULL,
  total_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  participants JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.spray_money_leaderboard (
  event_id UUID REFERENCES public.events(id) NOT NULL,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  user_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Anyone can read public events" ON public.events
  FOR SELECT USING (NOT is_hidden OR auth.uid() = organizer_id);

CREATE POLICY "Organizers can manage their events" ON public.events
  FOR ALL USING (auth.uid() = organizer_id);

CREATE POLICY "Users can read their own tickets" ON public.tickets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_capacity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buy_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spray_money_leaderboard;
```

## 🔄 Step 5: Update Frontend Environment

Update `apps/frontend/.env`:

```env
# SUPABASE FRONTEND CONNECTION
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=[anon-key]

# App Configuration
VITE_APP_NAME=Tikit
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=development
```

## 🚀 Step 6: Test Locally

1. **Start Backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Start Frontend:**
   ```bash
   cd apps/frontend
   npm run dev
   ```

3. **Test Registration:**
   - Visit http://localhost:5173
   - Try to register new account
   - Should work with Supabase!

## ✅ Expected Results

- ❌ No SQLite database files
- ✅ All data stored in Supabase
- ✅ Real-time features working
- ✅ Authentication via Supabase
- ✅ Ready for production deployment

## 🎯 Benefits

1. **Identical local and production** - same database system
2. **Real-time features work** - Supabase realtime
3. **No migration needed** - direct production deployment
4. **Scalable from day 1** - PostgreSQL backend
5. **Zero localhost dependencies** - cloud-first approach

This radical approach eliminates all SQLite dependencies and proves the Supabase integration works perfectly before production deployment!