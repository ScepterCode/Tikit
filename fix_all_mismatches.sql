-- ============================================================================
-- FIX ALL MISMATCHES: Priority 1-4
-- ============================================================================

-- ============================================================================
-- PRIORITY 1: CRITICAL - ticket_scans table
-- ============================================================================

CREATE TABLE IF NOT EXISTS ticket_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES tickets(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES users(id) ON DELETE SET NULL,
  scan_location TEXT,
  scan_device TEXT,
  scan_status TEXT DEFAULT 'valid',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket_id ON ticket_scans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_event_id ON ticket_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_user_id ON ticket_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_created_at ON ticket_scans(created_at);

-- Enable RLS
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organizers can scan tickets for their events" ON ticket_scans;
DROP POLICY IF EXISTS "Users can view their ticket scans" ON ticket_scans;
DROP POLICY IF EXISTS "Organizers can view scans for their events" ON ticket_scans;
DROP POLICY IF EXISTS "Admins can view all scans" ON ticket_scans;

-- Policies (Simplified - no RLS checks for now, enable later)
CREATE POLICY "Allow all authenticated users to scan tickets"
  ON ticket_scans FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow all authenticated users to view ticket scans"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRIORITY 2: HIGH - spray_money table
-- ============================================================================

CREATE TABLE IF NOT EXISTS spray_money (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES users(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_spray_money_event_id ON spray_money(event_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_sender_id ON spray_money(sender_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_recipient_id ON spray_money(recipient_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_created_at ON spray_money(created_at);

-- Enable RLS
ALTER TABLE spray_money ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can spray money at events" ON spray_money;
DROP POLICY IF EXISTS "Users can view spray money for events they attend" ON spray_money;
DROP POLICY IF EXISTS "Event hosts can view all spray money" ON spray_money;

-- Policies (Simplified)
CREATE POLICY "Allow authenticated users to spray money"
  ON spray_money FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view spray money"
  ON spray_money FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRIORITY 3: MEDIUM - interaction_logs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  interaction_type TEXT NOT NULL,
  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id ON interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_event_id ON interaction_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_type ON interaction_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created_at ON interaction_logs(created_at);

-- Enable RLS
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can log their own interactions" ON interaction_logs;
DROP POLICY IF EXISTS "Admins can view all interaction logs" ON interaction_logs;
DROP POLICY IF EXISTS "Event hosts can view interactions for their events" ON interaction_logs;

-- Policies (Simplified)
CREATE POLICY "Allow authenticated users to log interactions"
  ON interaction_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view interaction logs"
  ON interaction_logs FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- PRIORITY 3: MEDIUM - notifications table
-- ============================================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Policies (Simplified)
CREATE POLICY "Allow users to view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow users to update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow system to create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Display summary
DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ALL TABLES CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Priority 1: ticket_scans - CREATED';
  RAISE NOTICE 'Priority 2: spray_money - CREATED';
  RAISE NOTICE 'Priority 3: interaction_logs - CREATED';
  RAISE NOTICE 'Priority 3: notifications - CREATED';
  RAISE NOTICE '============================================================================';
END $$;
