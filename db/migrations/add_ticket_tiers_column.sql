-- Add ticket_tiers column to events table
-- This column stores structured ticket tier information as JSONB

ALTER TABLE events 
ADD COLUMN IF NOT EXISTS ticket_tiers JSONB DEFAULT '[]'::jsonb;

-- Add a comment to document the structure
COMMENT ON COLUMN events.ticket_tiers IS 'Array of ticket tiers with structure: [{"name": "VIP", "price": 5000, "quantity": 100, "sold": 0}]';

-- Update existing events to have a default ticket tier based on ticket_price
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
