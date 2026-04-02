# Ticket Tiers Not Saving - Complete Fix

## Issue
Ticket tiers not displaying on event detail page, showing "No tickets available for this event"

## Root Cause
The backend wasn't transforming field names when CREATING events:
- Frontend sends: `ticketTiers` (camelCase)
- Database expects: `ticket_tiers` (snake_case)
- Result: Ticket tiers were never saved to database

## Fixes Applied

### 1. Create Event Transformation
**File**: `services/event_service.py` - `create_event()` method

```python
# Transform frontend field names to database field names
if 'ticketTiers' in event_data:
    event_data['ticket_tiers'] = event_data.pop('ticketTiers')

# Also set both organizer_id and host_id for consistency
event_data['organizer_id'] = organizer_id
event_data['host_id'] = organizer_id
```

### 2. Update Event Transformation
**File**: `services/event_service.py` - `update_event()` method

```python
# Handle field name transformations for database
if 'venue' in update_data:
    db_update['venue_name'] = update_data['venue']
    db_update['full_address'] = update_data['venue']
if 'start_date' in update_data:
    db_update['event_date'] = update_data['start_date']
if 'ticketTiers' in update_data:
    db_update['ticket_tiers'] = update_data['ticketTiers']
```

### 3. Read Event Transformation (Already Fixed)
**File**: `services/event_service.py` - `get_event_by_id()` and `get_events_feed()`

```python
# Transform database fields to frontend format
if 'ticket_tiers' in event and event['ticket_tiers']:
    event['ticketTiers'] = event['ticket_tiers']
if 'venue_name' in event:
    event['venue'] = event['venue_name']
if 'event_date' in event:
    event['start_date'] = event['event_date']
```

## Complete Field Mapping

| Frontend Field | Database Field | Direction |
|---------------|----------------|-----------|
| `ticketTiers` | `ticket_tiers` | Both ways |
| `venue` | `venue_name` | Both ways |
| `start_date` | `event_date` | Both ways |
| `organizer_id` | `host_id` | Both ways |

## What You Need To Do

### Option 1: Create a New Event (Recommended)
1. **Restart backend server**:
   ```bash
   # Stop current backend (Ctrl+C)
   cd apps/backend-fastapi
   python main.py
   ```

2. **Hard refresh browser** (Ctrl+Shift+R)

3. **Create a new event**:
   - Go to Organizer Dashboard → Create Event
   - Fill in all details
   - Add ticket tiers (e.g., VIP: ₦50,000, Regular: ₦25,000)
   - Submit

4. **View the new event**:
   - Go to event detail page
   - Ticket tiers should now display correctly
   - Purchase button should be enabled

### Option 2: Fix Existing Event via Supabase Dashboard
1. Open Supabase dashboard
2. Go to Table Editor → `events` table
3. Find your "Party Cruise" event
4. Edit the `ticket_tiers` column
5. Add JSON data:
   ```json
   [
     {
       "name": "VIP",
       "price": 50000,
       "quantity": 100,
       "sold": 0
     },
     {
       "name": "Regular",
       "price": 25000,
       "quantity": 200,
       "sold": 0
     }
   ]
   ```
6. Save
7. Refresh event detail page

## Expected Results

### Event Detail Page Should Show:
```
Party Cruise
by Organizer Name

📅 Date & Time
Sunday, April 5, 2026 at 06:31 PM

📍 Venue
Awoyaya New Road, Lagos.

About This Event
Come and share ideas

Get Your Tickets

┌─────────────────────────────────┐
│ VIP                             │
│ ₦50,000                         │
│ 100 tickets available           │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Regular                         │
│ ₦25,000                         │
│ 200 tickets available           │
└─────────────────────────────────┘

Quantity: [- 1 +]
Total: ₦50,000
[Purchase Tickets]
```

## Verification Steps

1. **Check Backend Logs**:
   ```
   INFO: ✅ Supabase client initialized
   INFO: 🔍 Creating event with data: {...}
   INFO: ✅ Event created with ticket_tiers
   ```

2. **Check Browser Console**:
   - Open DevTools (F12)
   - Network tab → Find POST to `/api/events`
   - Request payload should show `ticketTiers`
   - Response should confirm success

3. **Check Database**:
   - Supabase dashboard → events table
   - Find your event
   - `ticket_tiers` column should have JSON array

4. **Check Event Detail Page**:
   - Navigate to event
   - Ticket tiers should display
   - Can select tier and quantity
   - Purchase button enabled

## Troubleshooting

### If ticket tiers still don't show after creating new event:

1. **Check backend logs** for errors during event creation
2. **Check browser console** for API errors
3. **Verify in Supabase** that `ticket_tiers` column has data
4. **Check API response** in Network tab:
   ```json
   {
     "success": true,
     "data": {
       "id": "...",
       "title": "Party Cruise",
       "ticketTiers": [  // ✅ Should be present
         {"name": "VIP", "price": 50000, ...}
       ]
     }
   }
   ```

### If old events still don't show tiers:

This is expected! Old events were created before the fix, so they don't have `ticket_tiers` in the database. You need to either:
- Create new events (they will work)
- Manually add ticket_tiers to old events in Supabase

## Files Modified

1. `apps/backend-fastapi/services/event_service.py`
   - `create_event()` - Added ticketTiers → ticket_tiers transformation
   - `update_event()` - Enhanced field transformations
   - `get_event_by_id()` - Already had transformations
   - `get_events_feed()` - Already had transformations

## Summary

The complete data flow is now:

```
CREATE EVENT:
Frontend (ticketTiers) 
  → Backend transforms to (ticket_tiers) 
  → Supabase stores (ticket_tiers)

READ EVENT:
Supabase returns (ticket_tiers) 
  → Backend transforms to (ticketTiers) 
  → Frontend displays ticket tiers

UPDATE EVENT:
Frontend (ticketTiers) 
  → Backend transforms to (ticket_tiers) 
  → Supabase updates (ticket_tiers)
```

---

**Status**: Code Complete - Backend Restart Required
**Next Action**: Restart backend and create a NEW event to test
**Expected Time**: 5 minutes to create and verify new event
