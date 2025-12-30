# 🚀 Implementation Guide

## Overview

This guide provides step-by-step instructions to implement the complete authentication and dashboard system for Tikit.

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                     Landing Page (/)                         │
│                           ↓                                  │
│              User Type Selection (/auth)                     │
│                    ↙          ↘                              │
│            Attendee        Organizer                         │
│               ↓                ↓                             │
│         Registration      Registration                       │
│               ↓                ↓                             │
│          Onboarding       Onboarding                         │
│               ↓                ↓                             │
│      /dashboard      /organizer/dashboard                    │
│                                                              │
│                    Admin (/admin/dashboard)                  │
│                    (Direct login only)                       │
└─────────────────────────────────────────────────────────────┘
```

## Phase 1: Backend Setup

### 1.1 Update Database Schema

Add to `apps/backend/prisma/schema.prisma`:

```prisma
model User {
  // ... existing fields
  
  // Role-based access
  role              String    @default("attendee")
  // Values: "attendee", "organizer", "admin"
  
  // Organizer-specific fields
  organizationName  String?
  organizationType  String?   // "individual", "company", "religious", "corporate"
  bankDetails       String?   // JSON string with bank info
  
  // Verification
  isVerified        Boolean   @default(false)
  verifiedAt        DateTime?
  
  // Admin fields
  adminLevel        String?   // "super", "moderator", "support"
  permissions       String?   // JSON string with specific permissions
}
```

Run migration:
```bash
cd apps/backend
npx prisma migrate dev --name add_user_roles
```

### 1.2 Create Auth Routes

Update `apps/backend/src/routes/auth.routes.ts`:

```typescript
// Add role selection to registration
router.post('/register', async (req, res) => {
  const { phoneNumber, role } = req.body;
  
  // Validate role
  if (!['attendee', 'organizer'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  // ... existing registration logic
  // Add role to user creation
});

// Add role-based login
router.post('/login', async (req, res) => {
  // ... existing login logic
  // Include role in JWT token
});
```

### 1.3 Create RBAC Middleware

Create `apps/backend/src/middleware/roleCheck.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }
    
    next();
  };
};

// Usage examples:
// requireRole(['attendee', 'organizer', 'admin'])
// requireRole(['organizer', 'admin'])
// requireRole(['admin'])
```

### 1.4 Protect Routes

Update route files to use role checking:

```typescript
// Attendee-only routes
router.get('/tickets', authenticate, requireRole(['attendee']), ...);

// Organizer routes
router.post('/events', authenticate, requireRole(['organizer', 'admin']), ...);

// Admin-only routes
router.get('/admin/users', authenticate, requireRole(['admin']), ...);
```

## Phase 2: Frontend Setup

### 2.1 Create Route Structure

Update `apps/frontend/src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        
        {/* Attendee Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute role="attendee">
            <AttendeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/tickets" element={
          <ProtectedRoute role="attendee">
            <MyTickets />
          </ProtectedRoute>
        } />
        
        {/* Organizer Routes */}
        <Route path="/organizer/dashboard" element={
          <ProtectedRoute role="organizer">
            <OrganizerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/organizer/events" element={
          <ProtectedRoute role="organizer">
            <MyEvents />
          </ProtectedRoute>
        } />
        
        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
```

### 2.2 Create Protected Route Component

Create `apps/frontend/src/components/auth/ProtectedRoute.tsx`:

```typescript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: string;
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (!user) {
    return <Navigate to="/auth" />;
  }
  
  if (role && user.role !== role && user.role !== 'admin') {
    return <Navigate to="/dashboard" />;
  }
  
  return <>{children}</>;
}
```

### 2.3 Create Auth Context

Create `apps/frontend/src/contexts/AuthContext.tsx`:

```typescript
import { createContext, useState, useEffect } from 'react';

interface User {
  id: string;
  phoneNumber: string;
  role: 'attendee' | 'organizer' | 'admin';
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  register: (data: any) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token and load user
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, []);
  
  const login = async (phone: string, otp: string) => {
    // API call to login
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phoneNumber: phone, otp })
    });
    
    const data = await response.json();
    localStorage.setItem('token', data.token);
    setUser(data.user);
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}
```

## Phase 3: Component Implementation

### 3.1 Landing Page

Create `apps/frontend/src/pages/LandingPage.tsx` - See AUTHENTICATION_DESIGN.md

### 3.2 Auth Page

Create `apps/frontend/src/pages/AuthPage.tsx` - Multi-step form with:
- User type selection
- Phone number entry
- OTP verification
- Basic profile

### 3.3 Onboarding Flows

Create separate onboarding components:
- `AttendeeOnboarding.tsx` - Language, location, interests
- `OrganizerOnboarding.tsx` - Organization details, payment setup

### 3.4 Dashboard Layouts

Create dashboard layouts:
- `AttendeeDashboardLayout.tsx` - With sidebar navigation
- `OrganizerDashboardLayout.tsx` - With organizer-specific nav
- `AdminDashboardLayout.tsx` - With admin navigation

## Phase 4: Dashboard Pages

### 4.1 Attendee Dashboard Pages

Create in `apps/frontend/src/pages/attendee/`:
- `Dashboard.tsx` - Overview with stats
- `MyTickets.tsx` - Ticket list and details
- `Wallet.tsx` - Balance and transactions
- `Referrals.tsx` - Referral program
- `Profile.tsx` - User profile
- `Settings.tsx` - User settings

### 4.2 Organizer Dashboard Pages

Create in `apps/frontend/src/pages/organizer/`:
- `Dashboard.tsx` - Overview with metrics
- `MyEvents.tsx` - Event list
- `CreateEvent.tsx` - Multi-step event creation
- `EventAnalytics.tsx` - Event-specific analytics
- `Attendees.tsx` - Attendee management
- `Financials.tsx` - Revenue and payouts
- `Broadcast.tsx` - Message broadcasting
- `Scanner.tsx` - Ticket scanning

### 4.3 Admin Dashboard Pages

Create in `apps/frontend/src/pages/admin/`:
- `Dashboard.tsx` - System overview
- `Users.tsx` - User management
- `Events.tsx` - Event moderation
- `Financials.tsx` - Platform financials
- `Analytics.tsx` - Platform analytics
- `Security.tsx` - Security monitoring
- `Announcements.tsx` - Platform announcements
- `Settings.tsx` - System settings
- `Support.tsx` - Support tickets

## Phase 5: Styling & UI Components

### 5.1 Install UI Library

```bash
cd apps/frontend
npm install @headlessui/react @heroicons/react
npm install tailwindcss @tailwindcss/forms
```

### 5.2 Create Reusable Components

Create in `apps/frontend/src/components/ui/`:
- `Button.tsx`
- `Card.tsx`
- `Input.tsx`
- `Select.tsx`
- `Modal.tsx`
- `Table.tsx`
- `Badge.tsx`
- `Alert.tsx`
- `Spinner.tsx`

### 5.3 Create Dashboard Components

Create in `apps/frontend/src/components/dashboard/`:
- `StatCard.tsx` - For metrics display
- `Chart.tsx` - For analytics charts
- `DataTable.tsx` - For data lists
- `Sidebar.tsx` - Navigation sidebar
- `TopBar.tsx` - Top navigation bar

## Phase 6: Testing

### 6.1 Test User Flows

1. **Attendee Flow**:
   - Register as attendee
   - Complete onboarding
   - Browse events
   - Purchase ticket
   - View in wallet

2. **Organizer Flow**:
   - Register as organizer
   - Complete onboarding
   - Create event
   - View analytics
   - Manage attendees

3. **Admin Flow**:
   - Login as admin
   - View dashboard
   - Manage users
   - Moderate events
   - View analytics

### 6.2 Test Role Permissions

- Verify attendees can't access organizer routes
- Verify organizers can't access admin routes
- Verify admins can access all routes
- Test unauthorized access attempts

## Phase 7: Deployment

### 7.1 Environment Variables

Add to `.env`:
```
JWT_SECRET=your_secret_key
JWT_EXPIRATION=24h
REFRESH_TOKEN_EXPIRATION=30d
```

### 7.2 Build & Deploy

```bash
# Backend
cd apps/backend
npm run build
npm start

# Frontend
cd apps/frontend
npm run build
# Deploy dist folder to hosting
```

## Quick Start Checklist

- [ ] Update database schema with roles
- [ ] Run migrations
- [ ] Create RBAC middleware
- [ ] Update auth routes
- [ ] Create protected route component
- [ ] Implement auth context
- [ ] Create landing page
- [ ] Create auth page with user type selection
- [ ] Create onboarding flows
- [ ] Create dashboard layouts
- [ ] Implement attendee dashboard
- [ ] Implement organizer dashboard
- [ ] Implement admin dashboard
- [ ] Add role-based navigation
- [ ] Test all user flows
- [ ] Deploy to production

## File Structure

```
apps/
├── backend/
│   └── src/
│       ├── middleware/
│       │   ├── auth.ts
│       │   └── roleCheck.ts
│       └── routes/
│           ├── auth.routes.ts
│           ├── attendee.routes.ts
│           ├── organizer.routes.ts
│           └── admin.routes.ts
│
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/
        │   │   ├── ProtectedRoute.tsx
        │   │   ├── UserTypeSelector.tsx
        │   │   └── OnboardingFlow.tsx
        │   ├── dashboard/
        │   │   ├── Sidebar.tsx
        │   │   ├── TopBar.tsx
        │   │   └── StatCard.tsx
        │   └── ui/
        │       └── [reusable components]
        ├── contexts/
        │   └── AuthContext.tsx
        ├── pages/
        │   ├── LandingPage.tsx
        │   ├── AuthPage.tsx
        │   ├── attendee/
        │   │   └── [attendee pages]
        │   ├── organizer/
        │   │   └── [organizer pages]
        │   └── admin/
        │       └── [admin pages]
        └── hooks/
            └── useAuth.ts
```

## Next Steps

1. Review all design documents
2. Start with Phase 1 (Backend Setup)
3. Implement one user type at a time
4. Test thoroughly before moving to next phase
5. Deploy incrementally

For detailed UI designs, refer to:
- `AUTHENTICATION_DESIGN.md`
- `ATTENDEE_DASHBOARD_DESIGN.md`
- `ORGANIZER_DASHBOARD_DESIGN.md`
- `ADMIN_DASHBOARD_DESIGN.md`
