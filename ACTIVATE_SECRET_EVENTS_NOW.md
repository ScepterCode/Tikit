# 🚀 Activate Secret Events - 3 Simple Steps

## ⏱️ Total Time: 10 minutes

---

## Step 1: Run Database Migration (2 min)

### Instructions:

1. Open https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"
5. Open file: `SECRET_EVENTS_MIGRATION.sql`
6. Copy ALL contents (Ctrl+A, Ctrl+C)
7. Paste into Supabase SQL Editor
8. Click "Run" (or Ctrl+Enter)

### Expected Result:
```
Success. No rows returned
```

### Verify:
- Click "Table Editor"
- You should see 5 new tables:
  - secret_events ✅
  - secret_event_invites ✅
  - anonymous_tickets ✅
  - secret_event_invite_requests ✅
  - secret_event_notifications ✅

---

## Step 2: Restart Backend Server (30 sec)

### Instructions:

```bash
# Stop current server (press Ctrl+C in terminal)

# Restart server
cd apps/backend-fastapi
python main.py
```

### Expected Result:
```
INFO:     Started server process
INFO:     Waiting for application startup.
🚀 Starting Grooovy FastAPI Backend...
✅ Supabase connection successful
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Verify:
- Open http://localhost:8000/docs
- Look for section: "Secret Events"
- You should see 7 new endpoints

---

## Step 3: Test the System (5 min)

### Option A: Quick Manual Test

1. Open http://localhost:8000/docs
2. Click on "POST /api/secret-events/create"
3. Click "Try it out"
4. Use this test data:

```json
{
  "title": "Test Secret Event",
  "description": "Testing secret events",
  "venue": "123 Secret Street, Victoria Island, Lagos, Nigeria",
  "public_venue": "Lagos Island",
  "start_date": "2026-04-10T20:00:00Z",
  "category": "party",
  "premium_tier_required": "premium",
  "location_reveal_hours": 2,
  "max_attendees": 50,
  "price": 10000
}
```

5. Click "Execute"
6. Check response - should see master invite code!

### Option B: Automated Test Script

```bash
# Update credentials in test script first
# Edit: test_secret_events_phase1.py
# Set: ORGANIZER_EMAIL and ORGANIZER_PASSWORD

python test_secret_events_phase1.py
```

---

## ✅ Success Checklist

After completing all steps, verify:

- [ ] 5 new tables exist in Supabase
- [ ] Backend server running without errors
- [ ] `/api/secret-events/*` endpoints visible in docs
- [ ] Can create secret event (returns invite code)
- [ ] Can view discovery feed
- [ ] Can get location hints

---

## 🎉 You're Done!

Secret Events Phase 1 is now active! You can:

### As Organizer:
- Create secret events with progressive location reveal
- Generate invite codes
- Manage invite requests
- Track location reveal countdown

### As Attendee:
- Browse discovery feed
- Request invites
- Enter invite codes
- See progressive location hints
- VIP members get location 1 hour earlier!

---

## 🐛 Troubleshooting

### Migration Error: "relation already exists"
**Solution:** Tables already created. Skip migration or drop tables first.

### Server Error: "Cannot import secret_events"
**Solution:** Check file exists: `apps/backend-fastapi/routers/secret_events.py`

### API Error: "Premium membership required"
**Solution:** User needs premium/VIP tier in memberships table

### API Error: "Only organizers can create"
**Solution:** User needs `role = 'organizer'` in users table

---

## 📚 Need More Info?

- **Quick Guide:** `RUN_SECRET_EVENTS_MIGRATION.md`
- **Complete Details:** `SECRET_EVENTS_PHASE1_COMPLETE.md`
- **Summary:** `SECRET_EVENTS_PHASE1_SUMMARY.md`
- **Full Plan:** `SECRET_EVENTS_IMPLEMENTATION_PLAN.md`

---

## 🎯 What's Next?

After Phase 1 is working:

**Phase 2:** Frontend Components (1-2 hours)
- Location reveal countdown UI
- Discovery feed interface
- Invite request modals
- Secret event cards

**Phase 3:** Dashboard Integration (30 min)
- Add to organizer dashboard
- Add to attendee dashboard
- Navigation menu items

**Phase 4:** Separate Event Creation (20 min)
- Public vs Secret event selector
- Conditional form rendering

**Phase 5:** Notifications (25 min)
- Email templates
- Push notifications
- SMS alerts

---

## 🚀 Ready? Let's Go!

1. Open Supabase Dashboard
2. Run the migration
3. Restart backend
4. Test it out!

**Time to activate:** 10 minutes ⏱️

Good luck! 🎉
