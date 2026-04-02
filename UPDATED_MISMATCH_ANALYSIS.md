# Updated Mismatch Analysis Report
## After Wallet System Review

**Date:** After deep scan + wallet system verification  
**Status:** 4 Real Issues Found (down from 8)

---

## WALLET SYSTEM VERIFICATION ✅

### Current Implementation (WORKING)
The unified wallet system uses:
- ✅ `users.wallet_balance` column - Stores user balance
- ✅ `payments` table - Stores ALL transaction history (deposits, withdrawals, transfers)

### Legacy/Unused Services (IGNORE)
These services reference non-existent tables but are NOT used in production:
- ❌ `production_wallet_service.py` - References `transactions` table (NOT USED)
- ❌ `wallet_balance_service.py` - References `wallet_balances` table (NOT USED)

**Conclusion:** Wallet system is fully functional. No missing tables needed.

---

## REVISED CRITICAL ISSUES

### Priority 1: CRITICAL (Breaks Core Features)

#### ❌ Issue #1: Missing `ticket_scans` table
- **Impact:** Event check-in and ticket verification BROKEN
- **Used in:**
  - `components/scanner/TicketVerificationPage.tsx`
  - `services/offlineScanQueue.ts`
- **Action:** CREATE TABLE IMMEDIATELY

**SQL to create:**
```sql
CREATE TABLE ticket_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES tickets(id),
  event_id UUID REFERENCES events(id),
  user_id UUID REFERENCES users(id),
  scanned_by UUID REFERENCES users(id),
  scan_location TEXT,
  scan_device TEXT,
  scan_status TEXT DEFAULT 'valid',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE ticket_scans ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Organizers can scan tickets for their events"
  ON ticket_scans FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_scans.event_id
      AND events.host_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their ticket scans"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Organizers can view scans for their events"
  ON ticket_scans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = ticket_scans.event_id
      AND events.host_id = auth.uid()
    )
  );
```

---

### Priority 2: HIGH (Breaks Optional Features)

#### ❌ Issue #2: Missing `spray_money` table
- **Impact:** Wedding spray money analytics BROKEN
- **Used in:** `components/events/WeddingAnalytics.tsx`
- **Note:** `spray_money_leaderboard` table exists but empty
- **Action:** CREATE TABLE

**SQL to create:**
```sql
CREATE TABLE spray_money (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id),
  sender_id UUID REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  message TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE spray_money ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can spray money at events"
  ON spray_money FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view spray money for events they attend"
  ON spray_money FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.event_id = spray_money.event_id
      AND bookings.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM events
      WHERE events.id = spray_money.event_id
      AND events.host_id = auth.uid()
    )
  );
```

---

### Priority 3: MEDIUM (Admin Features)

#### ⚠️ Issue #3: Missing `interaction_logs` table
- **Impact:** Analytics tracking incomplete
- **Used in:** `analytics_service.py`
- **Action:** CREATE TABLE or remove analytics feature

**SQL to create:**
```sql
CREATE TABLE interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  event_id UUID REFERENCES events(id),
  interaction_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE interaction_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can log their own interactions"
  ON interaction_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all interaction logs"
  ON interaction_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );
```

#### ⚠️ Issue #4: Missing `notifications` table
- **Impact:** Notification system may be incomplete
- **Used in:** `simple_main.py`
- **Note:** `realtime_notifications` table exists (empty)
- **Action:** Either create `notifications` table OR update code to use `realtime_notifications`

**Option A - Create notifications table:**
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  read BOOLEAN DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());
```

**Option B - Update code to use realtime_notifications (RECOMMENDED)**

---

### Priority 4: LOW (Unused/Legacy)

#### ℹ️ Issue #5: Missing tables referenced by UNUSED services
These tables are referenced by services that are NOT imported or used:
- `support_tickets` - in `admin_dashboard_service.py` (admin feature not implemented)
- `notification_preferences` - in `simple_main.py` (not used)
- `transactions` - in `production_wallet_service.py` (LEGACY - not used)
- `wallet_balances` - in `wallet_balance_service.py` (LEGACY - not used)

**Action:** NO ACTION NEEDED - These services are not active

---

## UNUSED DATABASE TABLES

These tables exist but are NOT referenced in any active code:

### ⚠️ Consider Removing:
1. **conversations** (7 columns) - WhatsApp/chat feature not implemented
2. **event_organizers** (empty) - Not used
3. **referrals** (empty) - Referral system not implemented
4. **sponsorships** (empty) - Sponsorship feature not implemented

**Action:** Keep for now (may be future features) or remove to clean up database

---

## FRONTEND API CALLS - PORT MISMATCH

### ⚠️ Issue #6: Hardcoded localhost:8001 in frontend
Several frontend files use hardcoded `http://localhost:8001` instead of environment variable:

**Files affected:**
- Payment components
- Event components
- User preferences

**Current:** `http://localhost:8001/api/...`  
**Should be:** `${API_URL}/api/...` or `/api/...` (with proxy)

**Action:** Update frontend to use environment variable

---

## FINAL RECOMMENDATIONS

### IMMEDIATE ACTION REQUIRED (Priority 1)
1. ✅ **Create `ticket_scans` table** - Event check-in is broken without this

### HIGH PRIORITY (Priority 2)
2. ✅ **Create `spray_money` table** - Wedding features need this

### MEDIUM PRIORITY (Priority 3)
3. ⚠️ **Create `interaction_logs` table** - For analytics
4. ⚠️ **Fix notifications** - Either create `notifications` table or update code to use `realtime_notifications`

### LOW PRIORITY (Priority 4)
5. ℹ️ **Fix frontend hardcoded URLs** - Use environment variables
6. ℹ️ **Clean up unused tables** - Remove conversations, event_organizers, referrals, sponsorships if not needed

### NO ACTION NEEDED
- ✅ Wallet system is fully functional (uses `users.wallet_balance` and `payments` table)
- ✅ Legacy wallet services can be deleted (`production_wallet_service.py`, `wallet_balance_service.py`)

---

## SUMMARY

### Real Issues: 4 (down from 8)
1. ❌ Missing `ticket_scans` - CRITICAL
2. ❌ Missing `spray_money` - HIGH
3. ⚠️ Missing `interaction_logs` - MEDIUM
4. ⚠️ Missing `notifications` or need to use `realtime_notifications` - MEDIUM

### False Alarms: 4
1. ✅ `transactions` table - Not needed (uses `payments` table)
2. ✅ `wallet_balances` table - Not needed (uses `users.wallet_balance`)
3. ✅ `support_tickets` - Service not used
4. ✅ `notification_preferences` - Service not used

### Wallet System Status: ✅ FULLY FUNCTIONAL
- Balance: `users.wallet_balance` column
- Transactions: `payments` table
- Withdrawals: Working (after Flutterwave balance settlement)
- Transfers: Working

---

## NEXT STEPS

1. Create `ticket_scans` table (SQL provided above)
2. Create `spray_money` table (SQL provided above)
3. Decide on notifications approach (create table or use existing)
4. Create `interaction_logs` if analytics needed
5. Update frontend to use environment variables for API URLs
6. Consider removing unused tables
7. Delete legacy wallet services files
