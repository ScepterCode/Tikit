# Improved Payment Flow - Wallet Balance Check

## Overview
Enhanced the ticket purchase workflow to show users their wallet balance upfront and provide intelligent payment options based on their available funds.

---

## Problem Statement

### Before (Old Flow):
```
User clicks "Buy Ticket" 
    ↓
Payment Modal Opens
    ↓
User sees payment method selector (Card/Wallet)
    ↓
User selects Wallet
    ↓
❌ Error: "Insufficient wallet balance"
```

**Issues:**
- User doesn't know their balance until they try to pay
- Poor UX - discovers insufficient funds after clicking through
- No guidance on what to do next
- Extra steps to check balance

---

## Solution (New Flow):

### Flow Diagram:
```
User clicks "Buy Ticket"
    ↓
Fetch Wallet Balance
    ↓
┌─────────────────────────────────────────┐
│                                         │
│  SUFFICIENT FUNDS (Balance ≥ Price)     │
│  ↓                                      │
│  Show Payment Choice Modal              │
│  - Option 1: Use Wallet (recommended)   │
│  - Option 2: Pay with Card              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  INSUFFICIENT FUNDS (0 < Balance < Price)│
│  ↓                                      │
│  Show Warning Modal                     │
│  - Display shortfall amount             │
│  - Option 1: Pay with Card (primary)    │
│  - Option 2: Top Up Wallet              │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│  ZERO BALANCE (Balance = 0)             │
│  ↓                                      │
│  Show Info Modal                        │
│  - Option 1: Pay with Card (primary)    │
│  - Option 2: Top Up Wallet              │
│                                         │
└─────────────────────────────────────────┘
```

---

## New Component: PaymentChoiceModal

### Location
`apps/frontend/src/components/payment/PaymentChoiceModal.tsx`

### Features

#### 1. **Automatic Balance Check**
- Fetches wallet balance when modal opens
- Shows loading state while fetching
- Handles errors gracefully

#### 2. **Three Scenarios Handled**

##### Scenario A: Sufficient Funds
```
┌─────────────────────────────────────┐
│  Choose Payment Method              │
├─────────────────────────────────────┤
│  💰 Wallet Balance: ₦50,000         │
│  🎫 Ticket Price: ₦25,000           │
│                                     │
│  ✅ You have sufficient funds       │
│                                     │
│  [💳 Use Wallet Balance]            │
│  Pay ₦25,000 from wallet            │
│  New balance: ₦25,000               │
│                                     │
│  [💳 Pay with Card]                 │
│  Use Flutterwave payment            │
└─────────────────────────────────────┘
```

##### Scenario B: Insufficient Funds
```
┌─────────────────────────────────────┐
│  ⚠️ Insufficient Wallet Balance     │
├─────────────────────────────────────┤
│  💰 Your Balance: ₦15,000           │
│  🎫 Ticket Price: ₦25,000           │
│  ❌ Short by: ₦10,000               │
│                                     │
│  [💳 Pay with Card]                 │
│  Complete purchase now              │
│                                     │
│  [💰 Top Up Wallet]                 │
│  Add funds then purchase            │
└─────────────────────────────────────┘
```

##### Scenario C: Zero Balance
```
┌─────────────────────────────────────┐
│  💡 Your wallet is empty            │
├─────────────────────────────────────┤
│  💰 Wallet Balance: ₦0              │
│  🎫 Ticket Price: ₦25,000           │
│                                     │
│  [💳 Pay with Card]                 │
│  Complete purchase now              │
│                                     │
│  [💰 Top Up Wallet]                 │
│  Add funds to your wallet           │
└─────────────────────────────────────┘
```

#### 3. **Smart Recommendations**
- Sufficient funds: Wallet payment highlighted (green)
- Insufficient funds: Card payment highlighted (blue)
- Zero balance: Card payment as primary option

#### 4. **Visual Feedback**
- Color-coded messages (green = success, yellow = warning, blue = info)
- Clear balance display
- Shortfall calculation shown
- New balance preview for wallet payments

---

## Updated Components

### 1. PurchaseButton.tsx

**Changes:**
- Added `PaymentChoiceModal` import
- Added state for payment choice modal
- Added state for preselected payment method
- Modified click handler to show choice modal first
- Added handlers for wallet/card selection
- Passes preselected method to SecurePaymentModal

**New Flow:**
```typescript
handlePurchaseClick()
    ↓
Check authentication
    ↓
Open PaymentChoiceModal
    ↓
User selects payment method
    ↓
Close PaymentChoiceModal
    ↓
Open SecurePaymentModal with preselected method
```

### 2. SecurePaymentModal.tsx

**Changes:**
- Added `preselectedMethod` prop (optional)
- Defaults to 'card' if not provided
- Updates payment method when preselected method changes
- Maintains backward compatibility

### 3. PaymentChoiceModal.tsx (NEW)

**Props:**
```typescript
interface PaymentChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUseWallet: () => void;
  onUseCard: () => void;
  totalAmount: number;
  eventTitle: string;
  ticketDetails: {
    quantity: number;
    tierName: string;
    unitPrice: number;
  };
}
```

**Key Methods:**
- `fetchWalletBalance()` - Gets current wallet balance
- `onUseWallet()` - Callback when user chooses wallet
- `onUseCard()` - Callback when user chooses card
- `navigate('/attendee/wallet')` - Redirects to wallet for top-up

---

## User Experience Improvements

### Before vs After

| Aspect | Before | After |
|--------|--------|-------|
| **Balance Visibility** | Hidden until payment attempt | Shown upfront |
| **Decision Making** | Blind choice | Informed choice |
| **Error Discovery** | After selection | Before selection |
| **Guidance** | None | Clear recommendations |
| **Steps to Purchase** | 3-4 clicks | 2-3 clicks |
| **Frustration Level** | High (trial & error) | Low (clear path) |

### Benefits

✅ **Transparency**: Users see their balance immediately
✅ **Efficiency**: No wasted clicks on insufficient funds
✅ **Guidance**: Clear recommendations based on balance
✅ **Flexibility**: Easy choice between wallet and card
✅ **Helpful**: Suggests top-up with direct link
✅ **Professional**: Polished, modern UI

---

## Technical Implementation

### API Calls

#### 1. Fetch Wallet Balance
```typescript
GET /api/wallet/balance
Headers: {
  Authorization: "Bearer {access_token}"
}

Response: {
  success: true,
  balance: 50000
}
```

#### 2. Wallet Payment (if selected)
```typescript
POST /api/payments/wallet
Body: {
  amount: 2500000, // in kobo
  reference: "TKT_...",
  event_id: "event-123",
  ticket_details: {...}
}
```

#### 3. Card Payment (if selected)
```typescript
// Opens Flutterwave modal
window.FlutterwaveCheckout({...})
```

### State Management

```typescript
// PurchaseButton.tsx
const [showPaymentChoice, setShowPaymentChoice] = useState(false);
const [showPaymentModal, setShowPaymentModal] = useState(false);
const [paymentMethod, setPaymentMethod] = useState<'card' | 'wallet'>('card');

// PaymentChoiceModal.tsx
const [walletBalance, setWalletBalance] = useState<number | null>(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

---

## Edge Cases Handled

### 1. **Balance Fetch Fails**
- Shows error message
- Still allows card payment
- Doesn't block user

### 2. **Zero Balance**
- Skips wallet option
- Shows card payment prominently
- Offers top-up option

### 3. **Exact Balance Match**
- Shows wallet as primary option
- Calculates new balance as ₦0
- Still offers card as alternative

### 4. **User Cancels**
- Can close modal at any time
- Returns to event detail page
- No charges made

### 5. **Network Issues**
- Loading state shown
- Error handling with retry
- Fallback to card payment

---

## Styling & UX Details

### Color Scheme
- **Green** (#10b981): Wallet payments, success states
- **Blue** (#667eea): Card payments, info states
- **Yellow** (#fbbf24): Warnings, insufficient funds
- **Red** (#dc2626): Errors, shortfall amounts

### Animations
- Smooth modal transitions
- Hover effects on buttons
- Loading spinner for balance fetch
- Button transform on hover (translateY)

### Accessibility
- Clear button labels
- Color + text for status (not color alone)
- Keyboard navigation support
- Screen reader friendly

---

## Testing Checklist

- [ ] Test with sufficient wallet balance
- [ ] Test with insufficient wallet balance
- [ ] Test with zero wallet balance
- [ ] Test wallet payment success
- [ ] Test card payment success
- [ ] Test balance fetch error
- [ ] Test modal close/cancel
- [ ] Test top-up wallet navigation
- [ ] Test on mobile devices
- [ ] Test with slow network

---

## Future Enhancements

### Potential Additions:
1. **Partial Wallet Payment**: Use wallet + card for shortfall
2. **Save Payment Preference**: Remember user's preferred method
3. **Quick Top-Up**: Add funds without leaving modal
4. **Payment History**: Show recent transactions
5. **Loyalty Points**: Display points earned for wallet payments
6. **Split Payment**: Share cost with friends

---

## Files Modified

### New Files:
- `apps/frontend/src/components/payment/PaymentChoiceModal.tsx`

### Modified Files:
- `apps/frontend/src/components/tickets/PurchaseButton.tsx`
- `apps/frontend/src/components/payment/SecurePaymentModal.tsx`

### Lines Changed:
- PaymentChoiceModal: +600 lines (new)
- PurchaseButton: +15 lines
- SecurePaymentModal: +10 lines

---

## Backward Compatibility

✅ **Fully Compatible**: Existing payment flows still work
✅ **Optional Props**: New props have defaults
✅ **No Breaking Changes**: All existing functionality preserved

---

## Performance Impact

- **Additional API Call**: 1 extra call to fetch balance (~100ms)
- **Modal Rendering**: Minimal impact, lazy loaded
- **User Perception**: Faster (fewer failed attempts)
- **Overall**: Net positive on UX

---

## Conclusion

This enhancement significantly improves the ticket purchase experience by providing users with upfront information about their payment options. The intelligent routing based on wallet balance reduces friction, prevents errors, and guides users to the best payment method for their situation.

**Result**: Happier users, fewer support tickets, higher conversion rates! 🎉
