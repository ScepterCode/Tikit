# 🚀 Secret Events - Quick Start Guide

## 3-Step Activation

### Step 1: Run Database Migration (2 minutes)

1. Open https://supabase.com/dashboard
2. Go to SQL Editor
3. Copy all contents from `SECRET_EVENTS_MIGRATION.sql`
4. Paste and click "Run"
5. Verify 5 tables created

### Step 2: Restart Backend (30 seconds)

```bash
# Stop current server (Ctrl+C)
cd apps/backend-fastapi
python main.py
```

### Step 3: Test It Out (2 minutes)

**As Organizer:**
1. Go to http://localhost:3000/organizer/create-event
2. Select "Secret Event"
3. Fill in details
4. Get master invite code
5. Share with attendees

**As Attendee:**
1. Go to http://localhost:3000/attendee/secret-events
2. Enter invite code
3. See event with countdown
4. Watch location reveal progressively

---

## Quick Reference

### For Attendees:
- **Access:** Sidebar → Secret Events
- **Enter Code:** 8-character uppercase code
- **Browse:** Discovery tab → Request invites
- **View:** See countdown and progressive hints

### For Organizers:
- **Create:** Create Event → Select "Secret Event"
- **Manage:** Secret Events page → View requests
- **Share:** Copy master invite code
- **Approve:** View requests → Approve/Deny

---

## Key Features

✅ Progressive location reveal (24h → 12h → 6h → 2h)
✅ VIP early access (1 hour earlier)
✅ Discovery feed with search
✅ Invite request system
✅ Anonymous tickets
✅ Premium gating

---

## Files to Know

- `SECRET_EVENTS_MIGRATION.sql` - Run this first
- `SECRET_EVENTS_COMPLETE.md` - Full documentation
- `test_secret_events_phase1.py` - Test script

---

## Troubleshooting

**Tables not created?**
→ Check Supabase SQL Editor for errors

**Endpoints not working?**
→ Restart backend server

**Premium check failing?**
→ Verify user has premium/vip membership

**Pages not loading?**
→ Check routes in App.tsx

---

## Success Checklist

- [ ] Database migration ran successfully
- [ ] Backend server running without errors
- [ ] Can access /attendee/secret-events
- [ ] Can access /organizer/secret-events
- [ ] Menu items show in sidebar
- [ ] Can create secret event
- [ ] Can enter invite code
- [ ] Countdown timer updates

---

**Ready to go!** 🎉

See `SECRET_EVENTS_COMPLETE.md` for full documentation.
