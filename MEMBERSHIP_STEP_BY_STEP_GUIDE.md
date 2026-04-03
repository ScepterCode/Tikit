# Membership System - Step-by-Step Implementation Guide

## ✅ Prerequisites Complete
- Database migration run successfully
- 1 membership created (Regular tier)
- 32 features defined

## 🎯 Implementation Strategy

Given the scope (15+ files), I recommend implementing in phases:

### Phase 1: Core Backend (30 min)
Essential backend services for membership to work

### Phase 2: Basic Frontend (30 min)  
Minimal UI to test the flow

### Phase 3: Full UI (30 min)
Complete upgrade modal and tier badges

### Phase 4: Admin Dashboard (20 min)
Revenue tracking and stats

### Phase 5: Testing & Polish (20 min)
End-to-end testing and fixes

---

## 📝 PHASE 1: Core Backend

### File 1: Update `membership_service.py`
**Location**: `apps/backend-fastapi/services/membership_service.py`

**What to add**:
```python
# Add these methods to existing MembershipService class:

async def start_trial(self, user_id: str, tier: str) -> dict:
    """Start 7-day free trial"""
    # Check if user already had trial
    # Create membership with trial
    # Set expires_at to 7 days from now
    # Return membership data

async def process_payment(self, user_id: str, tier: str, payment_ref: str) -> dict:
    """Process membership payment after trial"""
    # Verify payment with Flutterwave
    # Update membership status
    # Record payment
    # Send confirmation email
    # Return success

async def check_feature_access(self, user_id: str, feature_key: str) -> bool:
    """Check if user can access feature"""
    # Get user's membership tier
    # Query membership_features table
    # Return true/false

async def get_membership_stats(self) -> dict:
    """Get admin stats"""
    # Total revenue
    # MRR
    # Tier distribution
    # Recent upgrades
    # Return stats dict
```

### File 2: Update `membership.py` router
**Location**: `apps/backend-fastapi/routers/membership.py`

**Add these endpoints**:
```python
@router.post("/start-trial")
async def start_trial(tier: str, current_user: dict = Depends(get_current_user)):
    """Start 7-day free trial"""
    # Call membership_service.start_trial()
    # Return success response

@router.post("/process-payment")
async def process_payment(
    tier: str,
    payment_reference: str,
    current_user: dict = Depends(get_current_user)
):
    """Process payment after trial"""
    # Call membership_service.process_payment()
    # Return success response

@router.get("/check-feature/{feature_key}")
async def check_feature(
    feature_key: str,
    current_user: dict = Depends(get_current_user)
):
    """Check feature access"""
    # Call membership_service.check_feature_access()
    # Return has_access boolean

@router.get("/admin/stats")
async def get_stats(current_user: dict = Depends(require_admin)):
    """Get membership stats (admin only)"""
    # Call membership_service.get_membership_stats()
    # Return stats
```

---

## 📝 PHASE 2: Basic Frontend

### File 3: Create `TierBadge.tsx`
**Location**: `apps/frontend/src/components/membership/TierBadge.tsx`

**Simple tier badge component**:
```typescript
interface TierBadgeProps {
  tier: 'regular' | 'special' | 'legend';
  size?: 'sm' | 'md' | 'lg';
}

export function TierBadge({ tier, size = 'md' }: TierBadgeProps) {
  const colors = {
    regular: 'bg-gray-100 text-gray-700',
    special: 'bg-purple-100 text-purple-700',
    legend: 'bg-yellow-100 text-yellow-700'
  };
  
  const icons = {
    regular: '👤',
    special: '⭐',
    legend: '👑'
  };
  
  return (
    <span className={`${colors[tier]} px-2 py-1 rounded-full text-xs font-semibold`}>
      {icons[tier]} {tier.toUpperCase()}
    </span>
  );
}
```

### File 4: Update `useMembership.ts` hook
**Location**: `apps/frontend/src/hooks/useMembership.ts`

**Add trial methods**:
```typescript
// Add to existing hook:

const startTrial = async (tier: 'special' | 'legend') => {
  try {
    const response = await api.request('/memberships/start-trial', {
      method: 'POST',
      body: { tier }
    });
    
    if (response.success) {
      await fetchMembership(); // Refresh
      return { success: true };
    }
  } catch (error) {
    return { success: false, error };
  }
};

const processPayment = async (tier: string, paymentRef: string) => {
  try {
    const response = await api.request('/memberships/process-payment', {
      method: 'POST',
      body: { tier, payment_reference: paymentRef }
    });
    
    if (response.success) {
      await fetchMembership();
      return { success: true };
    }
  } catch (error) {
    return { success: false, error };
  }
};

// Return these in hook:
return {
  ...existing,
  startTrial,
  processPayment
};
```

---

## 📝 PHASE 3: Full UI

### File 5: Create `MembershipUpgradeModal.tsx`
**Location**: `apps/frontend/src/components/membership/MembershipUpgradeModal.tsx`

**Full upgrade modal with**:
- Tier comparison table
- Feature lists
- Pricing display
- "Start 7-Day Free Trial" buttons
- Payment integration

### File 6: Update `DashboardSidebar.tsx`
**Location**: `apps/frontend/src/components/layout/DashboardSidebar.tsx`

**Add**:
- Tier badge next to user name
- "Upgrade" button for Regular users
- Trial countdown for trial users

### File 7: Create `MembershipSettings.tsx`
**Location**: `apps/frontend/src/pages/organizer/MembershipSettings.tsx`

**Settings page with**:
- Current tier display
- Trial status
- Payment history
- Upgrade/downgrade options
- Cancel membership

---

## 📝 PHASE 4: Admin Dashboard

### File 8: Update `admin_dashboard_service.py`
**Location**: `apps/backend-fastapi/services/admin_dashboard_service.py`

**Add membership stats method**:
```python
async def get_membership_stats(self):
    # Query memberships table
    # Calculate MRR
    # Get tier distribution
    # Get recent upgrades
    # Return comprehensive stats
```

### File 9: Create admin membership widget
**Location**: `apps/frontend/src/components/admin/MembershipStatsWidget.tsx`

**Display**:
- Total revenue card
- MRR card
- Tier distribution pie chart
- Recent upgrades list

---

## 📝 PHASE 5: Feature Gating

### File 10: Update `SecretEvents.tsx` (organizer)
**Location**: `apps/frontend/src/pages/organizer/SecretEvents.tsx`

**Already done!** - Shows upgrade prompt for Regular users

### File 11: Create feature gate utility
**Location**: `apps/frontend/src/utils/featureGate.ts`

**Helper functions**:
```typescript
export function canAccessFeature(tier: string, feature: string): boolean {
  const features = {
    regular: ['create_public_events', 'basic_analytics'],
    special: ['secret_events', 'priority_listing', 'custom_branding'],
    legend: ['ai_assistant', 'marketing_automation', 'api_access']
  };
  
  return features[tier]?.includes(feature) || false;
}
```

---

## 🚀 Quick Start Commands

### 1. Backend
```bash
cd apps/backend-fastapi
# Files are already in place, just restart:
python main.py
```

### 2. Frontend
```bash
cd apps/frontend
npm run dev
```

### 3. Test Flow
1. Login as organizer
2. Go to Secret Events page
3. Click "Upgrade to Premium"
4. Select Special tier
5. Click "Start 7-Day Free Trial"
6. Verify access to Secret Events

---

## 📊 What to Expect

After implementation:
- ✅ Users can start 7-day trials
- ✅ Secret Events gated for Special+
- ✅ Tier badges show in UI
- ✅ Admin can see revenue stats
- ✅ Payment flow works end-to-end

---

## 🎯 Next Actions

**Option A**: I create all files now (will take multiple messages due to size)

**Option B**: I create a Python script that generates all files automatically

**Option C**: I create the most critical 3-4 files now, you test, then we iterate

Which approach would you prefer?
