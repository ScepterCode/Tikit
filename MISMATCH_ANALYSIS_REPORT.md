# Complete Mismatch Analysis Report

## Executive Summary

**Date:** Generated from deep scan analysis  
**Status:** 8 Critical Issues Found

### Quick Stats
- **Database Tables:** 15 existing, 20 missing
- **Backend Endpoints:** 125 total
- **Backend Table References:** 14 tables (6 missing)
- **Frontend Table References:** 8 tables (2 missing)
- **Unused Tables:** 4 tables exist but unused

---

## CRITICAL ISSUE #1: Backend References Missing Tables (6 tables)

### ❌ Missing: `interaction_logs`
- **Used in:** `analytics_service.py`
- **Impact:** Analytics tracking will fail
- **Action Required:** Create table or remove references

### ❌ Missing: `notification_preferences`
- **Used in:** `simple_main.py`
- **Impact:** User notification settings won't work
- **Action Required:** Create table or use alternative

### ❌ Missing: `notifications`
- **Used in:** `simple_main.py`
- **Impact:** Notification system will fail
- **Action Required:** Create table (note: `realtime_notifications` exists)

### ❌ Missing: `support_tickets`
- **Used in:** `admin_dashboard_service.py`
- **Impact:** Admin dashboard support section broken
- **Action Required:** Create table or remove feature

### ❌ Missing: `transactions`
- **Used in:** `admin_dashboard_service.py`, `production_wallet_service.py`
- **Impact:** Transaction history and wallet features broken
- **Action Required:** Create table (critical for wallet system)

### ❌ Missing: `wallet_balances`
- **Used in:** `wallet_balance_service.py`
- **Impact:** Wallet balance tracking broken
- **Action Required:** Create table or use `users.wallet_balance` column

---

## CRITICAL ISSUE #2: Frontend References Missing Tables (2 tables)

### ❌ Missing: `spray_money`
- **Used in:** `components/events/WeddingAnalytics.tsx`
- **Impact:** Wedding spray money feature broken
- **Action Required:** Create table (note: `spray_money_leaderboard` exists)

### ❌ Missing: `ticket_scans`
- **Used in:** 
  - `components/scanner/TicketVerificationPage.tsx`
  - `services/offlineScanQueue.ts`
- **Impact:** Ticket scanning and verification broken
- **Action Required:** Create table (critical for event check-in)

---

## ISSUE #3: Unused Database Tables (4 tables)

These tables exist but are NOT referenced anywhere in code:

### ⚠️ `conversations`
- **Columns:** id, user_id, phone, current_flow, flow_state, last_message_at, created_at
- **Status:** 7 columns, not used
- **Action:** Remove if not needed, or implement feature

### ⚠️ `event_organizers`
- **Columns:** Empty table
- **Status:** Not used
- **Action:** Remove or populate

### ⚠️ `referrals`
- **Columns:** Empty table
- **Status:** Not used
- **Action:** Remove or implement referral system

### ⚠️ `sponsorships`
- **Columns:** Empty table
- **Status:** Not used
- **Action:** Remove or implement sponsorship feature

---

## Existing Database Tables (15 tables)

### ✅ Core Tables (Working)
1. **users** - 18 columns (id, email, wallet_balance, role, etc.)
2. **events** - 28 columns (id, host_id, title, ticket_price, etc.)
3. **tickets** - 12 columns (id, booking_id, ticket_code, status, etc.)
4. **bookings** - 14 columns (id, user_id, event_id, total_amount, etc.)
5. **payments** - 14 columns (id, user_id, amount, status, reference, etc.)

### ✅ Supporting Tables (Working)
6. **event_capacity** - 5 columns (event_id, tickets_sold, capacity, available, updated_at)
7. **group_buy_status** - 6 columns (group_buy_id, current_participants, status, etc.)
8. **message_logs** - 11 columns (id, phone, content, intent_detected, etc.)
9. **realtime_notifications** - Empty but exists
10. **spray_money_leaderboard** - Empty but exists
11. **scan_history** - Empty but exists

### ⚠️ Unused Tables
12. **conversations** - 7 columns (not used)
13. **event_organizers** - Empty (not used)
14. **referrals** - Empty (not used)
15. **sponsorships** - Empty (not used)

---

## Missing Database Tables (20 tables)

These tables are referenced in code but DON'T exist:

1. ❌ `anonymous_chat_messages`
2. ❌ `auto_save_rules`
3. ❌ `bank_accounts`
4. ❌ `bulk_purchases`
5. ❌ `event_analytics`
6. ❌ `event_preferences`
7. ❌ `interaction_logs` (Backend uses)
8. ❌ `memberships`
9. ❌ `multi_wallets`
10. ❌ `notification_preferences` (Backend uses)
11. ❌ `notifications` (Backend uses)
12. ❌ `savings_goals`
13. ❌ `secret_event_invites`
14. ❌ `secret_events`
15. ❌ `spray_competitions`
16. ❌ `spray_money` (Frontend uses)
17. ❌ `support_tickets` (Backend uses)
18. ❌ `ticket_scans` (Frontend uses)
19. ❌ `ticket_tiers`
20. ❌ `transaction_history`
21. ❌ `transactions` (Backend uses)
22. ❌ `user_preferences`
23. ❌ `wallet_balances` (Backend uses)
24. ❌ `wallet_transactions`
25. ❌ `withdrawals`

---

## Backend API Endpoints (125 total)

Sample of key endpoints:
- `GET /` (notifications.py)
- `GET /accessible` (secret_events.py)
- `GET /balance` (wallet.py)
- `GET /bank-accounts` (wallet.py)
- `GET /banks` (wallet.py)
- `GET /dashboard` (admin.py)
- `GET /events` (admin.py)
- `GET /feed` (events.py)
- `GET /health` (health.py)
- `GET /me` (auth.py)
- ... and 115 more

---

## Frontend API Calls (16 unique)

- `/api/analytics/secret-event/`
- `/api/anonymous-chat/create-room`
- `/api/anonymous-chat/join-room`
- `/api/anonymous-chat/messages/`
- `/api/anonymous-chat/premium-messages/`
- `/api/anonymous-chat/rooms/by-event/`
- `/api/anonymous-chat/send-message`
- `/api/anonymous-chat/send-premium-message`
- `http://localhost:8001/api/events/`
- `http://localhost:8001/api/payments/airtime`
- `http://localhost:8001/api/payments/bank-transfer`
- `http://localhost:8001/api/payments/ussd`
- `http://localhost:8001/api/payments/verify`
- `http://localhost:8001/api/payments/wallet`
- `http://localhost:8001/api/users/preferences`

**Note:** Some frontend calls use hardcoded `localhost:8001` instead of environment variable

---

## Recommended Actions

### Priority 1: Critical (Breaks Core Features)
1. **Create `transactions` table** - Required for wallet system
2. **Create `ticket_scans` table** - Required for event check-in
3. **Create `spray_money` table** - Required for wedding features

### Priority 2: High (Breaks Features)
4. **Create `notifications` table** OR update code to use `realtime_notifications`
5. **Create `wallet_balances` table** OR use `users.wallet_balance` column
6. **Create `interaction_logs` table** - Required for analytics

### Priority 3: Medium (Optional Features)
7. **Create `support_tickets` table** - For admin support feature
8. **Create `notification_preferences` table** - For user settings
9. **Remove unused tables:** conversations, event_organizers, referrals, sponsorships

### Priority 4: Low (Future Features)
10. Create remaining missing tables as features are implemented
11. Update frontend to use environment variables instead of hardcoded URLs

---

## Files Requiring Updates

### Backend Files with Missing Table References
- `analytics_service.py` → interaction_logs
- `simple_main.py` → notifications, notification_preferences
- `admin_dashboard_service.py` → support_tickets, transactions
- `production_wallet_service.py` → transactions
- `wallet_balance_service.py` → wallet_balances

### Frontend Files with Missing Table References
- `components/events/WeddingAnalytics.tsx` → spray_money
- `components/scanner/TicketVerificationPage.tsx` → ticket_scans
- `services/offlineScanQueue.ts` → ticket_scans

---

## Conclusion

Your system has **8 critical mismatches** that need attention:
- 6 backend table references to non-existent tables
- 2 frontend table references to non-existent tables

The most critical issues are:
1. **Wallet system** - Missing `transactions` and `wallet_balances` tables
2. **Ticket scanning** - Missing `ticket_scans` table
3. **Wedding features** - Missing `spray_money` table

These should be addressed immediately to ensure core functionality works properly.
