import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { FastAPIAuthProvider } from './contexts/FastAPIAuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardRouter } from './pages/DashboardRouter';
import { AttendeeDashboard } from './pages/attendee/AttendeeDashboard';
import { MyTickets } from './pages/attendee/MyTickets';
import { Wallet } from './pages/attendee/Wallet';
import { Referrals } from './pages/attendee/Referrals';
import { Profile } from './pages/attendee/Profile';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { Checkout } from './pages/Checkout';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerEvents } from './pages/organizer/OrganizerEvents';
import { CreateEvent } from './pages/organizer/CreateEvent';
import { OrganizerAttendees } from './pages/organizer/OrganizerAttendees';
import { OrganizerFinancials } from './pages/organizer/OrganizerFinancials';
import { FastAPITestPage } from './pages/FastAPITestPage';
import { OrganizerBroadcast } from './pages/organizer/OrganizerBroadcast';
import { OrganizerScanner } from './pages/organizer/OrganizerScanner';
import { OrganizerSettings } from './pages/organizer/OrganizerSettings';
import { OrganizerAnalytics } from './pages/organizer/OrganizerAnalytics';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminInstructions } from './pages/AdminInstructions';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminFinancials } from './pages/admin/AdminFinancials';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSecurity } from './pages/admin/AdminSecurity';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminSettings } from './pages/admin/AdminSettings';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { RealtimeDemo } from './pages/RealtimeDemo';
import { FeatureDemo } from './pages/FeatureDemo';
import { EnvDebug } from './pages/EnvDebug';
import { SupabaseTest } from './pages/SupabaseTest';
import { ApiStatusIndicator } from './components/common/ApiStatusIndicator';

function App() {
  return (
    <BrowserRouter>
      <FastAPIAuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          
          {/* Debug Routes */}
          <Route path="/debug/env" element={<EnvDebug />} />
          <Route path="/debug/supabase" element={<SupabaseTest />} />
          <Route path="/debug/fastapi" element={<FastAPITestPage />} />
          
          {/* Admin Login - Separate route for security */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/admin/instructions" element={<AdminInstructions />} />

          {/* Dashboard Router - redirects based on role */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardRouter />
              </ProtectedRoute>
            }
          />

          {/* Attendee Routes */}
          <Route
            path="/attendee/dashboard"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <AttendeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/tickets"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <MyTickets />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/wallet"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <Wallet />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/referrals"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <Referrals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/profile"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Events Routes - accessible to all authenticated users */}
          <Route
            path="/events"
            element={
              <ProtectedRoute>
                <Events />
              </ProtectedRoute>
            }
          />
          <Route
            path="/events/:eventId"
            element={
              <ProtectedRoute>
                <EventDetails />
              </ProtectedRoute>
            }
          />

          {/* Checkout Route - accessible to all authenticated users */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />

          {/* Feature Demo - accessible to all users */}
          <Route path="/demo" element={<FeatureDemo />} />

          {/* Real-time Demo - accessible to all authenticated users */}
          <Route
            path="/realtime-demo"
            element={
              <ProtectedRoute>
                <RealtimeDemo />
              </ProtectedRoute>
            }
          />

          {/* Organizer Routes */}
          <Route
            path="/organizer/dashboard"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/events"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/create-event"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <CreateEvent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/attendees"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerAttendees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/financials"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerFinancials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/broadcast"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerBroadcast />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/scanner"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerScanner />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/settings"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/organizer/analytics"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerAnalytics />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/financials"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminFinancials />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/security"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSecurity />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminSettings />
              </ProtectedRoute>
            }
          />

          {/* Unauthorized */}
          <Route
            path="/unauthorized"
            element={
              <div style={styles.unauthorized}>
                <h1>⛔ Unauthorized</h1>
                <p>You don't have permission to access this page.</p>
                <a href="/dashboard" style={styles.link}>
                  Go to Dashboard
                </a>
              </div>
            }
          />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <PWAUpdatePrompt />
        <ApiStatusIndicator />
      </FastAPIAuthProvider>
    </BrowserRouter>
  );
}

const styles = {
  unauthorized: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '16px',
    textAlign: 'center' as const,
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600',
  },
};

export default App;
