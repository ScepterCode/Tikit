-- Supabase Real-time Tables Setup
-- Run this in your Supabase SQL Editor

-- Event capacity tracking for real-time updates
CREATE TABLE IF NOT EXISTS event_capacity (
  event_id TEXT PRIMARY KEY,
  tickets_sold INTEGER NOT NULL DEFAULT 0,
  capacity INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group buy status tracking for real-time updates
CREATE TABLE IF NOT EXISTS group_buy_status (
  group_buy_id TEXT PRIMARY KEY,
  current_participants INTEGER NOT NULL DEFAULT 0,
  total_participants INTEGER NOT NULL DEFAULT 0,
  participants JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Spray money leaderboard for wedding events
CREATE TABLE IF NOT EXISTS spray_money_leaderboard (
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (event_id, user_id)
);

-- Real-time notifications
CREATE TABLE IF NOT EXISTS realtime_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  event_id TEXT,
  type TEXT NOT NULL, -- 'ticket_sold', 'group_buy_joined', 'spray_money', 'event_update'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_event_capacity_event_id ON event_capacity(event_id);
CREATE INDEX IF NOT EXISTS idx_group_buy_status_group_buy_id ON group_buy_status(group_buy_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_event_id ON spray_money_leaderboard(event_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_amount ON spray_money_leaderboard(event_id, amount DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON realtime_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_event_id ON realtime_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON realtime_notifications(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE event_capacity ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buy_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE spray_money_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE realtime_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_capacity
CREATE POLICY "Allow read access to authenticated users" ON event_capacity
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access" ON event_capacity
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for group_buy_status
CREATE POLICY "Allow read access to authenticated users" ON group_buy_status
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access" ON group_buy_status
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for spray_money_leaderboard
CREATE POLICY "Allow read access to authenticated users" ON spray_money_leaderboard
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role has full access" ON spray_money_leaderboard
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for realtime_notifications
CREATE POLICY "Users can read their own notifications" ON realtime_notifications
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role has full access" ON realtime_notifications
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE event_capacity;
ALTER PUBLICATION supabase_realtime ADD TABLE group_buy_status;
ALTER PUBLICATION supabase_realtime ADD TABLE spray_money_leaderboard;
ALTER PUBLICATION supabase_realtime ADD TABLE realtime_notifications;

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_event_capacity_available()
RETURNS TRIGGER AS $$
BEGIN
  NEW.available = NEW.capacity - NEW.tickets_sold;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_event_capacity_available
  BEFORE INSERT OR UPDATE ON event_capacity
  FOR EACH ROW
  EXECUTE FUNCTION update_event_capacity_available();

-- Function to update group buy status
CREATE OR REPLACE FUNCTION update_group_buy_participants()
RETURNS TRIGGER AS $$
BEGIN
  NEW.current_participants = jsonb_array_length(NEW.participants);
  NEW.updated_at = NOW();
  
  -- Auto-complete group buy when full
  IF NEW.current_participants >= NEW.total_participants THEN
    NEW.status = 'completed';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_group_buy_participants
  BEFORE INSERT OR UPDATE ON group_buy_status
  FOR EACH ROW
  EXECUTE FUNCTION update_group_buy_participants();

-- Sample data for testing (optional)
INSERT INTO event_capacity (event_id, tickets_sold, capacity) 
VALUES ('test-event-1', 25, 100) 
ON CONFLICT (event_id) DO NOTHING;

INSERT INTO group_buy_status (group_buy_id, total_participants, participants) 
VALUES ('test-group-buy-1', 5, '[{"userId": "user1", "name": "John Doe"}]'::jsonb)
ON CONFLICT (group_buy_id) DO NOTHING;