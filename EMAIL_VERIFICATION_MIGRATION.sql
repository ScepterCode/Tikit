-- =====================================================
-- EMAIL VERIFICATION & 2FA - DATABASE MIGRATIONS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add email verification fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS verification_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(20) DEFAULT 'email'; -- 'email', 'sms', 'both'

-- 2. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(verification_token) 
WHERE verification_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_email_verified 
ON users(email_verified);

CREATE INDEX IF NOT EXISTS idx_users_two_factor 
ON users(two_factor_enabled);

-- 3. Create email queue table for async email sending
CREATE TABLE IF NOT EXISTS email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    html_body TEXT NOT NULL,
    text_body TEXT,
    email_type VARCHAR(50) NOT NULL, -- 'verification', 'otp', 'ticket', 'password_reset', 'reminder'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'cancelled'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    metadata JSONB, -- Store additional data like user_id, event_id, etc.
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Add indexes for email queue
CREATE INDEX IF NOT EXISTS idx_email_queue_status 
ON email_queue(status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_email_queue_created_at 
ON email_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_queue_email_type 
ON email_queue(email_type);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger for email queue
DROP TRIGGER IF EXISTS trigger_email_queue_updated_at ON email_queue;
CREATE TRIGGER trigger_email_queue_updated_at
    BEFORE UPDATE ON email_queue
    FOR EACH ROW
    EXECUTE FUNCTION update_email_queue_updated_at();

-- 7. Create OTP codes table for better tracking
CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(6) NOT NULL,
    purpose VARCHAR(50) NOT NULL, -- 'transaction', 'withdrawal', 'login', 'verification'
    delivery_method VARCHAR(20) NOT NULL, -- 'email', 'sms', 'both'
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'verified', 'expired', 'failed'
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 8. Add indexes for OTP codes
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id 
ON otp_codes(user_id);

CREATE INDEX IF NOT EXISTS idx_otp_codes_code 
ON otp_codes(code) 
WHERE status = 'sent';

CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at 
ON otp_codes(expires_at);

-- 9. Create function to clean up expired OTP codes
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
    UPDATE otp_codes 
    SET status = 'expired' 
    WHERE status IN ('pending', 'sent') 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 10. Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 11. Add indexes for password reset tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token 
ON password_reset_tokens(token) 
WHERE NOT used;

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id 
ON password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at 
ON password_reset_tokens(expires_at);

-- 12. Add RLS policies for email queue (admin only)
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can view email queue" ON email_queue;
CREATE POLICY "Admin can view email queue" 
ON email_queue FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.id = auth.uid() 
        AND users.role = 'admin'
    )
);

-- 13. Add RLS policies for OTP codes (users can view their own)
ALTER TABLE otp_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own OTP codes" ON otp_codes;
CREATE POLICY "Users can view own OTP codes" 
ON otp_codes FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can manage all OTP codes
DROP POLICY IF EXISTS "Service role can manage OTP codes" ON otp_codes;
CREATE POLICY "Service role can manage OTP codes" 
ON otp_codes FOR ALL 
USING (true);

-- 14. Add RLS policies for password reset tokens
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reset tokens" ON password_reset_tokens;
CREATE POLICY "Users can view own reset tokens" 
ON password_reset_tokens FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can manage all reset tokens
DROP POLICY IF EXISTS "Service role can manage reset tokens" ON password_reset_tokens;
CREATE POLICY "Service role can manage reset tokens" 
ON password_reset_tokens FOR ALL 
USING (true);

-- 15. Create view for email statistics
CREATE OR REPLACE VIEW email_statistics AS
SELECT 
    email_type,
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts,
    MIN(created_at) as first_sent,
    MAX(created_at) as last_sent
FROM email_queue
GROUP BY email_type, status;

-- Grant access to view
GRANT SELECT ON email_statistics TO authenticated;

-- 16. Create view for OTP statistics
CREATE OR REPLACE VIEW otp_statistics AS
SELECT 
    purpose,
    delivery_method,
    status,
    COUNT(*) as count,
    AVG(attempts) as avg_attempts,
    COUNT(CASE WHEN status = 'verified' THEN 1 END) as verified_count,
    COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_count
FROM otp_codes
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY purpose, delivery_method, status;

-- Grant access to view
GRANT SELECT ON otp_statistics TO authenticated;

-- 17. Update existing users to have email_verified = false
UPDATE users 
SET email_verified = FALSE 
WHERE email_verified IS NULL;

-- 18. Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ Email verification & 2FA migrations completed successfully!';
    RAISE NOTICE '📊 Tables ready: users (updated), email_queue, otp_codes, password_reset_tokens';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '📈 Statistics views created';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANT: Update your .env file with SMTP credentials:';
    RAISE NOTICE '   SMTP_HOST=smtp.gmail.com';
    RAISE NOTICE '   SMTP_PORT=587';
    RAISE NOTICE '   SMTP_USERNAME=your-email@gmail.com';
    RAISE NOTICE '   SMTP_PASSWORD=your-app-password';
    RAISE NOTICE '   EMAIL_FROM=noreply@tikit.app';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Check if columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('email_verified', 'verification_token', 'two_factor_enabled')
ORDER BY ordinal_position;

-- Check new tables
SELECT 
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_name IN ('email_queue', 'otp_codes', 'password_reset_tokens')
AND table_schema = 'public';

-- Check indexes
SELECT 
    tablename, 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('users', 'email_queue', 'otp_codes', 'password_reset_tokens')
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Check RLS policies
SELECT 
    tablename, 
    policyname, 
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('email_queue', 'otp_codes', 'password_reset_tokens')
ORDER BY tablename, policyname;

-- Check views
SELECT 
    table_name,
    view_definition
FROM information_schema.views
WHERE table_name IN ('email_statistics', 'otp_statistics')
AND table_schema = 'public';
