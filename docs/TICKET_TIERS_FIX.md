# Ticket Tiers Issues - Fix Guide

## 🐛 Issues Identified

### Issue 1: Failed to update tiers
**Error**: "Failed to update tiers: Unknown error"
**Location**: Organizer Dashboard → Edit Ticket Tiers

**Root Cause**:
- Frontend calls `PUT /api/events/{event_id}` on port 8000 (simple_main.py)
- simple_main.py doesn't have an update event endpoint
- main.py (port 8001) also doesn't have an update event endpoint

### Issue 2: Unable to see ticket tiers
**Error**: Ticket tiers not displayed on event detail page
**Location**: Attendee Dashboard → Event Detail

**Root Cause**:
- Frontend calls `GET /api/events/{event_id}` on port 8000 (simple_main.py)
- simple_main.py doesn't have events endpoints at all
- Frontend is hardcoded to use port 8000 instead of 8001 (main.py)

---

## 🔧 Solution

### Step 1: Add Update Event Endpoint to main.py

Add this endpoint to `apps/backend-fastapi/routers/events.py`:

```python
@router.put("/{event_id}")
async def update_event(
    event_id: str,
    event_data: dict,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Update event details (organizer only)
    """
    try:
        # Verify organizer owns the event
        event = await event_service.get_event_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "EVENT_NOT_FOUND",
                        "message": "Event not found",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        if event['organizer_id'] != current_user['user_id']:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "ACCESS_DENIED",
                        "message": "You don't have permission to update this event",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        # Update event
        result = await event_service.update_event(event_id, event_data)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": "Event updated successfully",
            "data": result['data']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to update event",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
```

### Step 2: Add Update Method to Event Service

Add this method to `apps/backend-fastapi/services/event_service.py`:

```python
async def update_event(self, event_id: str, event_data: dict) -> dict:
    """Update event details"""
    try:
        # Prepare update data
        update_data = {}
        
        # Handle ticket tiers
        if 'ticketTiers' in event_data:
            update_data['ticket_tiers'] = event_data['ticketTiers']
        
        # Handle other fields
        allowed_fields = ['title', 'description', 'venue', 'start_date', 'category', 'status']
        for field in allowed_fields:
            if field in event_data:
                update_data[field] = event_data[field]
        
        # Update in Supabase
        result = self.supabase.table('events')\
            .update(update_data)\
            .eq('id', event_id)\
            .execute()
        
        if not result.data:
            return {
                "success": False,
                "error": {
                    "code": "UPDATE_FAILED",
                    "message": "Failed to update event"
                }
            }
        
        return {
            "success": True,
            "data": result.data[0]
        }
        
    except Exception as e:
        logger.error(f"Error updating event: {e}")
        return {
            "success": False,
            "error": {
                "code": "UPDATE_ERROR",
                "message": str(e)
            }
        }
```

### Step 3: Ensure Tickets are Fetched with Events

Update `get_event_by_id` in event_service to include tickets:

```python
async def get_event_by_id(self, event_id: str) -> dict:
    """Get event by ID with tickets"""
    try:
        # Get event
        result = self.supabase.table('events')\
            .select('*, organizer:users(first_name, last_name)')\
            .eq('id', event_id)\
            .single()\
            .execute()
        
        if not result.data:
            return None
        
        event = result.data
        
        # Get tickets for this event
        tickets_result = self.supabase.table('tickets')\
            .select('*')\
            .eq('event_id', event_id)\
            .execute()
        
        # Group tickets by tier to create ticketTiers
        if tickets_result.data:
            tiers_map = {}
            for ticket in tickets_result.data:
                tier_name = ticket.get('tier_name', 'General')
                if tier_name not in tiers_map:
                    tiers_map[tier_name] = {
                        'name': tier_name,
                        'price': ticket.get('price', 0),
                        'quantity': 0,
                        'sold': 0
                    }
                tiers_map[tier_name]['quantity'] += 1
                if ticket.get('status') == 'sold':
                    tiers_map[tier_name]['sold'] += 1
            
            event['ticketTiers'] = list(tiers_map.values())
        else:
            # Use ticket_tiers from event if available
            event['ticketTiers'] = event.get('ticket_tiers', [])
        
        # Format organizer name
        if event.get('organizer'):
            event['organizer_name'] = f"{event['organizer']['first_name']} {event['organizer']['last_name']}"
        
        return event
        
    except Exception as e:
        logger.error(f"Error getting event: {e}")
        return None
```

### Step 4: Update Frontend to Use Port 8001

**Option A: Add Environment Variable (Recommended)**

1. Update `apps/frontend/.env`:
```env
VITE_API_URL=http://localhost:8001
```

2. Create `apps/frontend/src/config/api.ts`:
```typescript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
```

3. Update components to use API_URL:
```typescript
import { API_URL } from '../../config/api';

// Instead of:
const response = await fetch(`http://localhost:8000/api/events/${eventId}`);

// Use:
const response = await fetch(`${API_URL}/api/events/${eventId}`);
```

**Option B: Quick Fix (Update Hardcoded URLs)**

Find and replace in these files:
- `apps/frontend/src/components/organizer/TicketTierManager.tsx`
- `apps/frontend/src/pages/EventDetail.tsx`
- Any other files using `http://localhost:8000`

Change:
```typescript
http://localhost:8000/api/
```

To:
```typescript
http://localhost:8001/api/
```

---

## 📝 Implementation Steps

### Backend Changes

1. Add update endpoint to events router
2. Add update method to event service
3. Update get_event_by_id to include tickets
4. Restart main.py

### Frontend Changes

1. Add VITE_API_URL to .env
2. Create api config file
3. Update TicketTierManager to use API_URL
4. Update EventDetail to use API_URL
5. Restart frontend

---

## 🧪 Testing

### Test Update Tiers

1. Login as organizer
2. Go to organizer dashboard
3. Click on an event
4. Edit ticket tiers
5. Save changes
6. Verify success message

### Test View Tiers

1. Login as attendee
2. Go to events page
3. Click on an event
4. Verify ticket tiers are displayed
5. Verify can select tier and quantity

---

## ⚠️ Important Notes

### Database Schema

Make sure the `events` table has a `ticket_tiers` column:
```sql
ALTER TABLE events ADD COLUMN IF NOT EXISTS ticket_tiers JSONB;
```

### Ticket Tiers Format

Ticket tiers should be stored as JSON:
```json
[
  {
    "name": "Early Bird",
    "price": 5000,
    "quantity": 100,
    "sold": 25
  },
  {
    "name": "Regular",
    "price": 7500,
    "quantity": 200,
    "sold": 50
  }
]
```

---

## 🎯 Quick Fix (Immediate)

If you need a quick fix right now:

1. **Update TicketTierManager.tsx line 60**:
```typescript
// Change from:
const response = await authenticatedFetch(`http://localhost:8000/api/events/${event.id}`, {

// To:
const response = await authenticatedFetch(`http://localhost:8001/api/events/${event.id}`, {
```

2. **Update EventDetail.tsx line 58**:
```typescript
// Change from:
const response = await fetch(`http://localhost:8000/api/events/${eventId}`);

// To:
const response = await fetch(`http://localhost:8001/api/events/${eventId}`);
```

3. **Restart frontend**:
```bash
cd apps/frontend
npm run dev
```

This will at least make the frontend call the correct backend (main.py) which has the events endpoints.

---

## 🔍 Root Cause Summary

1. **simple_main.py (port 8000)** doesn't have events endpoints
2. **main.py (port 8001)** has events endpoints but no update endpoint
3. **Frontend** is hardcoded to use port 8000
4. **Ticket tiers** may not be included in event responses

**Solution**: Use main.py (port 8001) and add missing endpoints.

---

Would you like me to implement these fixes now?
