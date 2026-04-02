# Organizer Payment Flow - Critical Gap & Solution

## 🚨 CRITICAL ISSUE IDENTIFIED

### Problem
**When an attendee purchases a ticket, the organizer's wallet balance is NOT automatically credited!**

### Current Flow (BROKEN):
```
Attendee buys ticket (₦25,000)
    ↓
Payment verified ✅
    ↓
Ticket created ✅
    ↓
Attendee wallet debited ✅ (if wallet payment)
    ↓
❌ Organizer wallet NOT credited
    ↓
❌ Money disappears into the void!
```

### What SHOULD Happen:
```
Attendee buys ticket (₦25,000)
    ↓
Payment verified ✅
    ↓
Ticket created ✅
    ↓
Attendee wallet debited ✅ (if wallet payment)
    ↓
✅ Organizer wallet credited (+₦25,000)
    ↓
✅ Transaction recorded
    ↓
✅ Notification sent to organizer
```

---

## Root Cause Analysis

### Files Checked:
1. ✅ `routers/tickets.py` - Ticket creation endpoint exists
2. ✅ `routers/payments.py` - Payment verification exists
3. ❌ **NO CODE** to credit organizer wallet
4. ❌ **NO TRANSACTION** linking payment to organizer

### Missing Logic:
```python
# This code DOES NOT EXIST anywhere:
organizer_wallet.balance += ticket_price
organizer_wallet.save()
```

---

## Solution: Implement Organizer Payment Flow

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│  TICKET PURCHASE FLOW WITH ORGANIZER PAYMENT            │
└─────────────────────────────────────────────────────────┘

1. Attendee Pays
   ├─ Card Payment (Flutterwave)
   │  └─ Money goes to platform account
   └─ Wallet Payment
      └─ Deduct from attendee wallet

2. Payment Verified
   └─ Create payment record

3. Create Ticket
   └─ Link to payment & event

4. Credit Organizer ⭐ NEW
   ├─ Get event organizer_id
   ├─ Calculate organizer share (ticket_price - platform_fee)
   ├─ Credit organizer wallet
   └─ Create transaction record

5. Notifications
   ├─ Send ticket to attendee
   └─ Notify organizer of sale
```

---

## Implementation Plan

### Step 1: Create Organizer Credit Function

**File**: `apps/backend-fastapi/services/organizer_payment_service.py` (NEW)

```python
from typing import Dict, Any
from database import supabase_client
from decimal import Decimal

class OrganizerPaymentService:
    """Handle organizer payments and wallet credits"""
    
    def __init__(self):
        self.platform_fee_percentage = 5  # 5% platform fee
        
    async def credit_organizer_for_ticket_sale(
        self,
        event_id: str,
        ticket_price: float,
        payment_reference: str,
        attendee_id: str
    ) -> Dict[str, Any]:
        """
        Credit organizer wallet when ticket is sold
        
        Args:
            event_id: ID of the event
            ticket_price: Price of the ticket sold
            payment_reference: Payment transaction reference
            attendee_id: ID of the attendee who bought the ticket
            
        Returns:
            Dict with success status and transaction details
        """
        try:
            supabase = supabase_client.get_service_client()
            
            # 1. Get event and organizer details
            event_result = supabase.table('events')\
                .select('id, organizer_id, title')\
                .eq('id', event_id)\
                .single()\
                .execute()
            
            if not event_result.data:
                return {
                    "success": False,
                    "error": "Event not found"
                }
            
            event = event_result.data
            organizer_id = event['organizer_id']
            
            # 2. Calculate organizer share (deduct platform fee)
            platform_fee = Decimal(str(ticket_price)) * Decimal(str(self.platform_fee_percentage)) / 100
            organizer_share = Decimal(str(ticket_price)) - platform_fee
            
            # 3. Get or create organizer wallet
            wallet_result = supabase.table('wallets')\
                .select('*')\
                .eq('user_id', organizer_id)\
                .execute()
            
            if not wallet_result.data:
                # Create wallet if doesn't exist
                wallet_create = supabase.table('wallets').insert({
                    'user_id': organizer_id,
                    'balance': float(organizer_share),
                    'currency': 'NGN'
                }).execute()
                
                new_balance = float(organizer_share)
            else:
                # Update existing wallet
                current_balance = Decimal(str(wallet_result.data[0]['balance']))
                new_balance = float(current_balance + organizer_share)
                
                supabase.table('wallets')\
                    .update({'balance': new_balance})\
                    .eq('user_id', organizer_id)\
                    .execute()
            
            # 4. Create transaction record
            transaction = supabase.table('transactions').insert({
                'user_id': organizer_id,
                'type': 'credit',
                'amount': float(organizer_share),
                'description': f'Ticket sale for {event["title"]}',
                'reference': f'TICKET_SALE_{payment_reference}',
                'status': 'completed',
                'metadata': {
                    'event_id': event_id,
                    'ticket_price': ticket_price,
                    'platform_fee': float(platform_fee),
                    'attendee_id': attendee_id,
                    'payment_reference': payment_reference
                }
            }).execute()
            
            # 5. Create notification for organizer
            supabase.table('notifications').insert({
                'user_id': organizer_id,
                'type': 'ticket_sold',
                'title': 'Ticket Sold! 🎉',
                'message': f'You earned ₦{float(organizer_share):,.2f} from a ticket sale for {event["title"]}',
                'data': {
                    'event_id': event_id,
                    'amount': float(organizer_share),
                    'transaction_id': transaction.data[0]['id'] if transaction.data else None
                }
            }).execute()
            
            return {
                "success": True,
                "organizer_id": organizer_id,
                "amount_credited": float(organizer_share),
                "platform_fee": float(platform_fee),
                "new_balance": new_balance,
                "transaction_id": transaction.data[0]['id'] if transaction.data else None
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }

organizer_payment_service = OrganizerPaymentService()
```

### Step 2: Update Ticket Creation Endpoint

**File**: `apps/backend-fastapi/routers/tickets.py`

Add after ticket creation:

```python
@router.post("/create")
async def create_ticket_after_payment(
    ticket_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """Create ticket after successful payment"""
    try:
        # 1. Verify payment was successful
        payment_ref = ticket_data.get('payment_reference')
        if not payment_ref:
            raise HTTPException(400, "Payment reference required")
        
        # 2. Create ticket
        ticket = await ticket_service.create_ticket({
            'event_id': ticket_data['event_id'],
            'user_id': current_user['user_id'],
            'tier_name': ticket_data['tier_name'],
            'price': ticket_data['price'],
            'payment_reference': payment_ref,
            'status': 'active'
        })
        
        if not ticket:
            raise HTTPException(500, "Failed to create ticket")
        
        # 3. ⭐ CREDIT ORGANIZER (NEW)
        from services.organizer_payment_service import organizer_payment_service
        
        credit_result = await organizer_payment_service.credit_organizer_for_ticket_sale(
            event_id=ticket_data['event_id'],
            ticket_price=ticket_data['price'],
            payment_reference=payment_ref,
            attendee_id=current_user['user_id']
        )
        
        if not credit_result['success']:
            # Log error but don't fail ticket creation
            logger.error(f"Failed to credit organizer: {credit_result.get('error')}")
        
        return {
            "success": True,
            "ticket": ticket,
            "organizer_credited": credit_result['success'],
            "organizer_amount": credit_result.get('amount_credited', 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error creating ticket: {str(e)}")
```

### Step 3: Update Payment Verification

**File**: `apps/backend-fastapi/routers/payments.py`

Ensure payment record includes event_id for later organizer credit:

```python
@router.post("/verify")
async def verify_payment(
    request: PaymentVerificationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Verify payment and prepare for organizer credit"""
    # ... existing verification code ...
    
    # Store payment with event_id for organizer credit
    payment_record = {
        'user_id': current_user['user_id'],
        'transaction_id': request.transaction_id,
        'tx_ref': request.tx_ref,
        'amount': verified_amount,
        'status': 'successful',
        'event_id': request.event_id,  # ⭐ ADD THIS
        'metadata': request.metadata
    }
    
    # Save to database
    # ... rest of code ...
```

---

## Database Schema Updates

### Add Missing Columns

```sql
-- Add event_id to payments table if not exists
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_payments_event 
ON payments(event_id);

-- Add transactions table if not exists
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'credit', 'debit'
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    reference VARCHAR(255) UNIQUE,
    status VARCHAR(20) DEFAULT 'completed',
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user 
ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_reference 
ON transactions(reference);
```

---

## Money Flow Diagram

### Card Payment Flow:
```
Attendee pays ₦25,000 via Flutterwave
    ↓
Flutterwave collects ₦25,000
    ↓
Platform receives ₦25,000 (in Flutterwave account)
    ↓
Organizer wallet credited: ₦23,750 (95%)
Platform keeps: ₦1,250 (5% fee)
    ↓
Organizer can withdraw ₦23,750 to bank account
```

### Wallet Payment Flow:
```
Attendee pays ₦25,000 from wallet
    ↓
Attendee wallet: -₦25,000
    ↓
Organizer wallet: +₦23,750 (95%)
Platform revenue: +₦1,250 (5% fee)
    ↓
Organizer can withdraw ₦23,750 to bank account
```

---

## Platform Fee Configuration

### Configurable Fee Structure

**File**: `apps/backend-fastapi/config.py`

```python
# Platform fees
PLATFORM_FEE_PERCENTAGE = float(os.getenv('PLATFORM_FEE_PERCENTAGE', '5.0'))
PLATFORM_FEE_MINIMUM = float(os.getenv('PLATFORM_FEE_MINIMUM', '50.0'))  # ₦50 minimum
PLATFORM_FEE_MAXIMUM = float(os.getenv('PLATFORM_FEE_MAXIMUM', '5000.0'))  # ₦5000 maximum

# Organizer payout settings
MINIMUM_PAYOUT_AMOUNT = float(os.getenv('MINIMUM_PAYOUT_AMOUNT', '1000.0'))  # ₦1000 minimum withdrawal
PAYOUT_PROCESSING_TIME_DAYS = int(os.getenv('PAYOUT_PROCESSING_TIME_DAYS', '3'))  # 3 days processing
```

---

## Testing Checklist

### Manual Testing:
- [ ] Attendee buys ticket with card
- [ ] Check organizer wallet balance increased
- [ ] Verify platform fee deducted correctly
- [ ] Check transaction record created
- [ ] Verify organizer notification sent
- [ ] Attendee buys ticket with wallet
- [ ] Check both wallets updated correctly
- [ ] Test with multiple ticket purchases
- [ ] Test with different ticket prices
- [ ] Verify withdrawal works for organizer

### Edge Cases:
- [ ] What if organizer wallet doesn't exist?
- [ ] What if credit fails after ticket created?
- [ ] What if payment verified but ticket creation fails?
- [ ] What if same payment reference used twice?
- [ ] What if event has no organizer?

---

## Rollout Plan

### Phase 1: Implement Core Logic
1. Create `organizer_payment_service.py`
2. Add database migrations
3. Update ticket creation endpoint
4. Add comprehensive logging

### Phase 2: Testing
1. Test in development environment
2. Test all payment methods
3. Test edge cases
4. Verify database consistency

### Phase 3: Backfill Historical Data (if needed)
```sql
-- Credit organizers for past ticket sales
-- Run this ONCE after deployment
INSERT INTO transactions (user_id, type, amount, description, reference, status)
SELECT 
    e.organizer_id as user_id,
    'credit' as type,
    (t.price * 0.95) as amount,
    CONCAT('Backfill: Ticket sale for ', e.title) as description,
    CONCAT('BACKFILL_', t.id) as reference,
    'completed' as status
FROM tickets t
JOIN events e ON t.event_id = e.id
WHERE t.created_at < NOW()
AND NOT EXISTS (
    SELECT 1 FROM transactions tr 
    WHERE tr.reference = CONCAT('TICKET_SALE_', t.payment_reference)
);
```

### Phase 4: Deploy to Production
1. Deploy code changes
2. Run database migrations
3. Monitor for errors
4. Verify organizer balances updating

---

## Monitoring & Alerts

### Key Metrics to Track:
- Total tickets sold per day
- Total organizer credits per day
- Platform fees collected
- Failed credit attempts
- Average ticket price
- Organizer payout requests

### Alerts to Set Up:
- ⚠️ Organizer credit fails
- ⚠️ Platform fee calculation error
- ⚠️ Wallet balance goes negative
- ⚠️ Transaction record creation fails

---

## Security Considerations

### Prevent Double-Crediting:
```python
# Check if already credited
existing_transaction = supabase.table('transactions')\
    .select('id')\
    .eq('reference', f'TICKET_SALE_{payment_reference}')\
    .execute()

if existing_transaction.data:
    return {"success": False, "error": "Already credited"}
```

### Audit Trail:
- Log every credit attempt
- Store metadata with each transaction
- Track who initiated the credit
- Record timestamps for all operations

---

## Future Enhancements

1. **Instant Payouts**: Allow organizers to withdraw immediately
2. **Bulk Payouts**: Process multiple organizer payouts at once
3. **Revenue Sharing**: Split revenue between multiple organizers
4. **Dynamic Fees**: Adjust platform fee based on ticket price/volume
5. **Escrow System**: Hold funds until event completion
6. **Refund Handling**: Automatically debit organizer on refunds

---

## Conclusion

This is a **CRITICAL** fix that must be implemented immediately. Without it:
- ❌ Organizers never get paid
- ❌ Money disappears
- ❌ Platform cannot track revenue
- ❌ No audit trail
- ❌ Business model broken

**Priority**: 🔴 URGENT - BLOCKING PRODUCTION LAUNCH
