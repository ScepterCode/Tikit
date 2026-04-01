-- ============================================
-- ADD TICKET_TIERS COLUMN TO EVENTS TABLE
-- ============================================
-- Run this SQL in Supabase Dashboard > SQL Editor
-- This will add support for multiple ticket tiers per event

-- Step 1: Add the ticket_tiers column
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ticket_tiers JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add a comment to document the structure
COMMENT ON COLUMN events.ticket_tiers IS 'Array of ticket tiers: [{"name": "VIP", "price": 5000, "quantity": 100, "sold": 0}]';

-- Step 3: Migrate existing events to have a default ticket tier
-- This creates a single tier from the legacy ticket_price, capacity, and tickets_sold fields
UPDATE events 
SET ticket_tiers = jsonb_build_array(
  jsonb_build_object(
    'name', 'General Admission',
    'price', COALESCE(ticket_price, 0),
    'quantity', COALESCE(capacity, 0),
    'sold', COALESCE(tickets_sold, 0)
  )
)
WHERE ticket_tiers IS NULL OR ticket_tiers = '[]'::jsonb;

-- Step 4: Verify the migration
SELECT 
  id, 
  title, 
  ticket_tiers,
  ticket_price,
  capacity
FROM events 
LIMIT 5;

-- ============================================
-- AFTER RUNNING THIS:
-- 1. All existing events will have a single "General Admission" tier
-- 2. New events can have multiple ticket tiers
-- 3. You'll need to recreate your event with 3 tiers
-- ============================================
