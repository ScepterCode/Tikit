# 🚀 Run Secret Events Migration - Quick Guide

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### 2. Run the Migration

1. Click "New Query" button
2. Open the file `SECRET_EVENTS_MIGRATION.sql` in your code editor
3. Copy ALL the contents (Ctrl+A, Ctrl+C)
4. Paste into the Supabase SQL Editor
5. Click "Run" button (or press Ctrl+Enter)

### 3. Verify Tables Were Created

After running the migration, you should see:

```
Success. No rows returned
```

Then verify the tables exist:

1. Click "Table Editor" in the left sidebar
2. You should see these new tables:
   - `secret_events`
   - `secret_event_invites`
   - `anonymous_tickets`
   - `secret_event_invite_requests`
   - `secret_event_notifications`

### 4. Check Table Structure

Click on each table to verify columns:

**secret_events:**
- id, event_id, organizer_id
- secret_venue, public_venue
- location_hint_24h, location_hint_12h, location_hint_6h, location_hint_2h
- location_reveal_time, location_revealed
- premium_tier_required, master_invite_code
- max_attendees, current_attendees
- anonymous_purchases_allowed, attendee_list_hidden
- discoverable, teaser_description, category, vibe
- status, created_at, updated_at

**secret_event_invites:**
- id, event_id, secret_event_id, code
- created_by, max_uses, used_count
- expires_at, created_at, last_used_at, last_used_by

**anonymous_tickets:**
- id, event_id, secret_event_id, tier_id
- buyer_id, buyer_email, is_anonymous
- purchase_code, ticket_code
- price, tier_name, status
- qr_code_data
- purchased_at, used_at, used_by

**secret_event_invite_requests:**
- id, secret_event_id, user_id
- message, status
- responded_by, response_message, invite_code
- requested_at, responded_at

**secret_event_notifications:**
- id, secret_event_id, user_id
- notification_type, title, message
- sent_via_email, sent_via_push, sent_via_sms
- is_read, sent_at, read_at

### 5. Verify RLS Policies

1. Click on any table
2. Click "Policies" tab
3. You should see policies like:
   - "Organizers can view their own secret events"
   - "Users can view their own notifications"
   - etc.

---

## Troubleshooting

### Error: "relation already exists"

This means the tables were already created. You have two options:

**Option A: Drop and recreate (CAUTION: Deletes all data)**
```sql
DROP TABLE IF EXISTS secret_event_notifications CASCADE;
DROP TABLE IF EXISTS secret_event_invite_requests CASCADE;
DROP TABLE IF EXISTS anonymous_tickets CASCADE;
DROP TABLE IF EXISTS secret_event_invites CASCADE;
DROP TABLE IF EXISTS secret_events CASCADE;
```

Then run the migration again.

**Option B: Skip migration**
If tables already exist and have the correct structure, you can skip the migration.

### Error: "column does not exist"

The migration may have partially run. Drop all tables and run again.

### Error: "permission denied"

Make sure you're logged into the correct Supabase project with admin access.

---

## After Migration

Once migration is complete:

1. ✅ Restart your backend server
2. ✅ Run the test script: `python test_secret_events_phase1.py`
3. ✅ Check the API docs: http://localhost:8000/docs
4. ✅ Look for `/api/secret-events/*` endpoints

---

## Quick Test

After migration, test with this SQL query:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'secret_%';
```

You should see 4 tables:
- secret_events
- secret_event_invites
- secret_event_invite_requests
- secret_event_notifications

---

## Next Steps

After successful migration:

1. Read `SECRET_EVENTS_PHASE1_COMPLETE.md` for full details
2. Update test credentials in `test_secret_events_phase1.py`
3. Run the test script
4. Proceed to Phase 2 (Frontend Implementation)

---

## Need Help?

If you encounter issues:

1. Check Supabase logs in the dashboard
2. Verify your user has organizer role
3. Verify your user has premium membership
4. Check backend server logs for errors
5. Try the test script with detailed error messages

**Migration File:** `SECRET_EVENTS_MIGRATION.sql`
**Test Script:** `test_secret_events_phase1.py`
**Complete Guide:** `SECRET_EVENTS_PHASE1_COMPLETE.md`
