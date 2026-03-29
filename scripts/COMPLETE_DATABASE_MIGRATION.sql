-- =====================================================
-- TIKIT COMPLETE DATABASE MIGRATION
-- Creates all missing tables for full functionality
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Create wallet_balances table
CREATE TABLE IF NOT EXISTS wallet_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    wallet_type VARCHAR(50) DEFAULT 'main',
    balance DECIMAL(12,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'NGN',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, wallet_type)
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create secret_events table
CREATE TABLE IF NOT EXISTS secret_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    access_code VARCHAR(50) UNIQUE NOT NULL,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create memberships table
CREATE TABLE IF NOT EXISTS memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    membership_type VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'active',
    expires_at TIMESTAMP WITH TIME ZONE,
    features JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES events(id),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100),
    data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CREATE PERFORMANCE INDEXES
-- =====================================================

-- Wallet balances indexes
CREATE INDEX IF NOT EXISTS idx_wallet_balances_user ON wallet_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_balances_type ON wallet_balances(wallet_type);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Chat messages indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_event ON chat_messages(event_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at);

-- Secret events indexes
CREATE INDEX IF NOT EXISTS idx_secret_events_event ON secret_events(event_id);
CREATE INDEX IF NOT EXISTS idx_secret_events_code ON secret_events(access_code);

-- Memberships indexes
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_memberships_type ON memberships(membership_type);
CREATE INDEX IF NOT EXISTS idx_memberships_status ON memberships(status);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event_id);
CREATE INDEX IF NOT EXISTS idx_analytics_user ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_action ON analytics(action);

-- =====================================================
-- INSERT SAMPLE DATA (OPTIONAL)
-- =====================================================

-- Insert default wallet balances for existing users
INSERT INTO wallet_balances (user_id, wallet_type, balance, currency)
SELECT id, 'main', wallet_balance, 'NGN' 
FROM users 
WHERE id NOT IN (SELECT user_id FROM wallet_balances WHERE wallet_type = 'main')
ON CONFLICT (user_id, wallet_type) DO NOTHING;

-- Insert basic membership for all users
INSERT INTO memberships (user_id, membership_type, status)
SELECT id, 'basic', 'active'
FROM users
WHERE id NOT IN (SELECT user_id FROM memberships)
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify all tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'users', 'events', 'tickets', 'wallet_balances', 
    'notifications', 'chat_messages', 'secret_events', 
    'memberships', 'sessions', 'analytics'
)
ORDER BY tablename;

-- Count records in each table
SELECT 
    'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 
    'events' as table_name, COUNT(*) as record_count FROM events
UNION ALL
SELECT 
    'tickets' as table_name, COUNT(*) as record_count FROM tickets
UNION ALL
SELECT 
    'wallet_balances' as table_name, COUNT(*) as record_count FROM wallet_balances
UNION ALL
SELECT 
    'notifications' as table_name, COUNT(*) as record_count FROM notifications
UNION ALL
SELECT 
    'chat_messages' as table_name, COUNT(*) as record_count FROM chat_messages
UNION ALL
SELECT 
    'secret_events' as table_name, COUNT(*) as record_count FROM secret_events
UNION ALL
SELECT 
    'memberships' as table_name, COUNT(*) as record_count FROM memberships
UNION ALL
SELECT 
    'sessions' as table_name, COUNT(*) as record_count FROM sessions
UNION ALL
SELECT 
    'analytics' as table_name, COUNT(*) as record_count FROM analytics
ORDER BY table_name;

-- =====================================================
-- MIGRATION COMPLETE
-- All tables and indexes created successfully
-- =====================================================