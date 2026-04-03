"""
Premium Membership Service
Handles subscription tiers, upgrades, and premium feature access
"""
import time
import uuid
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum

class MembershipTier(str, Enum):
    REGULAR = "regular"
    SPECIAL = "special"
    LEGEND = "legend"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    TRIAL = "trial"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"

# In-memory membership database
memberships_database: Dict[str, Dict[str, Any]] = {}

# Track users who have used trials
trial_history: Dict[str, List[str]] = {}  # user_id -> [tier1, tier2]

# Premium features by tier
TIER_FEATURES = {
    MembershipTier.REGULAR: [
        "create_public_events",
        "basic_analytics",
        "standard_support",
        "attendee_features"
    ],
    MembershipTier.SPECIAL: [
        "create_public_events",
        "basic_analytics",
        "standard_support",
        "attendee_features",
        "secret_events",
        "priority_listing",
        "custom_branding",
        "advanced_analytics",
        "email_marketing_500",
        "remove_branding"
    ],
    MembershipTier.LEGEND: [
        "create_public_events",
        "basic_analytics",
        "standard_support",
        "attendee_features",
        "secret_events",
        "priority_listing",
        "custom_branding",
        "advanced_analytics",
        "email_marketing_500",
        "remove_branding",
        "ai_assistant",
        "marketing_automation",
        "sms_marketing",
        "unlimited_email",
        "ai_analytics",
        "priority_support_24_7",
        "white_label",
        "api_access",
        "custom_domain"
    ]
}

# Pricing (in USD)
TIER_PRICING = {
    MembershipTier.SPECIAL: {
        "monthly": 10
    },
    MembershipTier.LEGEND: {
        "monthly": 30
    }
}

class MembershipService:
    def __init__(self):
        pass
    
    def get_user_membership(self, user_id: str) -> Dict[str, Any]:
        """Get user's current membership status"""
        membership = memberships_database.get(user_id)
        
        if not membership:
            # Create default free membership
            membership = self._create_free_membership(user_id)
        
        # Check if membership is expired
        if membership["status"] == MembershipStatus.ACTIVE:
            if membership["expires_at"] and time.time() > membership["expires_at"]:
                membership["status"] = MembershipStatus.EXPIRED
                membership["tier"] = MembershipTier.FREE
                memberships_database[user_id] = membership
        
        return membership
    
    def _create_free_membership(self, user_id: str) -> Dict[str, Any]:
        """Create default regular membership for new users"""
        membership = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "tier": MembershipTier.REGULAR,
            "status": MembershipStatus.ACTIVE,
            "features": TIER_FEATURES[MembershipTier.REGULAR],
            "expires_at": None,  # Regular never expires
            "trial_used": False,
            "created_at": time.time(),
            "updated_at": time.time(),
            "payment_history": []
        }
        
        memberships_database[user_id] = membership
        return membership
    
    def start_trial(self, user_id: str, tier: str) -> Dict[str, Any]:
        """Start 7-day free trial for Special or Legend tier"""
        try:
            # Validate tier
            if tier not in ["special", "legend"]:
                return {
                    "success": False,
                    "error": "Invalid tier. Must be 'special' or 'legend'"
                }
            
            # Get current membership
            membership = self.get_user_membership(user_id)
            
            # Check if user already used trial for this tier
            user_trials = trial_history.get(user_id, [])
            if tier in user_trials:
                return {
                    "success": False,
                    "error": f"You have already used your free trial for {tier.title()} tier"
                }
            
            # Check if user is already on this tier or higher
            tier_order = {"regular": 0, "special": 1, "legend": 2}
            current_tier_level = tier_order.get(membership["tier"], 0)
            new_tier_level = tier_order.get(tier, 0)
            
            if current_tier_level >= new_tier_level:
                return {
                    "success": False,
                    "error": "You are already on this tier or higher"
                }
            
            # Calculate trial expiration (7 days from now)
            trial_expires_at = time.time() + (7 * 24 * 60 * 60)
            
            # Update membership
            membership.update({
                "tier": tier,
                "status": MembershipStatus.TRIAL,
                "features": TIER_FEATURES[MembershipTier.SPECIAL if tier == "special" else MembershipTier.LEGEND],
                "expires_at": trial_expires_at,
                "trial_used": True,
                "updated_at": time.time()
            })
            
            # Track trial usage
            if user_id not in trial_history:
                trial_history[user_id] = []
            trial_history[user_id].append(tier)
            
            memberships_database[user_id] = membership
            
            return {
                "success": True,
                "message": f"7-day free trial started for {tier.title()} tier",
                "membership": membership,
                "trial_ends_at": trial_expires_at
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to start trial: {str(e)}"
            }
    
    def process_payment(self, user_id: str, tier: str, payment_reference: str) -> Dict[str, Any]:
        """Process membership payment and activate subscription"""
        try:
            # Validate tier
            if tier not in ["special", "legend"]:
                return {
                    "success": False,
                    "error": "Invalid tier"
                }
            
            # Get current membership
            membership = self.get_user_membership(user_id)
            
            # Calculate new expiration (30 days from now or from current expiration)
            current_time = time.time()
            if membership.get("expires_at") and membership["expires_at"] > current_time:
                # Extend from current expiration
                new_expires_at = membership["expires_at"] + (30 * 24 * 60 * 60)
            else:
                # Start from now
                new_expires_at = current_time + (30 * 24 * 60 * 60)
            
            # Update membership
            membership.update({
                "tier": tier,
                "status": MembershipStatus.ACTIVE,
                "features": TIER_FEATURES[MembershipTier.SPECIAL if tier == "special" else MembershipTier.LEGEND],
                "expires_at": new_expires_at,
                "updated_at": current_time
            })
            
            # Add payment record
            payment_record = {
                "id": str(uuid.uuid4()),
                "amount": TIER_PRICING[MembershipTier.SPECIAL if tier == "special" else MembershipTier.LEGEND]["monthly"],
                "tier": tier,
                "duration": "monthly",
                "payment_reference": payment_reference,
                "created_at": current_time
            }
            membership["payment_history"].append(payment_record)
            
            memberships_database[user_id] = membership
            
            return {
                "success": True,
                "message": f"Payment processed successfully. {tier.title()} membership activated",
                "membership": membership
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Payment processing failed: {str(e)}"
            }
    
    def upgrade_membership(
        self, 
        user_id: str, 
        tier: MembershipTier, 
        duration: str = "monthly",
        payment_reference: str = None
    ) -> Dict[str, Any]:
        """Upgrade user to premium tier"""
        try:
            if tier == MembershipTier.REGULAR:
                return {
                    "success": False,
                    "error": "Cannot upgrade to regular tier"
                }
            
            # Calculate expiration (monthly only for now)
            expires_at = time.time() + (30 * 24 * 60 * 60)  # 30 days
            
            # Get or create membership
            membership = self.get_user_membership(user_id)
            
            # Update membership
            membership.update({
                "tier": tier,
                "status": MembershipStatus.ACTIVE,
                "features": TIER_FEATURES[tier],
                "expires_at": expires_at,
                "updated_at": time.time()
            })
            
            # Add payment record
            payment_record = {
                "id": str(uuid.uuid4()),
                "amount": TIER_PRICING[tier]["monthly"],
                "tier": tier,
                "duration": duration,
                "payment_reference": payment_reference,
                "created_at": time.time()
            }
            membership["payment_history"].append(payment_record)
            
            memberships_database[user_id] = membership
            
            return {
                "success": True,
                "message": f"Successfully upgraded to {tier.value}",
                "membership": membership
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Upgrade failed: {str(e)}"
            }
    
    def check_feature_access(self, user_id: str, feature: str) -> bool:
        """Check if user has access to a specific feature"""
        membership = self.get_user_membership(user_id)
        return feature in membership.get("features", [])
    
    def get_tier_pricing(self) -> Dict[str, Any]:
        """Get pricing information for all tiers"""
        return TIER_PRICING
    
    def get_tier_features(self, tier: MembershipTier) -> List[str]:
        """Get features for a specific tier"""
        return TIER_FEATURES.get(tier, [])
    
    def cancel_membership(self, user_id: str) -> Dict[str, Any]:
        """Cancel premium membership (downgrade to regular)"""
        try:
            membership = self.get_user_membership(user_id)
            
            if membership["tier"] == MembershipTier.REGULAR:
                return {
                    "success": False,
                    "error": "User is already on regular tier"
                }
            
            # Downgrade to regular
            membership.update({
                "tier": MembershipTier.REGULAR,
                "status": MembershipStatus.CANCELLED,
                "features": TIER_FEATURES[MembershipTier.REGULAR],
                "expires_at": None,
                "updated_at": time.time()
            })
            
            memberships_database[user_id] = membership
            
            return {
                "success": True,
                "message": "Membership cancelled successfully",
                "membership": membership
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Cancellation failed: {str(e)}"
            }
    
    def get_membership_stats(self) -> Dict[str, Any]:
        """Get membership statistics (admin only)"""
        stats = {
            "total_users": len(memberships_database),
            "regular_users": 0,
            "special_users": 0,
            "legend_users": 0,
            "active_subscriptions": 0,
            "trial_subscriptions": 0,
            "expired_subscriptions": 0,
            "total_revenue": 0,
            "mrr": 0,  # Monthly Recurring Revenue
            "recent_upgrades": []
        }
        
        active_monthly_revenue = 0
        recent_payments = []
        
        for membership in memberships_database.values():
            tier = membership["tier"]
            status = membership["status"]
            
            if tier == MembershipTier.REGULAR:
                stats["regular_users"] += 1
            elif tier == MembershipTier.SPECIAL:
                stats["special_users"] += 1
            elif tier == MembershipTier.LEGEND:
                stats["legend_users"] += 1
            
            if status == MembershipStatus.ACTIVE and tier != MembershipTier.REGULAR:
                stats["active_subscriptions"] += 1
                # Add to MRR
                if tier == MembershipTier.SPECIAL:
                    active_monthly_revenue += 10
                elif tier == MembershipTier.LEGEND:
                    active_monthly_revenue += 30
            elif status == MembershipStatus.TRIAL:
                stats["trial_subscriptions"] += 1
            elif status == MembershipStatus.EXPIRED:
                stats["expired_subscriptions"] += 1
            
            # Calculate total revenue
            for payment in membership.get("payment_history", []):
                stats["total_revenue"] += payment["amount"]
                recent_payments.append({
                    "user_id": membership["user_id"],
                    "tier": payment["tier"],
                    "amount": payment["amount"],
                    "created_at": payment["created_at"]
                })
        
        stats["mrr"] = active_monthly_revenue
        
        # Get 10 most recent upgrades
        recent_payments.sort(key=lambda x: x["created_at"], reverse=True)
        stats["recent_upgrades"] = recent_payments[:10]
        
        return stats

# Global service instance
membership_service = MembershipService()