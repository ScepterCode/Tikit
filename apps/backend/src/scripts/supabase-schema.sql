-- Supabase PostgreSQL Schema for Tikit
-- This script creates the complete database schema for migration from SQLite

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone_number TEXT UNIQUE NOT NULL,
  phone_verified BOOLEAN DEFAULT FALSE,
  password TEXT,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  preferred_language TEXT DEFAULT 'en',
  state TEXT NOT NULL,
  lga TEXT,
  role TEXT DEFAULT 'attendee',
  wallet_balance INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by TEXT,
  
  -- Organizer-specific fields
  organization_name TEXT,
  organization_type TEXT,
  bank_details TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  
  -- Admin fields
  admin_level TEXT,
  permissions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  organizer_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  event_type TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  venue TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  is_hidden BOOLEAN DEFAULT FALSE,
  access_code TEXT UNIQUE,
  deep_link TEXT UNIQUE,
  capacity INTEGER NOT NULL,
  tickets_sold INTEGER DEFAULT 0,
  tiers TEXT NOT NULL, -- JSON string
  cultural_features TEXT, -- JSON string
  images TEXT, -- JSON array as string
  ussd_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (organizer_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  backup_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'valid',
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  scanned_by TEXT,
  group_buy_id TEXT,
  cultural_selections TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  ticket_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'NGN',
  method TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  provider TEXT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  metadata TEXT, -- JSON string
  is_installment BOOLEAN DEFAULT FALSE,
  installment_plan TEXT, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE SET NULL
);

-- Group Buys table
CREATE TABLE IF NOT EXISTS group_buys (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  initiator_id TEXT NOT NULL,
  total_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  price_per_person INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  participants TEXT NOT NULL, -- JSON string
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (initiator_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  referrer_id TEXT NOT NULL,
  referred_user_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  reward_amount INTEGER NOT NULL,
  reward_paid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  FOREIGN KEY (referrer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (referred_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Scan History table
CREATE TABLE IF NOT EXISTS scan_history (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL,
  scanned_by TEXT NOT NULL,
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  location TEXT,
  device_info TEXT,
  result TEXT NOT NULL, -- 'success', 'duplicate', 'invalid'
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

-- Event Organizers table
CREATE TABLE IF NOT EXISTS event_organizers (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL, -- 'owner', 'editor', 'viewer', 'financial'
  permissions TEXT NOT NULL, -- JSON string - Specific permissions for this role
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(event_id, user_id)
);

-- Sponsorships table
CREATE TABLE IF NOT EXISTS sponsorships (
  id TEXT PRIMARY KEY,
  requester_id TEXT NOT NULL,
  sponsor_phone TEXT,
  code TEXT UNIQUE NOT NULL,
  event_id TEXT NOT NULL,
  tier_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_state_language ON users(state, preferred_language);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE INDEX IF NOT EXISTS idx_events_organizer_id ON events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_state_lga ON events(state, lga);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_hidden ON events(is_hidden);
CREATE INDEX IF NOT EXISTS idx_events_ussd_code ON events(ussd_code);
CREATE INDEX IF NOT EXISTS idx_events_state_type_date ON events(state, event_type, start_date);
CREATE INDEX IF NOT EXISTS idx_events_type_date ON events(event_type, start_date);
CREATE INDEX IF NOT EXISTS idx_events_status_date ON events(status, start_date);
CREATE INDEX IF NOT EXISTS idx_events_location ON events(latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr_code ON tickets(qr_code);
CREATE INDEX IF NOT EXISTS idx_tickets_backup_code ON tickets(backup_code);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_user_status ON tickets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tickets_event_status ON tickets(event_id, status);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON payments(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

CREATE INDEX IF NOT EXISTS idx_group_buys_event_id ON group_buys(event_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_initiator_id ON group_buys(initiator_id);
CREATE INDEX IF NOT EXISTS idx_group_buys_status ON group_buys(status);
CREATE INDEX IF NOT EXISTS idx_group_buys_status_expires ON group_buys(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_status ON referrals(referrer_id, status);

CREATE INDEX IF NOT EXISTS idx_scan_history_ticket_id ON scan_history(ticket_id);
CREATE INDEX IF NOT EXISTS idx_scan_history_scanned_at ON scan_history(scanned_at);

CREATE INDEX IF NOT EXISTS idx_event_organizers_event_id ON event_organizers(event_id);
CREATE INDEX IF NOT EXISTS idx_event_organizers_user_id ON event_organizers(user_id);

CREATE INDEX IF NOT EXISTS idx_sponsorships_code ON sponsorships(code);
CREATE INDEX IF NOT EXISTS idx_sponsorships_status ON sponsorships(status);
CREATE INDEX IF NOT EXISTS idx_sponsorships_requester_id ON sponsorships(requester_id);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_buys ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE scan_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_organizers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsorships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for events
CREATE POLICY "Anyone can view public events" ON events
  FOR SELECT USING (NOT is_hidden OR auth.uid()::text = organizer_id);

CREATE POLICY "Organizers can manage their events" ON events
  FOR ALL USING (auth.uid()::text = organizer_id);

CREATE POLICY "Service role has full access to events" ON events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets" ON tickets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Event organizers can view tickets for their events" ON tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = tickets.event_id 
      AND events.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Service role has full access to tickets" ON tickets
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for payments
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Service role has full access to payments" ON payments
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for group_buys
CREATE POLICY "Anyone can view active group buys" ON group_buys
  FOR SELECT USING (status = 'active');

CREATE POLICY "Initiators can manage their group buys" ON group_buys
  FOR ALL USING (auth.uid()::text = initiator_id);

CREATE POLICY "Service role has full access to group_buys" ON group_buys
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for referrals
CREATE POLICY "Users can view their referrals" ON referrals
  FOR SELECT USING (
    auth.uid()::text = referrer_id OR 
    auth.uid()::text = referred_user_id
  );

CREATE POLICY "Service role has full access to referrals" ON referrals
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for scan_history
CREATE POLICY "Event organizers can view scan history for their events" ON scan_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tickets 
      JOIN events ON events.id = tickets.event_id
      WHERE tickets.id = scan_history.ticket_id 
      AND events.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Service role has full access to scan_history" ON scan_history
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for event_organizers
CREATE POLICY "Event organizers can view their assignments" ON event_organizers
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Event owners can manage organizers" ON event_organizers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = event_organizers.event_id 
      AND events.organizer_id = auth.uid()::text
    )
  );

CREATE POLICY "Service role has full access to event_organizers" ON event_organizers
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- RLS Policies for sponsorships
CREATE POLICY "Users can view their sponsorship requests" ON sponsorships
  FOR SELECT USING (auth.uid()::text = requester_id);

CREATE POLICY "Users can create sponsorship requests" ON sponsorships
  FOR INSERT WITH CHECK (auth.uid()::text = requester_id);

CREATE POLICY "Service role has full access to sponsorships" ON sponsorships
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Create functions for automatic updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_buys_updated_at BEFORE UPDATE ON group_buys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_event_organizers_updated_at BEFORE UPDATE ON event_organizers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate referral codes
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Function to generate USSD codes
CREATE OR REPLACE FUNCTION generate_ussd_code()
RETURNS TEXT AS $$
BEGIN
  RETURN '*' || (floor(random() * 9000) + 1000)::text || '#';
END;
$$ LANGUAGE plpgsql;

-- Function to generate QR codes
CREATE OR REPLACE FUNCTION generate_qr_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'QR' || upper(substring(md5(random()::text) from 1 for 10));
END;
$$ LANGUAGE plpgsql;

-- Function to generate backup codes
CREATE OR REPLACE FUNCTION generate_backup_code()
RETURNS TEXT AS $$
BEGIN
  RETURN 'BC' || upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;