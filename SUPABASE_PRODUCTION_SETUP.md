# 🔥 Supabase Production Setup for Tikit

## Current Status
The Tikit app is deployed on Vercel but needs Supabase connection for production. The app currently has:
- ✅ Supabase client configured in frontend
- ✅ Real-time hooks implemented
- ✅ Database schema ready
- ❌ Missing production Supabase credentials

## 🎯 Quick Production Fix

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Choose a region close to your users (e.g., Frankfurt for Nigeria)
4. Note down your project URL and anon key

### Step 2: Set Up Database Tables
Run this SQL in your Supabase SQL Editor:

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

-- Real-time tables (from existing schema)
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
ALTER TABLE public.event_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_buy_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spray_money_leaderboard ENABLE ROW LEVEL SECURITY;

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

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_capacity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_buy_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spray_money_leaderboard;
```

### Step 3: Update Vercel Environment Variables
In your Vercel dashboard, add these environment variables:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Update Authentication to Use Supabase
The app will automatically use Supabase once the environment variables are set.

## 🚀 Expected Results
Once configured:
- ✅ User registration/login will work
- ✅ Real-time features will function
- ✅ Data will persist in Supabase
- ✅ No more localhost connection errors

## 🔧 Testing Production Setup
1. Visit your deployed app
2. Try to register a new account
3. Check Supabase dashboard for new user
4. Test real-time features like spray money leaderboard

## 📱 Features That Will Work
- User authentication (register/login)
- Event creation and management
- Ticket purchasing
- Real-time spray money leaderboard
- Group buy functionality
- Offline wallet with sync
- Push notifications
- Analytics dashboard

The app is designed to work with Supabase out of the box - just needs the credentials!