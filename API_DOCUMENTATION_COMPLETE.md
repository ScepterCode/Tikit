# 📚 SECRET EVENTS SYSTEM - COMPLETE API DOCUMENTATION

## 🔗 API Overview

The Secret Events System provides a comprehensive REST API with WebSocket support for real-time features. All endpoints require authentication via Bearer tokens.

**Base URL**: `http://localhost:8000` (development) | `https://api.yourdomain.com` (production)  
**WebSocket URL**: `ws://localhost:8000/ws` (development) | `wss://api.yourdomain.com/ws` (production)

---

## 🔐 Authentication

All API endpoints require authentication via Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### Login Endpoint
```http
POST /api/auth/login
Content-Type: application/json

{
  "phoneNumber": "+2349087654321",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { ... },
    "access_token": "mock_access_token_...",
    "refresh_token": "mock_refresh_token_..."
  }
}
```

---

## 👑 MEMBERSHIP API (Phase 1)

### Get Membership Status
```http
GET /api/memberships/status
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "membership": {
      "tier": "premium",
      "status": "active",
      "features": ["secret_events", "anonymous_chat", ...],
      "expires_at": 1704067200
    },
    "is_premium": true,
    "days_remaining": 30
  }
}
```

### Upgrade Membership
```http
POST /api/memberships/upgrade
Authorization: Bearer <token>
Content-Type: application/json

{
  "tier": "premium",
  "duration": "monthly",
  "payment_reference": "PAY_123456"
}
```

### Get Pricing Information
```http
GET /api/memberships/pricing
```

### Cancel Membership
```http
POST /api/memberships/cancel
Authorization: Bearer <token>
```

### Check Feature Access
```http
GET /api/memberships/check-feature/{feature}
Authorization: Bearer <token>
```

### Get Membership Statistics (Admin Only)
```http
GET /api/memberships/stats
Authorization: Bearer <admin_token>
```

---

## 🔐 SECRET EVENTS API (Phase 2)

### Create Secret Event
```http
POST /api/secret-events/create
Authorization: Bearer <organizer_token>
Content-Type: application/json

{
  "title": "Secret Tech Meetup",
  "description": "Exclusive gathering for premium members",
  "venue": "123 Secret Street, Lagos",
  "public_venue": "Lagos Island Area",
  "start_date": "2024-12-25T18:00:00Z",
  "premium_tier_required": "premium",
  "location_reveal_hours": 2,
  "max_attendees": 50,
  "price": 10000,
  "anonymous_purchases_allowed": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Secret event created successfully",
  "data": {
    "event_id": "uuid-here",
    "master_invite_code": "XSBTV97H",
    "location_reveal_time": "2024-12-25T16:00:00Z",
    "public_venue": "Lagos Island Area"
  }
}
```

### Validate Invite Code
```http
POST /api/secret-events/validate-invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "invite_code": "XSBTV97H"
}
```

### Get Accessible Secret Events
```http
GET /api/secret-events/accessible
Authorization: Bearer <token>
```

### Purchase Anonymous Ticket
```http
POST /api/secret-events/purchase-anonymous-ticket
Authorization: Bearer <token>
Content-Type: application/json

{
  "event_id": "uuid-here",
  "tier_id": "tier-uuid",
  "is_anonymous": true,
  "buyer_email": "optional@email.com"
}
```

### Get Secret Event Details
```http
GET /api/secret-events/event/{event_id}
Authorization: Bearer <token>
```

### Get Event Invite Codes (Organizer Only)
```http
GET /api/secret-events/invite-codes/{event_id}
Authorization: Bearer <organizer_token>
```

---

## 💬 ANONYMOUS CHAT API (Phase 3)

### Create Chat Room
```http
POST /api/anonymous-chat/create-room
Authorization: Bearer <organizer_token>
Content-Type: application/json

{
  "event_id": "uuid-here"
}
```

### Join Chat Room
```http
POST /api/anonymous-chat/join-room
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_id": "room-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Joined anonymous chat room",
  "data": {
    "room": { ... },
    "anonymous_identity": {
      "id": "identity-uuid",
      "anonymous_name": "Azure Tiger",
      "avatar_color": "#4ECDC4"
    }
  }
}
```

### Send Anonymous Message
```http
POST /api/anonymous-chat/send-message
Authorization: Bearer <token>
Content-Type: application/json

{
  "room_id": "room-uuid",
  "message": "Hello from the shadows! 👻",
  "message_type": "text"
}
```

### Get Chat Messages
```http
GET /api/anonymous-chat/messages/{room_id}?limit=50&before_timestamp=1704067200
Authorization: Bearer <token>
```

### Send Premium Message
```http
POST /api/anonymous-chat/send-premium-message
Authorization: Bearer <organizer_token>
Content-Type: application/json

{
  "event_id": "uuid-here",
  "message": "🗺️ SECRET LOCATION REVEALED: 123 Secret Street, Lagos",
  "message_type": "location_reveal",
  "recipients": null
}
```

### Get Premium Messages
```http
GET /api/anonymous-chat/premium-messages/{event_id}
Authorization: Bearer <token>
```

### Get Chat Room Statistics
```http
GET /api/anonymous-chat/room-stats/{room_id}
Authorization: Bearer <organizer_token>
```

### Get Chat Rooms by Event
```http
GET /api/anonymous-chat/rooms/by-event/{event_id}
Authorization: Bearer <token>
```

---

## 📊 ANALYTICS API (Phase 4)

### Get Secret Event Analytics
```http
GET /api/analytics/secret-event/{event_id}
Authorization: Bearer <organizer_token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "event_id": "uuid-here",
    "invites": {
      "total_generated": 5,
      "total_used": 3,
      "usage_rate": 60.0
    },
    "tickets": {
      "total_sold": 25,
      "anonymous_purchases": 15,
      "revenue": 250000
    },
    "chat": {
      "total_messages": 150,
      "active_participants": 20,
      "engagement_rate": 80.0
    },
    "demographics": {
      "premium_members": 20,
      "vip_members": 5
    }
  }
}
```

### Get Platform Analytics (Admin Only)
```http
GET /api/analytics/platform
Authorization: Bearer <admin_token>
```

---

## 🔌 WEBSOCKET API (Phase 4)

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/{user_id}?token={access_token}');

ws.onopen = () => {
  console.log('Connected to WebSocket');
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

### Subscribe to Room Updates
```javascript
ws.send(JSON.stringify({
  type: 'subscribe_room',
  room_id: 'room-uuid'
}));
```

### WebSocket Message Types
- `connection_established`: Connection confirmation
- `room_subscribed`: Room subscription confirmation
- `new_message`: New chat message in subscribed room
- `premium_message`: New premium message for user
- `location_revealed`: Location reveal notification
- `event_update`: Event status changes

---

## 📝 REQUEST/RESPONSE FORMATS

### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { ... }
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: User lacks required permissions
- `NOT_FOUND`: Requested resource doesn't exist
- `VALIDATION_ERROR`: Invalid request data
- `PREMIUM_REQUIRED`: Premium membership required
- `RATE_LIMITED`: Too many requests

---

## 🔒 Security Considerations

### Authentication
- All endpoints require valid Bearer token
- Tokens expire and must be refreshed
- Mock tokens for development: `mock_access_token_{user_id}`

### Authorization
- Role-based access control (attendee, organizer, admin)
- Premium feature access based on membership tier
- Event-specific permissions (organizer can only modify own events)

### Data Privacy
- Anonymous chat identities never reveal real user information
- Premium messages encrypted in transit
- Automatic data cleanup (24-hour message retention)
- Location reveals are time-controlled

### Rate Limiting
- API endpoints have rate limits to prevent abuse
- WebSocket connections limited per user
- Premium members get higher rate limits

---

## 🚀 Usage Examples

### Complete Secret Event Flow
```javascript
// 1. Check membership status
const membership = await fetch('/api/memberships/status', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 2. Upgrade to premium if needed
if (!membership.is_premium) {
  await fetch('/api/memberships/upgrade', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ tier: 'premium', duration: 'monthly' })
  });
}

// 3. Create secret event (organizer)
const event = await fetch('/api/secret-events/create', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${organizerToken}` },
  body: JSON.stringify({ ... })
});

// 4. Validate invite code (attendee)
const validation = await fetch('/api/secret-events/validate-invite', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${attendeeToken}` },
  body: JSON.stringify({ invite_code: 'XSBTV97H' })
});

// 5. Join anonymous chat
const chatRoom = await fetch('/api/anonymous-chat/join-room', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${attendeeToken}` },
  body: JSON.stringify({ room_id: roomId })
});
```

---

**The Secret Events System API provides comprehensive functionality for privacy-focused event management with premium features and real-time communication capabilities.** 🚀