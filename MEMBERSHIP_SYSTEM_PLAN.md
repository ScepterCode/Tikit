# Membership System Implementation Plan

## Membership Tiers

### 1. Regular (Free - Default)
**Price**: $0
**Features**:
- Create public events
- Basic analytics
- Standard support
- Attendee features (browse, purchase tickets)

### 2. Special ($10/month)
**Price**: $10/month
**Features**:
- All Regular features
- Create Secret Events with progressive location reveals
- Priority event listing (events appear higher in search)
- Custom event branding (logo, colors)
- Advanced analytics dashboard
- Email marketing to attendees (up to 500 emails/month)
- Remove "Powered by Tikit" branding

### 3. Legend ($30/month)
**Price**: $30/month
**Features**:
- All Special features
- AI Event Assistant Bot (event recommendations, automated responses)
- Marketing automation tools
- SMS marketing to attendees
- Unlimited email marketing
- Advanced AI-powered analytics & insights
- Priority support (24/7)
- White-label options
- API access for integrations
- Custom domain for event pages

## Implementation Components

### Phase 1: Database & Backend
1. Create membership tables in Supabase
2. Update membership service with new tiers
3. Add payment processing for upgrades
4. Create admin tracking for membership revenue

### Phase 2: Payment Flow
1. Create upgrade modal with tier comparison
2. Integrate Flutterwave payment
3. Handle payment success/failure
4. Send confirmation emails

### Phase 3: Feature Gating
1. Gate Secret Events (Special+)
2. Gate AI Bot (Legend only)
3. Gate Marketing Tools (Special+)
4. Add tier badges throughout UI

### Phase 4: Admin Dashboard
1. Add membership revenue tracking
2. Show upgrade notifications
3. Display tier distribution charts
4. Track monthly recurring revenue (MRR)

## Database Schema

```sql
-- Memberships table
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL CHECK (tier IN ('regular', 'special', 'legend')),
  status TEXT NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Membership payments table
CREATE TABLE membership_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  tier TEXT NOT NULL,
  payment_reference TEXT UNIQUE NOT NULL,
  payment_method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_tier ON memberships(tier);
CREATE INDEX idx_membership_payments_user_id ON membership_payments(user_id);
CREATE INDEX idx_membership_payments_status ON membership_payments(status);
```

## API Endpoints

### Membership Management
- `GET /api/memberships/status` - Get current membership
- `GET /api/memberships/pricing` - Get tier pricing
- `POST /api/memberships/upgrade` - Initiate upgrade
- `POST /api/memberships/cancel` - Cancel membership
- `GET /api/memberships/features` - Get available features

### Admin
- `GET /api/admin/memberships/stats` - Get membership statistics
- `GET /api/admin/memberships/revenue` - Get revenue data
- `GET /api/admin/memberships/recent` - Get recent upgrades

## Feature Gates

### Secret Events (Special+)
- Check tier before allowing creation
- Show upgrade prompt for Regular users

### AI Bot (Legend only)
- Only available in Legend tier
- Show in sidebar with lock icon for lower tiers

### Marketing Tools (Special+)
- Email campaigns
- SMS campaigns (Legend only)
- Analytics dashboard

## UI Components

1. **MembershipUpgradeModal** - Main upgrade flow
2. **TierComparisonCard** - Compare features
3. **MembershipBadge** - Show tier in UI
4. **FeatureLockedCard** - Prompt to upgrade
5. **AdminMembershipStats** - Admin dashboard widget

## Payment Flow

1. User clicks "Upgrade" button
2. Modal shows tier comparison
3. User selects tier
4. Payment modal opens (Flutterwave)
5. Payment processed
6. Membership activated
7. Confirmation email sent
8. Admin notified
9. User redirected to success page

## Next Steps

1. Run database migration
2. Update backend services
3. Create frontend components
4. Test payment flow
5. Deploy to production
