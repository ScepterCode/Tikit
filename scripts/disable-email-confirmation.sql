-- Disable email confirmation for development
-- Run this in your Supabase SQL Editor to allow login without email confirmation

-- This is safe for development but should be re-enabled for production
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;

-- Optional: Disable email confirmation requirement globally
-- (This affects new registrations going forward)
-- You can do this in Supabase Dashboard → Authentication → Settings
-- Set "Enable email confirmations" to OFF