-- Add ticket_code column to tickets table
-- This column stores the unique 11-character ticket code (XXXX-1234567)

ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(12) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);

-- Add comment
COMMENT ON COLUMN tickets.ticket_code IS 'Unique 11-character ticket code in format XXXX-1234567 (4 letters - 7 numbers)';
