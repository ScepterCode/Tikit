# WhatsApp Business API Setup Guide

This guide explains how to set up and use the WhatsApp Business API integration for sending broadcast messages to event ticket holders.

## Prerequisites

1. **WhatsApp Business Account**: You need a verified WhatsApp Business account
2. **Meta Business Account**: Required to access the WhatsApp Business API
3. **Phone Number**: A dedicated phone number for WhatsApp Business

## Setup Steps

### 1. Create a Meta Business Account

1. Go to [Meta Business Suite](https://business.facebook.com/)
2. Create a new business account or use an existing one
3. Verify your business information

### 2. Set Up WhatsApp Business API

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or select an existing one
3. Add the "WhatsApp" product to your app
4. Follow the setup wizard to:
   - Add a phone number
   - Verify the phone number
   - Set up a payment method (for production use)

### 3. Get API Credentials

After setup, you'll need the following credentials:

- **Phone Number ID**: Found in the WhatsApp > API Setup section
- **Access Token**: Generate a permanent access token in the WhatsApp > API Setup section
- **Business Account ID**: Found in your business settings

### 4. Configure Environment Variables

Add the following to your `.env` file:

```bash
# WhatsApp Business API Configuration
WHATSAPP_API_URL=https://graph.facebook.com/v18.0
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

### 5. Test the Integration

The WhatsApp service will automatically detect if it's configured. If not configured, it will log messages instead of sending them (useful for development).

## Usage

### Backend API

#### Send WhatsApp Broadcast

**Endpoint**: `POST /api/notifications/whatsapp/broadcast`

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "eventId": "event-uuid",
  "message": "Your broadcast message here"
}
```

**Response**:
```json
{
  "success": true,
  "message": "WhatsApp broadcast sent to 150 of 150 recipients",
  "sentCount": 150,
  "failedCount": 0,
  "totalRecipients": 150
}
```

### Frontend Component

Use the `BroadcastComposer` component in your organizer dashboard:

```tsx
import { BroadcastComposer } from '../components/organizer/BroadcastComposer';

function OrganizerDashboard() {
  const handleSendBroadcast = async (eventId: string, message: string) => {
    const response = await fetch('/api/notifications/whatsapp/broadcast', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId, message }),
    });
    
    return await response.json();
  };

  return (
    <BroadcastComposer
      eventId="event-123"
      eventTitle="My Event"
      ticketHolderCount={150}
      onSendBroadcast={handleSendBroadcast}
    />
  );
}
```

## Message Format

Messages are automatically formatted with event branding:

```
📢 *Event Title*

Your custom message here

_Sent via Tikit_
```

## Rate Limits

WhatsApp Business API has rate limits:
- **Tier 1**: 1,000 messages per 24 hours
- **Tier 2**: 10,000 messages per 24 hours
- **Tier 3**: 100,000 messages per 24 hours

The service includes a 50ms delay between messages to avoid hitting rate limits.

## Phone Number Format

Phone numbers are automatically formatted to Nigerian international format:
- Input: `08012345678` → Output: `+2348012345678`
- Input: `2348012345678` → Output: `+2348012345678`
- Input: `+2348012345678` → Output: `+2348012345678`

## Testing

### Development Mode

If WhatsApp credentials are not configured, the service will:
- Log messages to the console
- Return success responses with mock message IDs
- Allow you to test the flow without sending actual messages

### Production Mode

Once configured, messages will be sent via the WhatsApp Business API.

## Troubleshooting

### Messages Not Sending

1. **Check credentials**: Ensure all environment variables are set correctly
2. **Verify phone number**: Make sure the phone number is verified in Meta Business Suite
3. **Check rate limits**: You may have hit the daily message limit
4. **Review logs**: Check console logs for error messages

### Invalid Phone Numbers

- Ensure phone numbers are in valid Nigerian format
- The service only supports Nigerian phone numbers (+234)
- Invalid numbers will be skipped and counted in `failedCount`

### API Errors

Common error codes:
- `190`: Access token expired - generate a new permanent token
- `100`: Invalid parameter - check phone number format
- `131009`: Rate limit exceeded - wait 24 hours or upgrade tier

## Security

- **Never commit** your access token to version control
- Use environment variables for all credentials
- Rotate access tokens periodically
- Monitor usage in Meta Business Suite

## Support

For WhatsApp Business API support:
- [WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp)
- [Meta Business Help Center](https://www.facebook.com/business/help)
