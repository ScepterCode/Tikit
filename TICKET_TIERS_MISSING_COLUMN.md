# Ticket Tiers Missing - Database Column Issue

## Problem
You created an event with 3 ticket tiers, but only 1 tier is showing. This is because:

1. ❌ The database `events` table doesn't have a `ticket_tiers` column
2. ❌ When you created the event, the `ticket_tiers` data was sent but couldn't be saved
3. ✅ The backend code is correct and ready to handle multiple tiers
4. ✅ The frontend is correct and can display multiple tiers

## What Happened
When you created your event with 3 tiers:
- Frontend sent: `ticketTiers: [{name: "VIP", price: 5000, ...}, {name: "Regular", ...}, {name: "Early Bird", ...}]`
- Backend tried to save it to `ticket_tiers` column
- Database rejected it because the column doesn't exist
- Event was created with only the legacy fields (`ticket_price`, `capacity`)

## Solution

### Step 1: Add the Database Column
Run the SQL in `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to SQL Editor
4. Copy and paste the SQL from `RUN_THIS_IN_SUPABASE_SQL_EDITOR.sql`
5. Click "Run"

This will:
- Add `ticket_tiers` JSONB column to events table
- Migrate existing events to have a default tier
- Enable support for multiple ticket tiers

### Step 2: Recreate Your Event
After running the SQL:

1. Delete the current event (or keep it as-is)
2. Create a new event with your 3 ticket tiers
3. The tiers will now be saved correctly
4. All 3 tiers will display on the event detail page

## Alternative: Manual Database Update
If you want to keep the existing event and just add the tiers manually:

```sql
-- Update your specific event with 3 tiers
UPDATE events 
SET ticket_tiers = '[
  {"name": "Early Bird", "price": 50, "quantity": 100, "sold": 0},
  {"name": "Regular", "price": 100, "quantity": 300, "sold": 0},
  {"name": "VIP", "price": 200, "quantity": 100, "sold": 0}
]'::jsonb
WHERE id = '59bf9756-83da-495b-bbef-940f6aa561ed';
```

Replace the tier names, prices, and quantities with your actual values.

## Why This Happened
The application was built with ticket tier support in the code, but the database migration to add the `ticket_tiers` column was never run. This is a common issue when:
- Database schema and code get out of sync
- Migrations are written but not executed
- Development happens across multiple environments

## Status
🔴 Database column missing - requires SQL execution
🟢 Backend code ready
🟢 Frontend code ready
🟢 Fallback logic working (shows 1 tier from legacy fields)

## Next Steps
1. Run the SQL migration in Supabase Dashboard
2. Recreate your event with 3 tiers
3. Verify all tiers display correctly
4. Test ticket purchase for each tier
