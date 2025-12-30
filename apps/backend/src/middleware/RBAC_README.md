# Role-Based Access Control (RBAC) System

## Overview

The RBAC system provides fine-grained access control for event organizers in the Tikit platform. It allows event owners to delegate specific responsibilities to other users while maintaining control over sensitive operations.

## Roles

### Owner
The user who created the event. Has full control over all aspects of the event.

**Permissions:**
- View analytics
- View attendees
- Export data
- Edit event
- Delete event
- View financial data
- Manage payments
- Broadcast messages
- Manage organizers (add/remove/update other organizers)

### Editor
Can manage event content and communicate with attendees.

**Permissions:**
- View analytics
- View attendees
- Export data
- Edit event
- Broadcast messages

### Viewer
Read-only access to event information.

**Permissions:**
- View analytics
- View attendees

### Financial
Manages financial aspects of the event.

**Permissions:**
- View analytics
- View attendees
- View financial data
- Manage payments
- Export data

## Usage

### Protecting Routes

Use the `requirePermission` middleware to protect routes:

```typescript
import { requirePermission, Permission } from '../middleware/rbac.js';

router.get(
  '/events/:eventId/analytics',
  authenticate,
  requirePermission(Permission.VIEW_ANALYTICS),
  async (req, res) => {
    // Handler code
  }
);
```

### Multiple Permissions

You can require multiple permissions (user needs at least one):

```typescript
router.put(
  '/events/:eventId',
  authenticate,
  requirePermission(Permission.EDIT_EVENT, Permission.MANAGE_ORGANIZERS),
  async (req, res) => {
    // Handler code
  }
);
```

### Managing Organizers

#### Add an Organizer

```typescript
POST /api/organizer/events/:eventId/organizers
{
  "userId": "user-id",
  "role": "editor",
  "customPermissions": ["broadcast_messages"] // Optional
}
```

#### Update an Organizer

```typescript
PUT /api/organizer/events/:eventId/organizers/:userId
{
  "role": "financial",
  "customPermissions": []
}
```

#### Remove an Organizer

```typescript
DELETE /api/organizer/events/:eventId/organizers/:userId
```

#### List Organizers

```typescript
GET /api/organizer/events/:eventId/organizers
```

## Custom Permissions

In addition to role-based permissions, you can grant custom permissions to individual organizers:

```typescript
await addEventOrganizer(ownerId, {
  eventId: 'event-123',
  userId: 'user-456',
  role: 'viewer',
  customPermissions: [Permission.EXPORT_DATA, Permission.BROADCAST_MESSAGES]
});
```

This allows for flexible permission management beyond the predefined roles.

## Permission Hierarchy

```
Owner (Full Control)
├── Editor (Content Management)
├── Financial (Money Management)
└── Viewer (Read-Only)
```

## Database Schema

```sql
CREATE TABLE "EventOrganizer" (
    "id" TEXT PRIMARY KEY,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "permissions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    
    CONSTRAINT "EventOrganizer_eventId_userId_key" UNIQUE ("eventId", "userId"),
    FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE,
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
);
```

## Security Considerations

1. **Owner-Only Operations**: Only the event owner can add, update, or remove organizers
2. **Permission Validation**: All protected routes validate permissions before allowing access
3. **Cascade Deletion**: When an event or user is deleted, associated organizer records are automatically removed
4. **Unique Constraint**: A user can only have one role per event

## Testing

The RBAC system includes comprehensive unit tests:

```bash
npm test rbac
```

Tests cover:
- Permission definitions for each role
- User role retrieval
- Permission checking
- Middleware authorization
- Organizer management operations

## Error Responses

### 401 Unauthorized
User is not authenticated.

### 403 Forbidden
User lacks required permissions.

```json
{
  "success": false,
  "error": {
    "code": "AUTHORIZATION_ERROR",
    "message": "Insufficient permissions for this action",
    "timestamp": "2025-01-01T00:00:00.000Z",
    "details": {
      "required": ["edit_event"],
      "userPermissions": ["view_analytics", "view_attendees"]
    }
  }
}
```

## Future Enhancements

- Permission templates for common organizer types
- Time-limited access (temporary organizers)
- Audit logging for permission changes
- Bulk organizer management
- Permission inheritance for sub-events
