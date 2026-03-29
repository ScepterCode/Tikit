-- ============================================================================
-- FIX USER STORAGE: Create Database Trigger
-- ============================================================================
-- This script creates a trigger that automatically creates a user profile
-- in the 'users' table whenever a new user signs up via Supabase Auth
-- ============================================================================

-- Step 1: Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert new user profile when auth user is created
  INSERT INTO public.users (
    id,
    email,
    phone,
    first_name,
    last_name,
    wallet_balance,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'lastName', ''),
    0.00,  -- Initialize wallet balance to 0
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Prevent duplicate key errors
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 3: Create trigger to call function when new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Verify trigger was created
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- If you see the trigger details above, the trigger was created successfully!
-- Now run the backfill script to create profiles for existing users.
-- ============================================================================
