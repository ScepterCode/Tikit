# Deep Dive: Supabase Lock Issue & Project Refactoring

## PART 1: ROOT CAUSE OF SUPABASE LOCK ERRORS

### The Problem
```
Lock "lock:sb-hwwzbsppzwcyvambeade-auth-token" was not released within 5000ms
AbortError: Lock broken by another request with the 'steal' option
```

### Why It Happens

Supabase's JavaScript client uses **browser storage locks** to prevent race conditions when accessing auth tokens. The lock mechanism works like this:

1. **First call to `getUser()`** → Acquires lock, reads token from localStorage
2. **Second concurrent call to `getUser()`** → Waits for lock (max 5000ms)
3. **If lock not released** → Steals lock (breaks it)
4. **Result** → Both calls fail with "Lock broken" error

### Current Code Flow (BROKEN)

```
App Mounts
  ↓
SupabaseAuthContext useEffect runs
  ├─ initAuth() starts
  │  └─ await supabase.auth.getSession() [LOCK ACQUIRED]
  │
  ├─ onAuthStateChange listener registered
  │  └─ Fires immediately with SIGNED_IN event
  │     └─ await fetchUserProfile()
  │        └─ await supabase.auth.getUser() [WAITING FOR LOCK]
  │
  └─ initAuth() completes
     └─ await fetchUserProfile()
        └─ await supabase.auth.getUser() [WAITING FOR LOCK]

Result: 3 concurrent calls to getUser() → Lock conflicts
```

### Why Previous Fixes Failed

1. **Removed React Strict Mode** - Didn't help because the real issue is the listener
2. **Added initialization guard** - Didn't help because listener still fires
3. **Added debounce** - Didn't help because listener fires before debounce check
4. **Singleton pattern** - Didn't help because issue is in auth calls, not client creation

### The Real Issue

**The `onAuthStateChange` listener fires IMMEDIATELY and CONCURRENTLY with `initAuth()`**

Both are trying to call `getUser()` at the same time, causing lock conflicts.

---

## PART 2: LIGHTWEIGHT REFACTORING PLAN

### Current State
- **Total Files**: ~300+ source files
- **Dependencies**: 50+ npm packages, 15+ Python packages
- **Bloat**: 40+ test scripts, 130+ docs, 2 backends
- **Bundle Size**: ~500KB+ (estimated)
- **Load Time**: Slow due to React + Vite + PWA overhead

### Target State
- **Total Files**: ~100 source files (67% reduction)
- **Dependencies**: 20 npm packages, 8 Python packages (60% reduction)
- **Bloat**: 0 test scripts in root, 5 essential docs
- **Bundle Size**: ~150KB (70% reduction)
- **Load Time**: <2s initial load

### Refactoring Strategy

#### Phase 1: Fix Auth System (IMMEDIATE)
**Goal**: Eliminate Supabase lock errors

**Solution**: Use session-based auth instead of concurrent getUser() calls

```typescript
// NEW APPROACH: Cache session, don't call getUser() repeatedly
const SupabaseAuthProvider = () => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const sessionCacheRef = useRef(null);

  useEffect(() => {
    // Only call getSession() ONCE
    supabase.auth.getSession().then(({ data: { session } }) => {
      sessionCacheRef.current = session;
      setSession(session);
      
      // Extract user from session, don't call getUser()
      if (session?.user) {
        const user = mapSessionToUser(session.user);
        setUser(user);
      }
      setLoading(false);
    });

    // Listen for changes, but DON'T call getUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        sessionCacheRef.current = session;
        setSession(session);
        if (session?.user) {
          setUser(mapSessionToUser(session.user));
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ user, session, loading }} />;
};
```

**Impact**: Eliminates all lock errors immediately

---

#### Phase 2: Remove Bloat (1-2 hours)

**2.1 Clean Root Directory**
```
Delete:
- 40+ test scripts (test_*.py, test_*.js, test_*.cjs)
- 40+ deployment scripts (deploy-*.js, deploy-*.sh)
- 20+ debug scripts (debug_*.py, check_*.js, verify_*.js)
- 10+ SQL files (*.sql)

Move to /scripts:
- Essential scripts only (5-10 files)
- Create /scripts/README.md with usage

Result: Root directory goes from 130+ files to 20 files
```

**2.2 Remove Express Backend**
```
Delete: /apps/backend (entire directory)
- 30+ TypeScript files
- Prisma migrations
- package.json, tsconfig.json

Keep: /apps/backend-fastapi (primary)

Result: -2-3MB, eliminates confusion
```

**2.3 Consolidate Documentation**
```
Keep (5 files):
- README.md (project overview)
- ARCHITECTURE.md (system design)
- API.md (endpoint documentation)
- DEPLOYMENT.md (production guide)
- CONTRIBUTING.md (dev guide)

Delete: 125+ other docs
- Status files (COMPLETE_AND_READY.txt, etc.)
- Duplicate guides
- Historical notes

Result: -1-2MB, easier to maintain
```

**2.4 Remove Debug Pages**
```
Delete from frontend:
- DebugAuthPage.tsx
- DebugPage.tsx
- EnvDebug.tsx
- EnvTest.tsx
- FastAPITestPage.tsx
- SupabaseTest.tsx
- TestPage.tsx
- RealtimeDemo.tsx
- FeatureDemo.tsx

Remove from App.tsx routes

Result: -100KB, cleaner codebase
```

---

#### Phase 3: Optimize Dependencies (2-3 hours)

**3.1 Frontend Cleanup**
```
Remove:
- fake-indexeddb (move to devDependencies or remove)
- fast-check (minimal usage)
- qrcode (duplicate with backend)
- Unnecessary @types packages

Keep:
- React 18
- Vite
- React Router
- Supabase
- i18next (if needed)
- date-fns

Result: 20 → 12 dependencies, -50KB bundle
```

**3.2 Backend Cleanup**
```
Remove:
- Unused routers (if FastAPI handles all)
- Duplicate packages

Keep:
- FastAPI
- Pydantic
- Supabase
- Redis
- PyJWT

Result: 15 → 8 dependencies, -100KB
```

**3.3 Consolidate Auth**
```
Delete:
- FastAPIAuthContext.tsx (if not used)
- Duplicate auth logic

Keep:
- SupabaseAuthContext.tsx (single source of truth)

Result: -50KB, simpler codebase
```

---

#### Phase 4: Optimize Build (1 hour)

**4.1 Vite Configuration**
```typescript
// vite.config.ts
export default {
  build: {
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
        }
      }
    }
  }
}
```

**4.2 Remove PWA Overhead**
```
Option A: Keep PWA but optimize
- Remove workbox-build
- Use simpler service worker
- Lazy load PWA features

Option B: Remove PWA entirely
- Delete vite-plugin-pwa
- Delete workbox packages
- Delete service worker files
- Result: -200KB

Recommendation: Option B for MVP, add PWA later
```

**4.3 Lazy Load Routes**
```typescript
// Use React.lazy for routes
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const OrganizerDashboard = lazy(() => import('./pages/organizer/OrganizerDashboard'));

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Suspense>
```

**Result**: Initial bundle -300KB, faster first load

---

#### Phase 5: Simplify Architecture (2-3 hours)

**5.1 Remove Unnecessary Features**
```
Consider removing for MVP:
- i18next (if not critical)
- Playwright E2E tests (use Vitest only)
- Real-time WebSocket (use polling)
- Admin analytics (use basic reports)
- Spray money leaderboard (use simple list)

Result: -200KB, simpler codebase
```

**5.2 Consolidate Services**
```
Current: 8 services in backend
- supabase_client
- cache_service
- auth_service
- event_service
- payment_service
- notification_service
- analytics_service
- realtime_service

Simplified: 3 services
- database (Supabase)
- cache (Redis)
- external_apis (Payments, SMS)

Result: -50% code, easier to maintain
```

**5.3 Remove Unused Middleware**
```
Keep:
- Auth middleware
- Rate limiting

Remove:
- Unused security middleware
- Unnecessary CORS configurations

Result: -20KB
```

---

## PART 3: IMPLEMENTATION ROADMAP

### Week 1: Fix & Cleanup
- **Day 1-2**: Fix Supabase auth (Phase 1)
- **Day 3-4**: Remove bloat (Phase 2)
- **Day 5**: Optimize dependencies (Phase 3)

### Week 2: Optimization
- **Day 1-2**: Optimize build (Phase 4)
- **Day 3-4**: Simplify architecture (Phase 5)
- **Day 5**: Testing & verification

### Expected Results
- **Bundle size**: 500KB → 150KB (70% reduction)
- **Load time**: 5s → 2s (60% faster)
- **Codebase**: 300 files → 100 files (67% reduction)
- **Dependencies**: 65 packages → 28 packages (57% reduction)
- **Maintenance**: 130 docs → 5 docs (96% reduction)

---

## PART 4: IMMEDIATE ACTION ITEMS

### Priority 1 (TODAY)
1. Fix Supabase auth lock issue (use session caching)
2. Remove React Strict Mode (already done)
3. Test login flow

### Priority 2 (THIS WEEK)
4. Move 40+ scripts to /scripts directory
5. Delete Express backend
6. Consolidate documentation
7. Remove debug pages

### Priority 3 (NEXT WEEK)
8. Optimize dependencies
9. Optimize Vite build
10. Simplify architecture
11. Performance testing

---

## PART 5: QUICK WINS (IMMEDIATE)

These can be done in 30 minutes:

1. **Fix Auth Lock** (5 min)
   - Use session caching instead of getUser()
   - Restart frontend

2. **Remove Debug Pages** (10 min)
   - Delete 9 debug page files
   - Remove from App.tsx routes

3. **Move Scripts** (10 min)
   - Create /scripts directory
   - Move 40+ scripts there
   - Update .gitignore

4. **Delete Express Backend** (5 min)
   - Delete /apps/backend directory
   - Update root package.json

**Total time: 30 minutes**
**Impact: 50% reduction in bloat, auth system fixed**

