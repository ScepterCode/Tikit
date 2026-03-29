# Project Audit Report: Duplicates & Redundancies

## 🔍 BACKEND SYSTEMS ANALYSIS

### Currently Running Backend Systems:
1. **`apps/backend/simple-server.js`** ✅ **ACTIVE** (Currently running on port 4000)
   - Simple Express server with mock auth endpoints
   - Working `/health`, `/api/auth/register`, `/api/auth/login`
   - 50 lines of code, minimal dependencies

2. **`apps/backend/src/index.ts`** ❌ **INACTIVE** (Full TypeScript backend)
   - Complex Express + Prisma + Redis + Supabase setup
   - 200+ lines with extensive middleware
   - Database integration, CSRF protection, rate limiting
   - **NOT CURRENTLY RUNNING**

3. **`apps/backend/auth-server.js`** ❌ **DUPLICATE/UNUSED**
   - Another simple server (appears to be a test file)
   - **SHOULD BE DELETED**

### Backend Route Duplications:
- **Auth Routes**: 
  - `simple-server.js` has basic auth endpoints
  - `src/routes/auth.routes.ts` has full auth system (unused)
- **Admin Routes**: `src/routes/admin.routes.ts` (unused)
- **Event Routes**: `src/routes/event.routes.ts` (unused)
- **Payment Routes**: `src/routes/payment.routes.ts` (unused)

## 🔍 FRONTEND PAGES ANALYSIS

### Landing/Home Page Duplicates:
1. **`apps/frontend/src/pages/Home.tsx`** ✅ **ACTIVE** (Currently used)
   - Modern landing page with gradient background
   - Hero section, stats, features, event types
   
2. **`apps/frontend/src/pages/LandingPage.tsx`** ❌ **DUPLICATE**
   - Older version of landing page
   - **SHOULD BE DELETED**

### Dashboard Duplicates:
**NO DUPLICATES** - Each dashboard is role-specific:
- `AttendeeDashboard.tsx` - For attendees ✅
- `OrganizerDashboard.tsx` - For organizers ✅  
- `AdminDashboard.tsx` - For admins ✅

### Event System Duplicates:
1. **`apps/frontend/src/pages/Events.tsx`** ✅ **ACTIVE** (New, working)
   - Full events browsing with search/filter
   - Event cards, booking functionality

2. **`apps/frontend/src/components/events/EventFeed.tsx`** ❌ **DUPLICATE**
   - Older event listing component
   - **SHOULD BE DELETED**

3. **`apps/frontend/src/components/events/EventCard.tsx`** ❌ **DUPLICATE**
   - Older event card component
   - **SHOULD BE DELETED**

4. **`apps/frontend/src/components/events/EventDetailPage.tsx`** ❌ **UNUSED**
   - Event detail view (not integrated)
   - **SHOULD BE DELETED OR INTEGRATED**

### Wallet System Duplicates:
1. **`apps/frontend/src/pages/attendee/Wallet.tsx`** ✅ **ACTIVE** (New, working)
   - Full wallet interface with add funds modal

2. **`apps/frontend/src/components/wallet/OfflineWallet.tsx`** ❌ **DIFFERENT PURPOSE**
   - Offline wallet functionality
   - **KEEP** (different use case)

## 🔍 COMPONENT DUPLICATES

### Ticket Components:
- Multiple ticket-related components in `/components/tickets/`
- Many appear to be unused or for specific features not yet implemented
- **RECOMMENDATION**: Audit and remove unused ones

### Scanner Components:
- Multiple scanner components in `/components/scanner/`
- Appear to be for QR code scanning (not currently used)
- **RECOMMENDATION**: Keep for future QR ticket scanning

### Organizer Components:
- Multiple organizer-specific components
- Not currently integrated with OrganizerDashboard
- **RECOMMENDATION**: Integrate or remove

## 🔍 SERVICE/UTILITY DUPLICATES

### Authentication Context:
- **NO DUPLICATES** - Single AuthContext ✅

### API Services:
- Multiple service files in `/services/` (mostly unused)
- Event filtering, offline sync, etc.
- **RECOMMENDATION**: Remove unused services

## 📊 SUMMARY OF DUPLICATES

### 🚨 CRITICAL DUPLICATES TO REMOVE:

#### Backend:
1. **`apps/backend/auth-server.js`** - Delete (unused test file)
2. **`apps/backend/src/index.ts`** - Archive (complex unused backend)
3. **All `apps/backend/src/routes/*`** - Archive (unused route files)
4. **All `apps/backend/src/services/*`** - Archive (unused service files)

#### Frontend:
1. **`apps/frontend/src/pages/LandingPage.tsx`** - Delete (replaced by Home.tsx)
2. **`apps/frontend/src/components/events/EventFeed.tsx`** - Delete (replaced by Events.tsx)
3. **`apps/frontend/src/components/events/EventCard.tsx`** - Delete (replaced by Events.tsx)
4. **`apps/frontend/src/components/events/FilterPanel.tsx`** - Delete (integrated into Events.tsx)

#### Test Files:
1. **`test-api.html`** - Delete (temporary test file)
2. **`test-connection.js`** - Delete (temporary test file)

### 📁 RECOMMENDED PROJECT STRUCTURE CLEANUP:

```
apps/
├── backend/
│   ├── simple-server.js ✅ (KEEP - Currently active)
│   ├── package.json ✅ (KEEP)
│   └── archive/ (MOVE unused complex backend here)
│       ├── src/
│       ├── prisma/
│       └── ...
├── frontend/
│   ├── src/
│   │   ├── pages/ ✅ (KEEP - All active)
│   │   │   ├── Home.tsx
│   │   │   ├── Events.tsx
│   │   │   ├── attendee/
│   │   │   └── ...
│   │   ├── components/ (CLEAN UP)
│   │   │   ├── auth/ ✅ (KEEP)
│   │   │   ├── common/ ✅ (KEEP)
│   │   │   └── archive/ (MOVE unused components)
│   │   └── contexts/ ✅ (KEEP)
│   └── ...
```

## 🎯 CLEANUP RECOMMENDATIONS

### Immediate Actions:
1. **Delete 8 duplicate/unused files**
2. **Archive complex unused backend system**
3. **Keep only active, working components**
4. **Consolidate documentation files**

### Result After Cleanup:
- **1 Backend System** (simple-server.js)
- **0 Duplicate Pages**
- **Clean, focused codebase**
- **Easier maintenance and development**

### Current Status:
- **2 Backend Systems** (1 active, 1 unused)
- **4 Duplicate Frontend Pages**
- **10+ Unused Component Files**
- **Multiple Redundant Service Files**

**RECOMMENDATION**: Proceed with cleanup to have a lean, maintainable codebase focused on working features.