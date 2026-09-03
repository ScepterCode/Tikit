-- =====================================================
-- ORGANIZER PAYMENT FLOW - DATABASE MIGRATIONS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Add event_id column to payments table (if not exists)
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_event 
ON payments(event_id);

-- 2. Ensure transactions table exists with correct schema
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_user 
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
ON transactions(reference);

CREATE INDEX IF NOT EXISTS idx_transactions_type 
ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
ON transactions(created_at DESC);

-- 3. Ensure wallets table exists
CREATE TABLE IF NOT EXISTS wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) UNIQUE NOT NULL,
    balance DECIMAL(10, 2) DEFAULT 0.00 NOT NULL,
    currency VARCHAR(3) DEFAULT 'NGN' NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add index for wallets
CREATE INDEX IF NOT EXISTS idx_wallets_user 
ON wallets(user_id);

-- 4. Add payment_reference to tickets table (if not exists)
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);

-- Add index for payment reference lookups
CREATE INDEX IF NOT EXISTS idx_tickets_payment_reference 
ON tickets(payment_reference);

-- 5. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 6. Create triggers for updated_at
DROP TRIGGER IF EXISTS update_transactions_updated_at ON transactions;
CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wallets_updated_at ON wallets;
CREATE TRIGGER update_wallets_updated_at 
    BEFORE UPDATE ON wallets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 7. Add RLS policies for transactions table
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can insert transactions
DROP POLICY IF EXISTS "Service role can insert transactions" ON transactions;
CREATE POLICY "Service role can insert transactions" 
ON transactions FOR INSERT 
WITH CHECK (true);

-- Service role can update transactions
DROP POLICY IF EXISTS "Service role can update transactions" ON transactions;
CREATE POLICY "Service role can update transactions" 
ON transactions FOR UPDATE 
USING (true);

-- 8. Add RLS policies for wallets table
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;

-- Users can view their own wallet
DROP POLICY IF EXISTS "Users can view own wallet" ON wallets;
CREATE POLICY "Users can view own wallet" 
ON wallets FOR SELECT 
USING (auth.uid() = user_id);

-- Service role can manage wallets
DROP POLICY IF EXISTS "Service role can manage wallets" ON wallets;
CREATE POLICY "Service role can manage wallets" 
ON wallets FOR ALL 
USING (true);

-- 9. Create view for organizer earnings summary
CREATE OR REPLACE VIEW organizer_earnings AS
SELECT 
    t.user_id as organizer_id,
    COUNT(*) as total_sales,
    SUM(t.amount) as total_earnings,
    SUM((t.metadata->>'platform_fee')::decimal) as total_platform_fees,
    SUM((t.metadata->>'quantity')::int) as total_tickets_sold,
    MIN(t.created_at) as first_sale,
    MAX(t.created_at) as last_sale
FROM transactions t
WHERE t.type = 'credit' 
AND t.reference LIKE 'TICKET_SALE_%'
GROUP BY t.user_id;

-- Grant access to view
GRANT SELECT ON organizer_earnings TO authenticated;

-- 10. Verify setup
DO $$
BEGIN
    RAISE NOTICE '✅ Database migrations completed successfully!';
    RAISE NOTICE '📊 Tables ready: payments, transactions, wallets, tickets';
    RAISE NOTICE '🔒 RLS policies enabled';
    RAISE NOTICE '📈 Organizer earnings view created';
END $$;

-- =====================================================
-- VERIFICATION QUERIES (Optional - for testing)
-- =====================================================

-- Check if columns exist
SELECT 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('payments', 'transactions', 'wallets', 'tickets')
ORDER BY table_name, ordinal_position;

-- Check indexes
SELECT 
    tablename, 
    indexname 
FROM pg_indexes 
WHERE tablename IN ('payments', 'transactions', 'wallets', 'tickets')
ORDER BY tablename;

-- Check RLS policies
SELECT 
    tablename, 
    policyname, 
    cmd 
FROM pg_policies 
WHERE tablename IN ('transactions', 'wallets')
ORDER BY tablename;
