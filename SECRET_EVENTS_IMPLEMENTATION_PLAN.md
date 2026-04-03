# Secret Events - Complete Implementation Plan

## 🎯 Implementation Scope

### Features to Implement:
1. ✅ Database Migration (SQL created)
2. ✅ Progressive Location Reveal (Feature #1)
3. ✅ Secret Event Discovery Feed (Feature #2)
4. ✅ VIP Early Access (Feature #4)
5. ✅ Smart Notifications (Feature #6)
6. ✅ Separate UI flows for secret vs public events

---

## 📁 Files to Create/Modify

### Backend Files (8 files)

1. **Update: `services/secret_events_service.py`**
   - Migrate from in-memory to Supabase
   - Add progressive location reveal logic
   - Add discovery feed methods
   - Add invite request handling
   - Add notification scheduling

2. **Update: `routers/secret_events.py`**
   - Add discovery feed endpoint
   - Add invite request endpoints
   - Add notification endpoints
   - Add progressive location hints endpoint

3. **Update: `services/email_service.py`**
   - Add secret event invite email template
   - Add location reveal notification template
   - Add invite request notification template

4. **Update: `services/notification_service.py`**
   - Add secret event notification types
   - Add location reveal scheduling
   - Add push notification support

5. **Update: `main.py`**
   - Register secret events router (currently commented out)

### Frontend Files (12 files)

6. **Create: `pages/organizer/SecretEvents.tsx`**
   - List all secret events
   - Create button (opens modal)
   - View invite codes
   - Manage invite requests
   - Location reveal countdown

7. **Create: `pages/attendee/SecretEvents.tsx`**
   - Enter invite code interface
   - Discovery feed
   - Request invite button
   - View accessible events
   - Location reveal countdown

8. **Update: `components/layout/DashboardSidebar.tsx`**
   - Add "Secret Events" menu item for organizers
   - Add "Secret Events" menu item for attendees
   - Premium badge indicator

9. **Create: `components/secret-events/SecretEventCard.tsx`**
   - Event card with mystery theme
   - Location status indicator
   - Countdown timer
   - Progressive hints display

10. **Create: `components/secret-events/DiscoveryFeed.tsx`**
    - Browse secret events
    - Filter by category/tier
    - Request invite button
    - Teaser information

11. **Create: `components/secret-events/InviteRequestModal.tsx`**
    - Request form
    - Message to organizer
    - Membership verification

12. **Create: `components/secret-events/LocationRevealCountdown.tsx`**
    - Countdown timer
    - Progressive hints display
    - VIP early access indicator

13. **Update: `pages/organizer/CreateEvent.tsx`**
    - Add "Event Type" selector at top
    - Radio buttons: "Public Event" vs "Secret Event"
    - Conditional rendering based on selection
    - Separate flows to avoid confusion

14. **Update: `App.tsx`**
    - Add routes for secret events pages

15. **Create: `hooks/useSecretEvents.ts`**
    - Fetch accessible events
    - Validate invite codes
    - Request invites
    - Subscribe to notifications

16. **Create: `components/secret-events/SecretEventNotifications.tsx`**
    - Location reveal alerts
    - Invite code notifications
    - Event reminders

17. **Create: `components/secret-events/AnonymousTicketCard.tsx`**
    - Display purchase code
    - QR code
    - Event details
    - Location (if revealed)

---

## 🔄 Implementation Order

### Phase 1: Database & Backend Core (30 min)
1. Run SQL migration in Supabase
2. Update `secret_events_service.py` with Supabase integration
3. Update `secret_events.py` router with new endpoints
4. Register router in `main.py`
5. Test all endpoints

### Phase 2: Progressive Location Reveal (20 min)
6. Implement hint calculation logic
7. Add VIP early access (1 hour earlier)
8. Create countdown component
9. Test location reveal timing

### Phase 3: Discovery Feed (25 min)
10. Create discovery feed endpoint
11. Create invite request system
12. Build DiscoveryFeed component
13. Build InviteRequestModal
14. Test request/approval flow

### Phase 4: Dashboard Integration (30 min)
15. Create organizer SecretEvents page
16. Create attendee SecretEvents page
17. Update sidebar with new menu items
18. Add premium badges
19. Test navigation

### Phase 5: Separate Event Creation Flows (20 min)
20. Update CreateEvent page with type selector
21. Separate public vs secret forms
22. Add conditional rendering
23. Test both flows

### Phase 6: Notifications (25 min)
24. Add email templates
25. Implement notification scheduling
26. Create notification components
27. Test notification delivery

### Phase 7: Testing & Polish (20 min)
28. End-to-end testing
29. UI/UX improvements
30. Documentation

**Total Estimated Time: 2.5-3 hours**

---

## 🎨 UI Flow Separation

### Current CreateEvent Page:
```
┌─────────────────────────────┐
│   Create Event              │
│   [All fields mixed]        │
└─────────────────────────────┘
```

### New CreateEvent Page:
```
┌─────────────────────────────────────────┐
│   Create Event                          │
│                                         │
│   Event Type:                           │
│   ○ Public Event  ● Secret Event        │
│                                         │
│   ┌─────────────────────────────────┐  │
│   │  SECRET EVENT FORM              │  │
│   │  - Title                        │  │
│   │  - Secret Venue                 │  │
│   │  - Public Venue (vague)         │  │
│   │  - Location Reveal Time         │  │
│   │  - Premium Tier Required        │  │
│   │  - Anonymous Purchases          │  │
│   │  - Progressive Hints            │  │
│   └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## 📊 Key Features Detail

### Feature #1: Progressive Location Reveal

**Timeline:**
- **24h before:** "Lagos Island" (very vague)
- **12h before:** "Victoria Island Area" (area)
- **6h before:** "Adeola Odeku Street" (street)
- **2h before (Premium):** Full address revealed
- **3h before (VIP):** Full address revealed (1 hour earlier)

**Implementation:**
```python
def get_location_hint(event, user_tier, current_time):
    time_until_event = event.start_date - current_time
    
    # VIP gets 1 hour early access
    vip_bonus = 3600 if user_tier == 'vip' else 0
    
    if time_until_event > 86400:  # 24+ hours
        return event.location_hint_24h
    elif time_until_event > 43200:  # 12-24 hours
        return event.location_hint_12h
    elif time_until_event > 21600:  # 6-12 hours
        return event.location_hint_6h
    elif time_until_event > (7200 - vip_bonus):  # 2-6 hours (or 3 for VIP)
        return event.location_hint_2h
    else:
        return event.secret_venue  # Full address
```

### Feature #2: Secret Event Discovery Feed

**Feed Display:**
- Shows teaser information only
- No exact location
- Category and vibe
- Attendee count (if not hidden)
- "Request Invite" button

**Request Flow:**
1. User clicks "Request Invite"
2. Modal opens with message field
3. User writes why they want to attend
4. Request sent to organizer
5. Organizer approves/denies
6. If approved, invite code generated and sent

### Feature #4: VIP Early Access

**Benefits:**
- Location revealed 1 hour earlier than Premium
- Access to VIP-only secret events
- Priority in invite request queue
- Exclusive VIP badge on profile

### Feature #6: Smart Notifications

**Notification Types:**
1. **Location Reveal Alert**
   - Sent when location is revealed
   - Email + Push + SMS (optional)
   - Includes countdown and hint

2. **Invite Code Shared**
   - Sent when organizer shares code
   - Includes code and validation link
   - Expires after event

3. **Event Reminder**
   - 24h before event
   - 2h before event
   - Includes current location hint

4. **Invite Request Status**
   - Approved: Includes invite code
   - Denied: Includes reason

---

## 🔐 Security Considerations

1. **Invite Code Protection**
   - Rate limit validation attempts (5 per minute)
   - Log all validation attempts
   - Auto-expire after event

2. **Location Privacy**
   - Encrypt secret venue in database
   - Audit all location reveal access
   - Prevent premature reveals

3. **Membership Verification**
   - Real-time tier checking on every request
   - Prevent tier spoofing
   - Grace period for expired memberships (24h)

4. **Anonymous Ticket Security**
   - One-time use QR codes
   - Timestamp verification
   - Prevent code sharing

---

## ✅ Success Criteria

1. ✅ Database tables created successfully
2. ✅ All endpoints working with Supabase
3. ✅ Organizer can create secret events
4. ✅ Attendee can validate invite codes
5. ✅ Progressive location reveal works correctly
6. ✅ VIP gets 1 hour early access
7. ✅ Discovery feed shows teaser information
8. ✅ Invite requests can be sent and approved
9. ✅ Notifications sent at correct times
10. ✅ Separate UI flows for public vs secret events
11. ✅ No confusion between event types
12. ✅ Premium membership required and verified

---

## 🚀 Ready to Implement?

**Next Steps:**
1. Review this plan
2. Confirm features and approach
3. Run database migration
4. Begin implementation in phases

**Estimated Completion:** 2.5-3 hours of focused work

Would you like me to proceed with the implementation?
