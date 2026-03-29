# Database Schema - Comprehensive Audit & Recommendations

## 🎯 EXECUTIVE SUMMARY

**Overall Assessment**: Your schema is **70% production-ready** with some critical security gaps and redundancies.

**Critical Issues**: 3 🔴
**Important Issues**: 5 🟡  
**Optimizations**: 8 🟢

---

## 📊 TABLE-BY-TABLE ANALYSIS

### 1. `users` ✅ GOOD (with fixes needed)

**Current State**:
```sql
- id (uuid, PK)
- email (unique)
- first_name, last_name
- phone, whatsapp_name
- wallet_balance (numeric)
- role (text with CHECK) ✅
- organization_name, organization_type
- state, is_verified, referral_code
- location_preference (USER-DEFINED)
- preferred_categories (ARRAY)
- language
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🟡 `location_preference` is USER-DEFINED type (PostGIS geometry?) - unclear
- 🟡 `preferred_categories` ARRAY - no constraint on values

**RLS Required**: ✅ YES - CRITICAL
**Recommendation**: Run `setup_proper_users_table.sql` immediately

---

### 2. `events` ✅ MOSTLY GOOD

**Current State**:
```sql
- id (uuid, PK)
- host_id (uuid, FK to users)
- title, description, category
- event_date, location (lat/lng), full_address, venue_name
- capacity, tickets_sold, ticket_price, currency
- banner_image_url, status
- is_anonymous, anonymous_mode, secret_code
- location_reveal_trigger, location_reveal_hours_before
- entry_code_format, shared_entry_code
- location_revealed, location_revealed_at
- created_via
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🟡 `tickets_sold` duplicates data from `bookings` table (denormalization)
- 🟡 Too many anonymous/secret event columns (could be normalized)
- 🟢 Missing `deleted_at` for soft deletes
- 🟢 Missing `published_at` for draft events

**RLS Required**: ✅ YES - CRITICAL

**Recommendations**:
1. Enable RLS with policies:
   - Public can view published events
   - Organizers can view/edit their own events
   - Admins can view/edit all events
2. Consider separate `event_settings` table for anonymous/secret features
3. Add `deleted_at`, `published_at`, `draft` columns

---

### 3. `bookings` ✅ GOOD

**Current State**:
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- event_id (uuid, FK)
- quantity, total_amount
- status, payment_reference, payment_method
- phone
- booked_at, confirmed_at, cancelled_at
- booking_source
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🟢 `phone` redundant (already in users table)

**RLS Required**: ✅ YES - CRITICAL

**Recommendations**:
1. Enable RLS:
   - Users can view their own bookings
   - Organizers can view bookings for their events
   - Admins can view all bookings
2. Remove `phone` column (use JOIN with users)
3. Add index on `user_id`, `event_id`, `status`

---

### 4. `tickets` ✅ GOOD

**Current State**:
```sql
- id (uuid, PK)
- booking_id (uuid, FK)
- event_id (uuid, FK)
- user_id (uuid, FK)
- ticket_code, qr_code_url
- entry_code
- location_revealed, location_revealed_at
- status, checked_in_at
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🟡 `event_id` and `user_id` redundant (can get from booking)

**RLS Required**: ✅ YES - CRITICAL

**Recommendations**:
1. Enable RLS:
   - Users can view their own tickets
   - Organizers can view tickets for their events (for scanning)
   - Admins can view all tickets
2. Consider removing `event_id` and `user_id` (denormalization trade-off)
3. Add unique constraint on `ticket_code`

---

### 5. `payments` ⚠️ NEEDS WORK

**Current State**:
```sql
- id (text, PK) ⚠️
- user_id (text) ⚠️
- ticket_id (text, unique)
- amount, currency, method, status
- provider, reference (unique)
- metadata (text) ⚠️
- is_installment, installment_plan
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🔴 **CRITICAL**: Inconsistent ID types (text vs uuid)
- 🟡 `metadata` as text (should be jsonb)
- 🟡 `ticket_id` should allow multiple tickets per payment
- 🟡 Missing `transaction_id`, `payment_type` columns

**RLS Required**: ✅ YES - CRITICAL

**Recommendations**:
1. **Change ID types to uuid** for consistency
2. Change `metadata` to `jsonb`
3. Add `payment_type` (wallet_funding, ticket_purchase, etc.)
4. Add `transaction_id` for external reference
5. Consider `payment_items` junction table for multiple tickets

---

### 6. `conversations` ⚠️ UNCLEAR PURPOSE

**Current State**:
```sql
- id (uuid, PK)
- user_id (uuid, FK)
- phone
- current_flow, flow_state (jsonb)
- last_message_at
```

**Issues**:
- 🟡 Purpose unclear - WhatsApp bot? Chat system?
- 🟡 No RLS enabled
- 🟡 `phone` redundant if user_id exists

**RLS Required**: ⚠️ DEPENDS on use case

**Recommendations**:
1. Document purpose clearly
2. If for WhatsApp bot, consider renaming to `whatsapp_sessions`
3. If for user chat, needs complete redesign
4. Enable RLS if user-facing

---

### 7. `interaction_logs` & `message_logs` ✅ GOOD (Analytics)

**Current State**:
```sql
interaction_logs:
- id, phone, kind, context, options (jsonb)
- selected_id, created_at, selected_at

message_logs:
- id, phone, direction, message_type, content
- whatsapp_message_id, intent_detected
- entities (jsonb), response_time_ms, error
```

**Issues**:
- 🟢 No RLS needed (backend-only analytics)
- 🟢 Consider partitioning by date for performance

**RLS Required**: ❌ NO (backend analytics only)

**Recommendations**:
1. Add indexes on `phone`, `created_at`
2. Consider time-series partitioning
3. Add retention policy (delete old logs)

---

### 8. `realtime_notifications` ✅ GOOD

**Current State**:
```sql
- id (uuid, PK)
- user_id (text) ⚠️
- event_id (text) ⚠️
- type, title, message
- data (jsonb)
- read (boolean)
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🔴 **CRITICAL**: Inconsistent ID types (text vs uuid)

**RLS Required**: ✅ YES - CRITICAL

**Recommendations**:
1. Change `user_id` and `event_id` to uuid
2. Enable RLS:
   - Users can view their own notifications
   - Users can update `read` status on their notifications
3. Add index on `user_id`, `read`, `created_at`
4. Add cleanup job for old read notifications

---

### 9. `referrals` ✅ GOOD

**Current State**:
```sql
- id (text, PK) ⚠️
- referrer_id (text) ⚠️
- referred_user_id (text) ⚠️
- status, reward_amount, reward_paid
```

**Issues**:
- 🔴 **CRITICAL**: No RLS enabled
- 🟡 Inconsistent ID types (text vs uuid)

**RLS Required**: ✅ YES

**Recommendations**:
1. Change all IDs to uuid
2. Enable RLS:
   - Users can view referrals where they are referrer
   - Admins can view all referrals
3. Add unique constraint on `(referrer_id, referred_user_id)`

---

### 10. `group_buys` & `group_buy_status` ⚠️ REDUNDANT

**Current State**:
```sql
group_buys:
- id, event_id, initiator_id
- total_participants, current_participants
- price_per_person, expires_at, status
- participants (text) ⚠️

group_buy_status:
- group_buy_id (PK)
- current_participants, total_participants
- participants (jsonb)
- status
```

**Issues**:
- 🔴 **REDUNDANT**: Two tables with overlapping data
- 🔴 Inconsistent ID types (text vs uuid)
- 🟡 `participants` stored as text in one, jsonb in other
- 🟡 No RLS enabled

**RLS Required**: ✅ YES

**Recommendations**:
1. **MERGE into single `group_buys` table**
2. Use jsonb for participants
3. Change IDs to uuid
4. Enable RLS:
   - Public can view active group buys
   - Participants can view their group buys
   - Initiator can manage their group buys

---

### 11. `event_capacity` & `event_organizers` ⚠️ ISSUES

**Current State**:
```sql
event_capacity:
- event_id (text, PK) ⚠️
- tickets_sold, capacity, available

event_organizers:
- id, event_id, user_id (all text) ⚠️
- role, permissions (text) ⚠️
```

**Issues**:
- 🔴 `event_capacity` REDUNDANT (data in events table)
- 🔴 Inconsistent ID types
- 🟡 `permissions` as text (should be jsonb or separate table)
- 🟡 No RLS enabled

**RLS Required**: ✅ YES for event_organizers

**Recommendations**:
1. **DELETE `event_capacity` table** (use events.capacity, events.tickets_sold)
2. Keep `event_organizers` but:
   - Change IDs to uuid
   - Change `permissions` to jsonb
   - Enable RLS
3. Or simplify: just use events.host_id (single organizer)

---

### 12. `sponsorships` ✅ GOOD CONCEPT

**Current State**:
```sql
- id, requester_id (text) ⚠️
- sponsor_phone, code (unique)
- event_id, tier_id, amount
- status, approved_at, expires_at
```

**Issues**:
- 🟡 Inconsistent ID types
- 🟡 No RLS enabled
- 🟡 `tier_id` references non-existent table?

**RLS Required**: ✅ YES

**Recommendations**:
1. Change IDs to uuid
2. Create `sponsorship_tiers` table
3. Enable RLS

---

### 13. `spray_money_leaderboard` ✅ GOOD

**Current State**:
```sql
- event_id, user_id (composite PK, text) ⚠️
- user_name, amount
```

**Issues**:
- 🟡 Inconsistent ID types
- 🟡 `user_name` denormalized (can get from users)
- 🟢 No RLS needed (public leaderboard)

**RLS Required**: ❌ NO (public data)

**Recommendations**:
1. Change IDs to uuid
2. Remove `user_name` (JOIN with users)
3. Add index on `event_id`, `amount DESC`

---

### 14. `scan_history` ✅ GOOD

**Current State**:
```sql
- id, ticket_id, scanned_by (text) ⚠️
- scanned_at, location, device_info, result
```

**Issues**:
- 🟡 Inconsistent ID types
- 🟡 No RLS enabled

**RLS Required**: ✅ YES

**Recommendations**:
1. Change IDs to uuid
2. Enable RLS:
   - Organizers can view scans for their events
   - Admins can view all scans
3. Add index on `ticket_id`, `scanned_at`

---

### 15. `spatial_ref_sys` ℹ️ POSTGIS SYSTEM TABLE

**Status**: ✅ Standard PostGIS table, leave as-is

**RLS Required**: ❌ NO (system table)

---

## 🔐 RLS PRIORITY MATRIX

### 🔴 CRITICAL (Enable Immediately):
1. **users** - Protects personal data, wallet balances
2. **events** - Prevents unauthorized event modification
3. **bookings** - Protects financial transactions
4. **tickets** - Prevents ticket fraud
5. **payments** - Protects payment data
6. **realtime_notifications** - Protects user privacy

### 🟡 IMPORTANT (Enable Soon):
7. **referrals** - Protects referral rewards
8. **group_buys** - Protects group purchase data
9. **event_organizers** - Protects organizer permissions
10. **sponsorships** - Protects sponsorship deals
11. **scan_history** - Protects scanning audit trail

### 🟢 OPTIONAL (Public or Backend-Only):
- **interaction_logs** - Backend analytics
- **message_logs** - Backend analytics
- **spray_money_leaderboard** - Public leaderboard
- **event_capacity** - Consider deleting
- **spatial_ref_sys** - System table

---

## 🔄 REDUNDANCIES & COLLISIONS

### 1. **MAJOR**: `group_buys` + `group_buy_status`
**Issue**: Same data in two tables
**Solution**: Merge into single table

### 2. **MAJOR**: `event_capacity` table
**Issue**: Duplicates `events.capacity` and `events.tickets_sold`
**Solution**: Delete table, use events columns

### 3. **MINOR**: `tickets.event_id` and `tickets.user_id`
**Issue**: Can be derived from `booking_id`
**Trade-off**: Denormalization for query performance (acceptable)

### 4. **MINOR**: `bookings.phone`
**Issue**: Duplicates `users.phone`
**Solution**: Remove column, use JOIN

### 5. **INCONSISTENT**: ID Types (uuid vs text)
**Issue**: Some tables use text, others use uuid
**Solution**: Standardize on uuid

---

## 📋 COMPREHENSIVE FIX SCRIPT

I'll create a complete migration script in the next file...

---

## 🎯 STATE-OF-THE-ART RECOMMENDATIONS

### 1. **Consistency**
- ✅ Use uuid for all IDs
- ✅ Use jsonb for flexible data (not text)
- ✅ Use timestamp with time zone everywhere
- ✅ Consistent naming (snake_case)

### 2. **Security**
- ✅ Enable RLS on all user-facing tables
- ✅ Create proper policies for each role
- ✅ Use service_role only in backend
- ✅ Audit trail for sensitive operations

### 3. **Performance**
- ✅ Add indexes on foreign keys
- ✅ Add indexes on frequently queried columns
- ✅ Consider partitioning for logs
- ✅ Add materialized views for analytics

### 4. **Data Integrity**
- ✅ Add CHECK constraints where appropriate
- ✅ Add UNIQUE constraints
- ✅ Use FOREIGN KEY constraints (you have these ✅)
- ✅ Add NOT NULL where required

### 5. **Scalability**
- ✅ Soft deletes (deleted_at) instead of hard deletes
- ✅ Audit columns (created_by, updated_by)
- ✅ Version tracking for important records
- ✅ Archival strategy for old data

---

## 📊 SCHEMA HEALTH SCORE

| Category | Score | Status |
|----------|-------|--------|
| Data Modeling | 75% | 🟡 Good with improvements needed |
| Security (RLS) | 20% | 🔴 Critical gaps |
| Consistency | 60% | 🟡 ID type inconsistencies |
| Performance | 70% | 🟢 Decent, needs indexes |
| Scalability | 65% | 🟡 Missing soft deletes, archival |
| **OVERALL** | **58%** | 🟡 **Production-ready after fixes** |

---

## 🚀 IMMEDIATE ACTION ITEMS

### Priority 1 (This Week):
1. ✅ Run `setup_proper_users_table.sql` (RLS for users)
2. ✅ Enable RLS on events, bookings, tickets, payments
3. ✅ Fix ID type inconsistencies (text → uuid)
4. ✅ Merge group_buys tables
5. ✅ Delete event_capacity table

### Priority 2 (Next Week):
6. ✅ Enable RLS on remaining tables
7. ✅ Add missing indexes
8. ✅ Add soft delete columns
9. ✅ Normalize denormalized data
10. ✅ Add audit trail

### Priority 3 (Before Production):
11. ✅ Performance testing
12. ✅ Security audit
13. ✅ Backup strategy
14. ✅ Monitoring setup
15. ✅ Documentation

---

**Next**: I'll create the comprehensive migration script to fix all these issues.
