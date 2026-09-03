-- ============================================
-- SECRET EVENTS DATABASE MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Secret events table
CREATE TABLE IF NOT EXISTS secret_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    organizer_id UUID REFERENCES users(id),
    
    -- Location Management
    secret_venue TEXT NOT NULL,
    public_venue TEXT DEFAULT 'Lagos Island',
    location_reveal_time TIMESTAMP WITH TIME ZONE,
    location_revealed BOOLEAN DEFAULT FALSE,
    
    -- Progressive Location Reveal (Feature #1)
    location_hint_24h TEXT DEFAULT 'Lagos Island',
    location_hint_12h TEXT DEFAULT 'Victoria Island Area',
    location_hint_6h TEXT DEFAULT 'Adeola Odeku Street',
    location_hint_2h TEXT, -- Full address
    
    -- Access Control
    premium_tier_required VARCHAR(20) DEFAULT 'premium',
    master_invite_code VARCHAR(8) UNIQUE NOT NULL,
    max_attendees INTEGER DEFAULT 100,
    current_attendees INTEGER DEFAULT 0,
    
    -- Privacy Settings
    anonymous_purchases_allowed BOOLEAN DEFAULT TRUE,
    attendee_list_hidden BOOLEAN DEFAULT TRUE,
    
    -- Discovery Feed (Feature #2)
    discoverable BOOLEAN DEFAULT TRUE,
    teaser_description TEXT,
    category VARCHAR(50),
    vibe VARCHAR(100),
    
    -- Metadata
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Invite codes table
CREATE TABLE IF NOT EXISTS secret_event_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID,
    secret_event_id UUID REFERENCES secret_events(id) ON DELETE CASCADE,
    code VARCHAR(8) UNIQUE NOT NULL,
    created_by UUID REFERENCES users(id),
    
    -- Usage Tracking
    max_uses INTEGER DEFAULT 1,
    used_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Analytics
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE,
    last_used_by UUID REFERENCES users(id)
);

-- 3. Anonymous tickets table
CREATE TABLE IF NOT EXISTS anonymous_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    secret_event_id UUID REFERENCES secret_events(id),
    tier_id UUID,
    
    -- Buyer Info (optional for anonymity)
    buyer_id UUID REFERENCES users(id),
    buyer_email VARCHAR(255),
    is_anonymous BOOLEAN DEFAULT TRUE,
    
    -- Ticket Details
    purchase_code VARCHAR(12) UNIQUE NOT NULL,
    ticket_code VARCHAR(12) UNIQUE, -- For QR code
    price DECIMAL(10, 2),
    tier_name VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    
    -- QR Code
    qr_code_data TEXT,
    
    -- Metadata
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    used_at TIMESTAMP WITH TIME ZONE,
    used_by VARCHAR(255)
);

-- 4. Invite requests table (Feature #2 - Discovery Feed)
CREATE TABLE IF NOT EXISTS secret_event_invite_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_event_id UUID REFERENCES secret_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Request Details
    message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, denied
    
    -- Response
    responded_by UUID REFERENCES users(id),
    response_message TEXT,
    invite_code VARCHAR(8),
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE
);

-- 5. Location reveal notifications (Feature #6)
CREATE TABLE IF NOT EXISTS secret_event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secret_event_id UUID REFERENCES secret_events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    -- Notification Details
    notification_type VARCHAR(50), -- location_reveal, invite_code, event_reminder
    title TEXT,
    message TEXT,
    
    -- Delivery
    sent_via_email BOOLEAN DEFAULT FALSE,
    sent_via_push BOOLEAN DEFAULT FALSE,
    sent_via_sms BOOLEAN DEFAULT FALSE,
    
    -- Status
    is_read BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_secret_events_organizer ON secret_events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_secret_events_status ON secret_events(status);
CREATE INDEX IF NOT EXISTS idx_secret_events_discoverable ON secret_events(discoverable) WHERE discoverable = TRUE;
CREATE INDEX IF NOT EXISTS idx_secret_invites_code ON secret_event_invites(code);
CREATE INDEX IF NOT EXISTS idx_secret_invites_event ON secret_event_invites(secret_event_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_tickets_event ON anonymous_tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_tickets_code ON anonymous_tickets(purchase_code);
CREATE INDEX IF NOT EXISTS idx_anonymous_tickets_ticket_code ON anonymous_tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_invite_requests_user ON secret_event_invite_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_requests_event ON secret_event_invite_requests(secret_event_id);
CREATE INDEX IF NOT EXISTS idx_invite_requests_status ON secret_event_invite_requests(status);
CREATE INDEX IF NOT EXISTS idx_secret_notifications_user ON secret_event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_secret_notifications_read ON secret_event_notifications(is_read);

-- Row Level Security (RLS) Policies
ALTER TABLE secret_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_event_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_event_invite_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE secret_event_notifications ENABLE ROW LEVEL SECURITY;

-- Secret Events Policies
CREATE POLICY "Organizers can view their own secret events"
    ON secret_events FOR SELECT
    USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can create secret events"
    ON secret_events FOR INSERT
    WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own secret events"
    ON secret_events FOR UPDATE
    USING (auth.uid() = organizer_id);

-- Invite Codes Policies
CREATE POLICY "Users can view invite codes they created or used"
    ON secret_event_invites FOR SELECT
    USING (auth.uid() = created_by OR auth.uid() = last_used_by);

-- Anonymous Tickets Policies
CREATE POLICY "Users can view their own anonymous tickets"
    ON anonymous_tickets FOR SELECT
    USING (auth.uid() = buyer_id OR is_anonymous = FALSE);

-- Invite Requests Policies
CREATE POLICY "Users can view their own invite requests"
    ON secret_event_invite_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create invite requests"
    ON secret_event_invite_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can view their own notifications"
    ON secret_event_notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON secret_event_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Run this SQL in Supabase SQL Editor
-- 2. Verify tables were created successfully
-- 3. Test RLS policies
-- ============================================
