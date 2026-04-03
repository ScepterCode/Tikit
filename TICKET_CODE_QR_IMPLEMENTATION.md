# Ticket Code and QR Code Implementation

## Overview
Complete implementation of ticket codes and QR codes for the Tikit ticketing system.

## Features Implemented

### 1. Ticket Code Generation
- **Format**: `XXXX-1234567` (4 uppercase letters - 7 digits)
- **Example**: `LVBM-5303706`
- **Uniqueness**: Each ticket code is guaranteed to be unique in the database
- **Location**: `apps/backend-fastapi/services/ticket_code_generator.py`

### 2. QR Code Generation
- **Content**: QR code encodes the ticket code (not the ticket ID)
- **Format**: Base64-encoded PNG image
- **Size**: 300x300 pixels in email display
- **Purpose**: Quick scanning at event entrance for verification

### 3. Email Integration
- Ticket confirmation emails now include:
  - **Prominent ticket code display** in a gray box
  - **QR code image** embedded in email
  - **Event details** (date, venue, ticket type, quantity, amount)
  - **Instructions** to save the email or screenshot

## Database Schema

### Required Migration
```sql
-- Add ticket_code column to tickets table
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(12) UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);
```

**Status**: ⚠️ Migration needs to be run in Supabase SQL Editor

## Implementation Details

### Ticket Service (`ticket_service.py`)
```python
async def create_ticket(self, ticket_data: dict) -> Optional[dict]:
    # 1. Generate unique ticket code
    ticket_code = await ticket_code_generator.generate_unique_code(self.supabase)
    
    # 2. Add to ticket data
    ticket_data['ticket_code'] = ticket_code
    
    # 3. Generate QR code from ticket code
    qr_code_base64 = self.generate_qr_code(ticket_code)
    ticket_data['qr_code'] = qr_code_base64
    
    # 4. Create ticket in database
    result = self.supabase.table('tickets').insert(ticket_data).execute()
```

### Email Service (`email_service.py`)
```python
async def send_ticket_confirmation(
    self, 
    email: str, 
    ticket_data: Dict[str, Any],
    qr_code_base64: Optional[str] = None
) -> Dict[str, Any]:
    # Email includes:
    # - Ticket code in prominent display
    # - QR code embedded as base64 image
    # - All ticket details
```

## Testing

### Test Email Sent
✅ **Email sent to**: scepterboss@gmail.com
✅ **Ticket Code**: LVBM-5303706
✅ **QR Code**: Generated and embedded
✅ **Status**: Successfully delivered via Resend API

### Test Scripts Available
1. `send_test_ticket_email.py` - Send test ticket confirmation
2. `test_ticket_purchase_flow.py` - Test complete purchase flow
3. `apply_ticket_code_migration.py` - Apply database migration

## Next Steps

### 1. Apply Database Migration
Run this SQL in Supabase SQL Editor:
```sql
ALTER TABLE tickets 
ADD COLUMN IF NOT EXISTS ticket_code VARCHAR(12) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);
```

### 2. Update Payment Flow
Ensure tickets are created with ticket codes after successful payment:
```python
# In payment verification/webhook handler
ticket = await ticket_service.create_ticket({
    "user_id": user_id,
    "event_id": event_id,
    "ticket_type": tier_name,
    "price": amount
})

# Send confirmation email
await email_service.send_ticket_confirmation(
    email=user_email,
    ticket_data={
        "ticket_code": ticket['ticket_code'],
        "event_title": event_title,
        "event_date": event_date,
        "venue": venue,
        "tier_name": tier_name,
        "quantity": quantity,
        "amount": amount
    },
    qr_code_base64=ticket['qr_code']
)
```

### 3. Frontend Updates
- Display ticket code on user's ticket view
- Show QR code for scanning
- Add ticket code to ticket cards

### 4. Scanner Updates
- Update scanner to read QR code
- Validate ticket code from QR
- Check ticket status in database

## Email Template Preview

The ticket confirmation email includes:

```
🎉 Ticket Confirmed!

Test Event - Ticket Code Demo
Thank you for your purchase! Your ticket is ready.

┌─────────────────────────────┐
│     TICKET CODE             │
│     LVBM-5303706           │
└─────────────────────────────┘

Event Date: 2026-05-01 19:00
Venue: Test Venue, Lagos
Ticket Type: VIP
Quantity: 2
Total Paid: ₦10,000.00

Your Entry QR Code
[QR CODE IMAGE]

📱 Show this QR code at the event entrance
QR code contains your ticket code for verification

⚠️ Important: Save this email or screenshot your QR code and ticket code.
```

## Security Considerations

1. **Uniqueness**: Ticket codes are checked against database before creation
2. **Format Validation**: Strict format validation (4 letters - 7 numbers)
3. **QR Code Content**: Only contains ticket code, no sensitive data
4. **Database Index**: Fast lookups for ticket code verification

## Files Modified/Created

### Created
- `apps/backend-fastapi/services/ticket_code_generator.py`
- `add_ticket_code_column.sql`
- `send_test_ticket_email.py`
- `test_ticket_purchase_flow.py`
- `apply_ticket_code_migration.py`

### Modified
- `apps/backend-fastapi/services/ticket_service.py` - Added ticket code generation
- `apps/backend-fastapi/services/email_service.py` - Updated email template with ticket code

## Status

✅ Ticket code generator implemented
✅ QR code generation updated to use ticket code
✅ Email template updated with ticket code display
✅ Test email sent successfully
⚠️ Database migration pending (run SQL in Supabase)
⏳ Payment flow integration pending
⏳ Frontend display updates pending
⏳ Scanner updates pending
