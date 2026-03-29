# Supabase Setup Guide

## Prerequisites

- Supabase account
- Supabase project created

## Setup Steps

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Click "New project"
3. Enter project details:
   - Name: "tikit-production"
   - Database Password: (generate strong password)
   - Region: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 2. Get API Keys

1. In your project dashboard, go to "Settings" > "API"
2. Copy the following values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: For frontend (safe to expose)
   - **service_role key**: For backend (keep secret!)

### 3. Configure Environment Variables

#### Frontend (.env)
```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

#### Backend (.env)
```env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 4. Set Up Real-time Tables

Create these tables in Supabase SQL Editor for real-time features:

```sql
-- Event capacity tracking
CREATE TABLE event_capacity (
  event_id TEXT PRIMARY KEY,
  tickets_sold INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  available INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE event_capacity;

-- Group buy status tracking
CREATE TABLE group_buy_status (
  group_buy_id TEXT PRIMARY KEY,
  current_participants INTEGER NOT NULL,
  total_participants INTEGER NOT NULL,
  participants JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_buy_status;

-- Spray money leaderboard
CREATE TABLE spray_money_leaderboard (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE spray_money_leaderboard;

-- Create indexes for performance
CREATE INDEX idx_event_capacity_event_id ON event_capacity(event_id);
CREATE INDEX idx_group_buy_status_group_buy_id ON group_buy_status(group_buy_id);
CREATE INDEX idx_spray_money_event_id ON spray_money_leaderboard(event_id);
CREATE INDEX idx_spray_money_amount ON spray_money_leaderboard(event_id, amount DESC);
```

### 5. Enable Realtime

1. Go to "Database" > "Replication"
2. Enable replication for the tables:
   - `event_capacity`
   - `group_buy_status`
   - `spray_money_leaderboard`

### 6. Configure Authentication

1. Go to "Authentication" > "Providers"
2. Enable "Phone" authentication
3. Configure SMS provider (Twilio, MessageBird, or Vonage)
4. Set up SMS templates for OTP

### 7. Set Up Row Level Security (RLS)

```sql
-- Enable RLS on tables
ALTER TABLE event_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_money_leaderboard ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Allow read access to authenticated users" ON event_capacity
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to authenticated users" ON group_buy_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow read access to authenticated users" ON spray_money_leaderboard
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to do everything
CREATE POLICY "Service role has full access" ON event_capacity
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access" ON group_buy_status
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

CREATE POLICY "Service role has full access" ON spray_money_leaderboard
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');
```

## Real-time Features

Supabase provides real-time updates for:

1. **Event Capacity Updates**: Live updates when tickets are sold
2. **Group Buy Status**: Real-time tracking of group buy participants
3. **Spray Money Leaderboard**: Live leaderboard for wedding events

## Testing

Test the Supabase connection:

```bash
# Start backend
pnpm --filter @tikit/backend dev

# Check health endpoint
curl http://localhost:4000/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected",
  "redis": "connected",
  "supabase": "connected"
}
```

## Advantages of Supabase

✅ **Built on PostgreSQL** - Full SQL database with ACID compliance
✅ **Real-time subscriptions** - WebSocket-based real-time updates
✅ **Row Level Security** - Database-level security policies
✅ **Auto-generated REST API** - Instant API from your database schema
✅ **Authentication built-in** - Phone, email, OAuth providers
✅ **Storage** - File storage with CDN
✅ **Edge Functions** - Serverless functions at the edge
✅ **Open source** - Can self-host if needed

## Troubleshooting

### Connection Issues
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure API keys are correct
- Verify network connectivity

### Realtime Not Working
- Check tables are added to replication
- Verify RLS policies allow access
- Check browser console for WebSocket errors
- Ensure realtime is enabled in project settings

### Authentication Issues
- Verify phone provider is configured
- Check SMS templates are set up
- Ensure API keys have correct permissions
- Test with Supabase Auth UI first

## Migration from Firebase

Key differences:
- **Database**: PostgreSQL instead of NoSQL
- **Realtime**: WebSocket subscriptions instead of Firebase Realtime Database
- **Auth**: Similar phone auth, but different API
- **Queries**: SQL-based instead of Firebase queries
- **Security**: Row Level Security instead of Firebase Rules

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Auth Guide](https://supabase.com/docs/guides/auth)
