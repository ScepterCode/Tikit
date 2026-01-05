# 🗄️ Setup Supabase Database Tables

## Quick Setup Steps:

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New Query"**

### 2. Run the Database Schema
Copy and paste the entire content from `apps/backend/src/scripts/supabase-schema.sql` into the SQL editor and click **"Run"**.

This will create:
- ✅ All required tables (users, events, tickets, payments, etc.)
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Triggers for automatic timestamps
- ✅ Helper functions for generating codes

### 3. Verify Tables Created
After running the schema, you should see these tables in your **"Table Editor"**:
- `users` - User accounts and profiles
- `events` - Event information
- `tickets` - Ticket purchases
- `payments` - Payment records
- `group_buys` - Group buying functionality
- `referrals` - Referral system
- `scan_history` - Ticket scanning logs
- `event_organizers` - Event management permissions
- `sponsorships` - Sponsorship requests

### 4. Test the App
Once the database is set up:
1. Go to http://localhost:3000/
2. Try registering a new account
3. Test login functionality
4. Explore the features

## 🔧 If You Get Errors:
- Make sure you're using the **SQL Editor** (not Table Editor)
- Run the schema in a fresh Supabase project
- Check that all extensions are enabled

## 🎯 Expected Result:
After setup, you should be able to:
- ✅ Register new users
- ✅ Login successfully  
- ✅ Access dashboards
- ✅ Create events (as organizer)
- ✅ Purchase tickets
- ✅ Use all app features

The database schema includes everything needed for the full Tikit functionality! 🚀