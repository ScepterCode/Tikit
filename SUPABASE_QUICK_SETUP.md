# 🚀 Supabase Quick Setup for Production

## Current Status
Your Tikit app is deployed on Vercel but needs Supabase connection. The app is **ready to work with Supabase** - just needs credentials.

## ⚡ 5-Minute Setup

### Step 1: Create Supabase Project (2 minutes)
1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Choose organization and enter:
   - **Name**: `tikit-production`
   - **Database Password**: (generate a strong password)
   - **Region**: `West Europe (Frankfurt)` (closest to Nigeria)
4. Click "Create new project"
5. Wait for project to be ready (~1 minute)

### Step 2: Get Your Credentials (30 seconds)
1. In your Supabase dashboard, go to **Settings → API**
2. Copy these two values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIs...` (long string)

### Step 3: Update Vercel Environment Variables (1 minute)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open your Tikit project
3. Go to **Settings → Environment Variables**
4. Add these two variables:
   ```
   VITE_SUPABASE_URL = https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIs...
   ```
5. Click "Save"

### Step 4: Set Up Database (1 minute)
1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste this SQL:

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

-- Real-time tables
CREATE TABLE IF NOT EXISTS public.event_capacity (
  event_id UUID REFERENCES public.events(id) PRIMARY KEY,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
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

-- Basic RLS Policies
CREATE POLICY "Users can read their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Anyone can read public events" ON public.events
  FOR SELECT USING (NOT is_hidden OR auth.uid() = organizer_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_capacity;
ALTER PUBLICATION supabase_realtime ADD TABLE public.spray_money_leaderboard;
```

4. Click "Run" to execute the SQL

### Step 5: Redeploy (30 seconds)
1. In Vercel dashboard, go to **Deployments**
2. Click "Redeploy" on the latest deployment
3. Wait for deployment to complete

## ✅ Test Your Setup

1. Visit your app: `https://tikit-ik4l.vercel.app`
2. Try to register a new account
3. Check your Supabase dashboard → Authentication → Users
4. You should see the new user appear!

## 🎉 What Works Now

- ✅ User registration and login
- ✅ Real-time spray money leaderboard
- ✅ Event creation and management
- ✅ Offline wallet functionality
- ✅ All dashboard features
- ✅ No more localhost connection errors

## 🔧 How It Works

The app automatically detects Supabase configuration:
- **With Supabase**: Uses Supabase Auth + Database directly
- **Without Supabase**: Falls back to backend API (localhost:4000)

Your app is now **production-ready with Supabase**! 🚀

## 🆘 Troubleshooting

**Still seeing localhost errors?**
- Check Vercel environment variables are saved
- Redeploy the app after adding variables
- Clear browser cache and try again

**Registration not working?**
- Check Supabase SQL was executed successfully
- Verify RLS policies are created
- Check browser console for errors

**Need help?**
- Check Supabase logs in dashboard
- Verify environment variables in Vercel
- Test with a fresh browser/incognito mode