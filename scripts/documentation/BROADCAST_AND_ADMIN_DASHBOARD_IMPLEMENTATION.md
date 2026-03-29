# 🔔 Broadcast System & Admin Dashboard Implementation

## Overview

This document describes the implementation of:
1. **Real-time Broadcast & Notification System** - For admins to send broadcasts and notifications to users
2. **Real-time Admin Dashboard** - Replaces mock data with real database data

---

## 1. Real-time Broadcast & Notification System

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationCenter Component                        │  │
│  │  - Displays notifications                            │  │
│  │  - Shows unread count                                │  │
│  │  - Marks as read                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  useNotifications Hook                               │  │
│  │  - Fetches notifications                             │  │
│  │  - Manages notification state                        │  │
│  │  - Auto-refresh every 30 seconds                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Notification Endpoints                              │  │
│  │  - GET /api/notifications                            │  │
│  │  - GET /api/notifications/unread-count               │  │
│  │  - PUT /api/notifications/{id}/read                  │  │
│  │  - POST /api/notifications/broadcast                 │  │
│  │  - POST /api/notifications/ticket-sale               │  │
│  │  - POST /api/notifications/event-update              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  NotificationService                                 │  │
│  │  - Creates notifications                             │  │
│  │  - Sends broadcasts                                  │  │
│  │  - Manages notification state                        │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  notifications table                                 │  │
│  │  - id, user_id, type, title, message                 │  │
│  │  - data, read, created_at                            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Notification Types

1. **Broadcast** - Admin sends message to all/specific users
   - Target: All users or specific roles (attendee, organizer, admin)
   - Example: "Platform maintenance scheduled"

2. **Ticket Sale** - Organizer notified of ticket sales
   - Target: Event organizer
   - Example: "5 tickets sold for ₦50,000"

3. **Event Update** - Users notified of event changes
   - Target: Users with tickets for the event
   - Types: cancelled, rescheduled, location_changed, etc.
   - Example: "Event rescheduled to March 15"

4. **Alert** - System alerts for important events
   - Target: Specific users or admins
   - Example: "Suspicious activity detected"

### Backend Implementation

#### NotificationService (`services/notification_service.py`)

```python
class NotificationService:
    async def create_notification(user_id, type, title, message, data)
    async def get_user_notifications(user_id, limit, unread_only)
    async def mark_notification_read(notification_id)
    async def mark_all_notifications_read(user_id)
    async def send_broadcast(title, message, target_roles)
    async def notify_ticket_sale(event_id, organizer_id, ticket_count, amount)
    async def notify_event_update(event_id, update_type, message)
    async def get_unread_count(user_id)
```

#### Notification Endpoints (`routers/notifications.py`)

```
GET    /api/notifications                    - Get user notifications
GET    /api/notifications/unread-count       - Get unread count
PUT    /api/notifications/{id}/read          - Mark as read
PUT    /api/notifications/mark-all-read      - Mark all as read
POST   /api/notifications/broadcast          - Send broadcast (admin)
POST   /api/notifications/ticket-sale        - Notify ticket sale
POST   /api/notifications/event-update       - Notify event update
```

### Frontend Implementation

#### useNotifications Hook (`hooks/useNotifications.ts`)

```typescript
const {
  notifications,      // Array of notifications
  unreadCount,        // Count of unread notifications
  loading,            // Loading state
  error,              // Error message
  fetchNotifications, // Fetch notifications
  fetchUnreadCount,   // Fetch unread count
  markAsRead,         // Mark single as read
  markAllAsRead       // Mark all as read
} = useNotifications();
```

#### NotificationCenter Component (`components/notifications/NotificationCenter.tsx`)

- Displays notification bell with unread badge
- Shows dropdown with recent notifications
- Allows marking as read
- Auto-refreshes every 30 seconds
- Shows notification type with icon and color

### Usage Examples

#### Admin Sending Broadcast

```typescript
// Send broadcast to all users
await apiService.request('/api/notifications/broadcast', {
  method: 'POST',
  body: {
    title: 'Platform Maintenance',
    message: 'Scheduled maintenance on March 15, 2-4 AM',
    target_roles: null  // All users
  }
});

// Send broadcast to organizers only
await apiService.request('/api/notifications/broadcast', {
  method: 'POST',
  body: {
    title: 'New Feature Available',
    message: 'Check out our new analytics dashboard',
    target_roles: ['organizer']
  }
});
```

#### Notifying Ticket Sale

```typescript
// Notify organizer about ticket sale
await apiService.request('/api/notifications/ticket-sale', {
  method: 'POST',
  body: {
    event_id: 'event-123',
    organizer_id: 'user-456',
    ticket_count: 5,
    amount: 50000
  }
});
```

#### Notifying Event Update

```typescript
// Notify users about event cancellation
await apiService.request('/api/notifications/event-update', {
  method: 'POST',
  body: {
    event_id: 'event-123',
    update_type: 'cancelled',
    message: 'Event cancelled due to unforeseen circumstances'
  }
});
```

---

## 2. Real-time Admin Dashboard

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AdminDashboard Component                            │  │
│  │  - Displays real-time stats                          │  │
│  │  - Shows recent activity                             │  │
│  │  - Shows pending actions                             │  │
│  │  - Auto-refresh every 30 seconds                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Backend (FastAPI)                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Admin Dashboard Endpoints                           │  │
│  │  - GET /api/admin/dashboard/stats                    │  │
│  │  - GET /api/admin/dashboard/activity                 │  │
│  │  - GET /api/admin/dashboard/pending-actions          │  │
│  │  - GET /api/admin/dashboard/user-breakdown           │  │
│  │  - GET /api/admin/dashboard/event-breakdown          │  │
│  │  - GET /api/admin/dashboard/revenue-breakdown        │  │
│  │  - GET /api/admin/dashboard/top-events               │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AdminDashboardService                               │  │
│  │  - Fetches real data from database                   │  │
│  │  - Calculates statistics                             │  │
│  │  - Aggregates data                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                    Database (Supabase)                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  users, events, tickets, transactions tables         │  │
│  │  - Real data from database                           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Dashboard Sections

#### 1. Statistics Cards
- **Total Users**: Count of all registered users
- **Active Events**: Events created this month
- **Tickets Sold**: Tickets sold this month
- **Platform Revenue**: Total revenue this month

#### 2. Recent Activity
- User registrations
- Event creations
- Ticket sales
- Sorted by timestamp (newest first)

#### 3. Pending Actions
- Organizer verifications pending
- Flagged events
- Support tickets

#### 4. User Breakdown
- Count by role: attendee, organizer, admin

#### 5. Event Breakdown
- Upcoming events
- Past events
- Cancelled events

#### 6. Revenue Breakdown
- Revenue by payment method

#### 7. Top Events
- Events with most ticket sales

### Backend Implementation

#### AdminDashboardService (`services/admin_dashboard_service.py`)

```python
class AdminDashboardService:
    async def get_dashboard_stats() -> Dict
    async def get_recent_activity(limit) -> List
    async def get_pending_actions() -> Dict
    async def get_user_breakdown() -> Dict
    async def get_event_breakdown() -> Dict
    async def get_revenue_breakdown() -> Dict
    async def get_top_events(limit) -> List
```

#### Admin Dashboard Endpoints (`routers/admin_dashboard.py`)

```
GET /api/admin/dashboard/stats              - Dashboard statistics
GET /api/admin/dashboard/activity           - Recent activity
GET /api/admin/dashboard/pending-actions    - Pending actions
GET /api/admin/dashboard/user-breakdown     - Users by role
GET /api/admin/dashboard/event-breakdown    - Events by status
GET /api/admin/dashboard/revenue-breakdown  - Revenue by method
GET /api/admin/dashboard/top-events         - Top events
```

### Frontend Implementation

#### AdminDashboard Component (`pages/admin/AdminDashboard.tsx`)

```typescript
const [stats, setStats] = useState<DashboardStats>({
  total_users: 0,
  active_events: 0,
  tickets_sold: 0,
  platform_revenue: 0
});

const [pending, setPending] = useState<PendingActions>({
  organizer_verifications: 0,
  flagged_events: 0,
  support_tickets: 0
});

const [activity, setActivity] = useState<Activity[]>([]);

// Load data on mount and refresh every 30 seconds
useEffect(() => {
  loadDashboardData();
  const interval = setInterval(loadDashboardData, 30000);
  return () => clearInterval(interval);
}, []);
```

### Data Flow

1. **Admin opens dashboard**
   - Component mounts
   - `loadDashboardData()` called

2. **Fetch real data**
   - GET `/api/admin/dashboard/stats`
   - GET `/api/admin/dashboard/activity`
   - GET `/api/admin/dashboard/pending-actions`

3. **Backend queries database**
   - Count users, events, tickets
   - Calculate revenue
   - Get recent activities
   - Count pending items

4. **Display data**
   - Stats cards show real numbers
   - Activity list shows real events
   - Pending cards show real counts

5. **Auto-refresh**
   - Every 30 seconds, fetch new data
   - Update UI with latest information

---

## 3. Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,  -- broadcast, ticket_sale, event_update, alert
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## 4. Integration Points

### When to Send Notifications

1. **Ticket Purchase**
   - Notify organizer: "X tickets sold for ₦Y"
   - Notify attendee: "Ticket purchase confirmed"

2. **Event Update**
   - Notify attendees: "Event rescheduled"
   - Notify organizer: "Event updated"

3. **Admin Broadcast**
   - Notify all users: "Platform announcement"
   - Notify specific role: "Organizer feature update"

4. **System Events**
   - Notify admin: "Suspicious activity detected"
   - Notify user: "Account security alert"

---

## 5. Future Enhancements

### Phase 2
- [ ] WebSocket real-time notifications (instant delivery)
- [ ] Email notifications
- [ ] SMS notifications
- [ ] Push notifications
- [ ] Notification preferences per user

### Phase 3
- [ ] Notification templates
- [ ] Scheduled broadcasts
- [ ] Notification analytics
- [ ] A/B testing for broadcasts
- [ ] Notification scheduling

### Phase 4
- [ ] AI-powered notification recommendations
- [ ] Personalized notifications
- [ ] Notification automation workflows
- [ ] Multi-channel delivery

---

## 6. Testing

### Test Scenarios

1. **Send Broadcast**
   - Admin sends broadcast to all users
   - Verify all users receive notification
   - Verify notification appears in their list

2. **Ticket Sale Notification**
   - Purchase ticket
   - Verify organizer receives notification
   - Verify notification shows correct amount

3. **Event Update Notification**
   - Update event details
   - Verify attendees receive notification
   - Verify notification shows update type

4. **Mark as Read**
   - Receive notification
   - Click to mark as read
   - Verify unread count decreases

5. **Admin Dashboard**
   - Open admin dashboard
   - Verify stats show real data
   - Verify activity shows recent events
   - Verify pending actions show correct counts

---

## 7. API Documentation

### Notification Endpoints

#### GET /api/notifications
Get notifications for current user

**Query Parameters:**
- `limit` (int, default: 50) - Number of notifications to fetch
- `unread_only` (bool, default: false) - Only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "broadcast",
      "title": "Platform Announcement",
      "message": "New feature available",
      "data": {},
      "read": false,
      "created_at": "2024-03-09T10:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST /api/notifications/broadcast
Send broadcast notification (admin only)

**Request Body:**
```json
{
  "title": "Platform Maintenance",
  "message": "Scheduled maintenance on March 15",
  "target_roles": ["attendee", "organizer"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Broadcast sent to 150 users",
  "recipients": 150
}
```

---

## 8. Configuration

### Environment Variables

```bash
# Notification settings
NOTIFICATION_RETENTION_DAYS=90
NOTIFICATION_BATCH_SIZE=100
NOTIFICATION_REFRESH_INTERVAL=30000  # 30 seconds
```

---

## Summary

This implementation provides:

✅ **Real-time Notifications**
- Broadcast system for admins
- Ticket sale notifications for organizers
- Event update notifications for attendees
- Unread count tracking

✅ **Real-time Admin Dashboard**
- Live statistics from database
- Recent activity feed
- Pending actions counter
- User and event breakdowns
- Revenue analytics

✅ **User-Friendly Interface**
- Notification center with bell icon
- Unread badge
- Quick mark as read
- Auto-refresh every 30 seconds

✅ **Scalable Architecture**
- Database-backed notifications
- Efficient queries with indexes
- Pagination support
- Role-based access control

---

**Status:** ✅ COMPLETE
**Date:** March 9, 2026
**Ready for:** Testing and Integration
