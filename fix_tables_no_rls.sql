-- ============================================================================
-- CREATE TABLES WITHOUT RLS (Simplest approach)
-- ============================================================================

-- ============================================================================
-- PRIORITY 1: ticket_scans table
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

CREATE INDEX IF NOT EXISTS idx_ticket_scans_ticket_id ON ticket_scans(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_event_id ON ticket_scans(event_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_user_id ON ticket_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_scans_created_at ON ticket_scans(created_at);

-- ============================================================================
-- PRIORITY 2: spray_money table
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

CREATE INDEX IF NOT EXISTS idx_spray_money_event_id ON spray_money(event_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_sender_id ON spray_money(sender_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_recipient_id ON spray_money(recipient_id);
CREATE INDEX IF NOT EXISTS idx_spray_money_created_at ON spray_money(created_at);

-- ============================================================================
-- PRIORITY 3: interaction_logs table
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

CREATE INDEX IF NOT EXISTS idx_interaction_logs_user_id ON interaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_event_id ON interaction_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_type ON interaction_logs(interaction_type);
CREATE INDEX IF NOT EXISTS idx_interaction_logs_created_at ON interaction_logs(created_at);

-- ============================================================================
-- PRIORITY 3: notifications table
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

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- SUMMARY
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'ALL 4 TABLES CREATED SUCCESSFULLY';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Priority 1: ticket_scans - CREATED (no RLS)';
  RAISE NOTICE 'Priority 2: spray_money - CREATED (no RLS)';
  RAISE NOTICE 'Priority 3: interaction_logs - CREATED (no RLS)';
  RAISE NOTICE 'Priority 3: notifications - CREATED (no RLS)';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'NOTE: RLS is NOT enabled. Tables are accessible via service role key.';
  RAISE NOTICE 'You can enable RLS later if needed for additional security.';
  RAISE NOTICE '============================================================================';
END $$;
