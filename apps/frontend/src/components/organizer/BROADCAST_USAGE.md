# WhatsApp Broadcast Composer Usage Guide

This guide shows how to integrate the WhatsApp Broadcast Composer into your organizer dashboard.

## Component Overview

The `BroadcastComposer` component provides a complete UI for sending WhatsApp broadcasts to event ticket holders.

### Features

- Message composition with character counter (1000 char limit)
- Quick message templates for common scenarios
- Live preview of formatted message
- Confirmation dialog for large broadcasts (>100 recipients)
- Success/error feedback
- Automatic message formatting with event branding

## Basic Usage

```tsx
import { BroadcastComposer } from './components/organizer/BroadcastComposer';

function OrganizerDashboard() {
  const eventId = 'event-123';
  const eventTitle = 'My Amazing Event';
  const ticketHolderCount = 150;

  const handleSendBroadcast = async (eventId: string, message: string) => {
    try {
      const response = await fetch('/api/notifications/whatsapp/broadcast', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ eventId, message }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: 'Failed to send broadcast. Please try again.',
      };
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Event Dashboard</h1>
      
      <BroadcastComposer
        eventId={eventId}
        eventTitle={eventTitle}
        ticketHolderCount={ticketHolderCount}
        onSendBroadcast={handleSendBroadcast}
      />
    </div>
  );
}
```

## Integration with Event Management

```tsx
import { useState, useEffect } from 'react';
import { BroadcastComposer } from './components/organizer/BroadcastComposer';
import { AnalyticsDashboard } from './components/organizer/AnalyticsDashboard';

function EventManagementPage({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch event details
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });
      const data = await response.json();
      setEvent(data.event);
    } catch (error) {
      console.error('Failed to fetch event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBroadcast = async (eventId: string, message: string) => {
    const response = await fetch('/api/notifications/whatsapp/broadcast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId, message }),
    });

    return await response.json();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!event) {
    return <div>Event not found</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <span className="text-sm text-gray-500">
          {event.ticketsSold} / {event.capacity} tickets sold
        </span>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard
        eventId={eventId}
        onFetchAnalytics={fetchAnalytics}
      />

      {/* WhatsApp Broadcast */}
      <BroadcastComposer
        eventId={eventId}
        eventTitle={event.title}
        ticketHolderCount={event.ticketsSold}
        onSendBroadcast={handleSendBroadcast}
      />
    </div>
  );
}
```

## Props

### BroadcastComposer Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `eventId` | `string` | Yes | The unique identifier of the event |
| `eventTitle` | `string` | Yes | The title of the event (used in message formatting) |
| `ticketHolderCount` | `number` | Yes | Number of ticket holders who will receive the broadcast |
| `onSendBroadcast` | `(eventId: string, message: string) => Promise<BroadcastResult>` | Yes | Callback function to send the broadcast |

### BroadcastResult Type

```typescript
interface BroadcastResult {
  success: boolean;
  message: string;
  sentCount?: number;
  failedCount?: number;
  totalRecipients?: number;
}
```

## Quick Templates

The component includes 4 pre-built templates:

1. **Event Reminder**: General reminder about the event
2. **Venue Update**: Notification about venue changes
3. **Time Change**: Alert about schedule changes
4. **Thank You**: Appreciation message for ticket purchase

Users can click any template to insert it into the message field and customize it.

## Message Formatting

Messages are automatically formatted with:
- Event title as a header with emoji (📢)
- User's custom message
- Footer with "Sent via Grooovy" branding

Example output:
```
📢 *My Amazing Event*

Hi! This is a reminder about the event. We're looking forward to seeing you there! 🎉

_Sent via Grooovy_
```

## Confirmation Dialog

For broadcasts with more than 100 recipients, a confirmation dialog appears to prevent accidental sends:

- Shows warning icon and message count
- Requires explicit confirmation
- Can be cancelled without sending

## Error Handling

The component handles various error scenarios:

- Empty message validation
- Network errors
- API errors
- Partial send failures (some recipients failed)

All errors are displayed in a user-friendly format with appropriate styling.

## Styling

The component uses Tailwind CSS classes and follows the existing design system:

- Responsive layout (mobile-friendly)
- Consistent color scheme (green for success, red for errors, orange for warnings)
- Smooth transitions and animations
- Accessible focus states

## Best Practices

1. **Message Length**: Keep messages under 1000 characters
2. **Frequency**: Don't send too many broadcasts to avoid spam complaints
3. **Relevance**: Only send important updates (venue changes, time changes, reminders)
4. **Timing**: Send broadcasts at appropriate times (not too early or late)
5. **Testing**: Test with a small group before sending to all attendees

## API Endpoint

The component expects the following API endpoint:

**POST** `/api/notifications/whatsapp/broadcast`

**Request:**
```json
{
  "eventId": "event-uuid",
  "message": "Your message here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "WhatsApp broadcast sent to 150 of 150 recipients",
  "sentCount": 150,
  "failedCount": 0,
  "totalRecipients": 150
}
```

## Security

- Only event organizers can send broadcasts (verified by backend)
- JWT authentication required
- Rate limiting applied on backend
- Message content is sanitized

## Troubleshooting

### Broadcast Not Sending

1. Check authentication token is valid
2. Verify user is the event organizer
3. Ensure WhatsApp API is configured on backend
4. Check network connectivity

### Partial Failures

If some messages fail to send:
- Check phone number formats in database
- Verify WhatsApp API rate limits not exceeded
- Review backend logs for specific errors

### UI Not Updating

- Ensure `onSendBroadcast` returns a proper Promise
- Check response format matches `BroadcastResult` type
- Verify state updates are triggering re-renders
