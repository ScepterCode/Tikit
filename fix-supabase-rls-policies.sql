-- Fix RLS Policies for User Registration
-- This script updates the Row Level Security policies to allow user registration

-- Drop existing restrictive policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Service role has full access to users" ON users;

-- Create more permissive policies for user registration
CREATE POLICY "Enable insert for authenticated users only" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = id);

CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid()::text = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid()::text = id);

CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Also ensure anon users can insert during registration
CREATE POLICY "Enable insert for registration" ON users
  FOR INSERT WITH CHECK (true);

-- Alternative: Temporarily disable RLS for users table during testing
-- ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;