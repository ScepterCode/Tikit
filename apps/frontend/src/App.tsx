import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { Home } from './pages/Home';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PreferencesPage } from './pages/PreferencesPage';
import { PaymentSharePage } from './pages/PaymentSharePage';
import { AuthDebug } from './pages/AuthDebug';
import { DashboardRouter } from './pages/DashboardRouter';
import { AttendeeDashboard } from './pages/attendee/AttendeeDashboard';
import { MyTickets } from './pages/attendee/MyTickets';
import { Wallet } from './pages/attendee/Wallet';
import { Referrals } from './pages/attendee/Referrals';
import { Profile } from './pages/attendee/Profile';
import { Events } from './pages/Events';
import { EventDetail } from './pages/EventDetail';
import { Checkout } from './pages/Checkout';
import { OrganizerDashboard } from './pages/organizer/OrganizerDashboard';
import { OrganizerEvents } from './pages/organizer/OrganizerEvents';
import { CreateEvent } from './pages/organizer/CreateEvent';
import { OrganizerAttendees } from './pages/organizer/OrganizerAttendees';
import { OrganizerFinancials } from './pages/organizer/OrganizerFinancials';
import { OrganizerBroadcast } from './pages/organizer/OrganizerBroadcast';
import { OrganizerScanner } from './pages/organizer/OrganizerScanner';
import { OrganizerSettings } from './pages/organizer/OrganizerSettings';
import { OrganizerAnalytics } from './pages/organizer/OrganizerAnalytics';
import OrganizerWallet from './pages/organizer/OrganizerWallet';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminAnnouncements } from './pages/admin/AdminAnnouncements';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminEvents } from './pages/admin/AdminEvents';
import { AdminFinancials } from './pages/admin/AdminFinancials';
import { AdminAnalytics } from './pages/admin/AdminAnalytics';
import { AdminSecurity } from './pages/admin/AdminSecurity';
import { AdminSettings } from './pages/admin/AdminSettings';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';
import { ApiStatusIndicator } from './components/common/ApiStatusIndicator';
import { NotificationCenter } from './components/notifications/NotificationCenter';
import { NotificationsPage } from './pages/NotificationsPage';

function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/auth/login" element={<LoginPage />} />
          <Route path="/auth/register" element={<RegisterPage />} />
          <Route path="/debug/auth" element={<AuthDebug />} />
          
          {/* Preferences - After registration */}
          <Route 
            path="/preferences" 
            element={
              <ProtectedRoute>
                <PreferencesPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Payment Share - Public link for group buy */}
          <Route path="/payment-share/pay/:purchaseId/:shareId" element={<PaymentSharePage />} />
          
          {/* Admin Login - Separate route for security */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

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
                <EventDetail />
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
            path="/organizer/wallet"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <OrganizerWallet />
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
          <Route
            path="/organizer/notifications"
            element={
              <ProtectedRoute allowedRoles={['organizer']}>
                <NotificationsPage />
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
            path="/admin/notifications"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/notifications"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendee/settings"
            element={
              <ProtectedRoute allowedRoles={['attendee']}>
                <Profile />
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
            path="/admin/announcements"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnnouncements />
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
      </SupabaseAuthProvider>
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
