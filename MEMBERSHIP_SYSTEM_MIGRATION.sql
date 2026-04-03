-- =====================================================
-- MEMBERSHIP SYSTEM MIGRATION
-- Three-Tier System: Regular, Special, Legend
-- =====================================================

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS membership_payments CASCADE;
DROP TABLE IF EXISTS membership_features CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;

-- =====================================================
-- 1. MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL DEFAULT 'regular' CHECK (tier IN ('regular', 'special', 'legend')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT,
  previous_tier TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. MEMBERSHIP PAYMENTS TABLE
-- =====================================================
CREATE TABLE membership_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('regular', 'special', 'legend')),
  payment_reference TEXT UNIQUE NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- 3. MEMBERSHIP FEATURES TABLE (Feature Access Log)
-- =====================================================
CREATE TABLE membership_features (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier TEXT NOT NULL CHECK (tier IN ('regular', 'special', 'legend')),
  feature_key TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. INDEXES
-- =====================================================
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_tier ON memberships(tier);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_expires_at ON memberships(expires_at);

CREATE INDEX idx_membership_payments_user_id ON membership_payments(user_id);
CREATE INDEX idx_membership_payments_membership_id ON membership_payments(membership_id);
CREATE INDEX idx_membership_payments_status ON membership_payments(status);
CREATE INDEX idx_membership_payments_created_at ON membership_payments(created_at);
CREATE INDEX idx_membership_payments_reference ON membership_payments(payment_reference);

CREATE INDEX idx_membership_features_tier ON membership_features(tier);
CREATE INDEX idx_membership_features_key ON membership_features(feature_key);

-- =====================================================
-- 5. INSERT DEFAULT FEATURES
-- =====================================================

-- Regular Tier Features
INSERT INTO membership_features (tier, feature_key, feature_name, feature_description) VALUES
('regular', 'create_public_events', 'Create Public Events', 'Create and manage public events'),
('regular', 'basic_analytics', 'Basic Analytics', 'View basic event analytics'),
('regular', 'standard_support', 'Standard Support', 'Email support during business hours'),
('regular', 'attendee_features', 'Attendee Features', 'Browse and purchase tickets');

-- Special Tier Features (includes all Regular features)
INSERT INTO membership_features (tier, feature_key, feature_name, feature_description) VALUES
('special', 'create_public_events', 'Create Public Events', 'Create and manage public events'),
('special', 'basic_analytics', 'Basic Analytics', 'View basic event analytics'),
('special', 'standard_support', 'Standard Support', 'Email support during business hours'),
('special', 'attendee_features', 'Attendee Features', 'Browse and purchase tickets'),
('special', 'secret_events', 'Secret Events', 'Create exclusive events with progressive location reveals'),
('special', 'priority_listing', 'Priority Event Listing', 'Events appear higher in search results'),
('special', 'custom_branding', 'Custom Event Branding', 'Add your logo and custom colors'),
('special', 'advanced_analytics', 'Advanced Analytics', 'Detailed insights and reports'),
('special', 'email_marketing', 'Email Marketing', 'Send up to 500 emails per month to attendees'),
('special', 'remove_branding', 'Remove Tikit Branding', 'Remove "Powered by Tikit" from your events');

-- Legend Tier Features (includes all Special features)
INSERT INTO membership_features (tier, feature_key, feature_name, feature_description) VALUES
('legend', 'create_public_events', 'Create Public Events', 'Create and manage public events'),
('legend', 'basic_analytics', 'Basic Analytics', 'View basic event analytics'),
('legend', 'standard_support', 'Standard Support', 'Email support during business hours'),
('legend', 'attendee_features', 'Attendee Features', 'Browse and purchase tickets'),
('legend', 'secret_events', 'Secret Events', 'Create exclusive events with progressive location reveals'),
('legend', 'priority_listing', 'Priority Event Listing', 'Events appear higher in search results'),
('legend', 'custom_branding', 'Custom Event Branding', 'Add your logo and custom colors'),
('legend', 'advanced_analytics', 'Advanced Analytics', 'Detailed insights and reports'),
('legend', 'email_marketing', 'Email Marketing', 'Unlimited email marketing to attendees'),
('legend', 'remove_branding', 'Remove Tikit Branding', 'Remove "Powered by Tikit" from your events'),
('legend', 'ai_assistant', 'AI Event Assistant', 'AI-powered event recommendations and automated responses'),
('legend', 'marketing_automation', 'Marketing Automation', 'Automated marketing campaigns and workflows'),
('legend', 'sms_marketing', 'SMS Marketing', 'Send SMS campaigns to attendees'),
('legend', 'ai_analytics', 'AI-Powered Analytics', 'Advanced AI insights and predictions'),
('legend', 'priority_support', 'Priority Support', '24/7 priority support'),
('legend', 'white_label', 'White Label', 'Remove all Tikit branding and use your own'),
('legend', 'api_access', 'API Access', 'Full API access for custom integrations'),
('legend', 'custom_domain', 'Custom Domain', 'Use your own domain for event pages');

-- =====================================================
-- 6. CREATE DEFAULT MEMBERSHIPS FOR EXISTING USERS
-- =====================================================
INSERT INTO memberships (user_id, tier, status, started_at)
SELECT id, 'regular', 'active', NOW()
FROM users
WHERE id NOT IN (SELECT user_id FROM memberships WHERE user_id IS NOT NULL);

-- =====================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_features ENABLE ROW LEVEL SECURITY;

-- Memberships policies
CREATE POLICY "Users can view their own membership"
  ON memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own membership"
  ON memberships FOR UPDATE
  USING (auth.uid() = user_id);

-- Membership payments policies
CREATE POLICY "Users can view their own payments"
  ON membership_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON membership_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Membership features policies (public read)
CREATE POLICY "Anyone can view membership features"
  ON membership_features FOR SELECT
  TO public
  USING (true);

-- Admin policies
CREATE POLICY "Admins can view all memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can view all payments"
  ON membership_payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- =====================================================
-- 8. FUNCTIONS
-- =====================================================

-- Function to check if user has feature access
CREATE OR REPLACE FUNCTION has_feature_access(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_tier TEXT;
  v_has_access BOOLEAN;
BEGIN
  -- Get user's current tier
  SELECT tier INTO v_tier
  FROM memberships
  WHERE user_id = p_user_id
  AND status = 'active';
  
  -- If no membership found, default to regular
  IF v_tier IS NULL THEN
    v_tier := 'regular';
  END IF;
  
  -- Check if feature exists for this tier
  SELECT EXISTS (
    SELECT 1
    FROM membership_features
    WHERE tier = v_tier
    AND feature_key = p_feature_key
    AND is_enabled = true
  ) INTO v_has_access;
  
  RETURN v_has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get membership revenue stats
CREATE OR REPLACE FUNCTION get_membership_revenue_stats()
RETURNS TABLE (
  total_revenue DECIMAL,
  monthly_revenue DECIMAL,
  special_count BIGINT,
  legend_count BIGINT,
  regular_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN mp.status = 'completed' THEN mp.amount ELSE 0 END), 0) as total_revenue,
    COALESCE(SUM(CASE 
      WHEN mp.status = 'completed' 
      AND mp.created_at >= NOW() - INTERVAL '30 days' 
      THEN mp.amount 
      ELSE 0 
    END), 0) as monthly_revenue,
    COUNT(CASE WHEN m.tier = 'special' AND m.status = 'active' THEN 1 END) as special_count,
    COUNT(CASE WHEN m.tier = 'legend' AND m.status = 'active' THEN 1 END) as legend_count,
    COUNT(CASE WHEN m.tier = 'regular' AND m.status = 'active' THEN 1 END) as regular_count
  FROM memberships m
  LEFT JOIN membership_payments mp ON m.id = mp.membership_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. TRIGGERS
-- =====================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_membership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_membership_timestamp
  BEFORE UPDATE ON memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_membership_updated_at();

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify migration
SELECT 'Memberships table created' as status, COUNT(*) as count FROM memberships
UNION ALL
SELECT 'Membership payments table created', COUNT(*) FROM membership_payments
UNION ALL
SELECT 'Membership features inserted', COUNT(*) FROM membership_features;
