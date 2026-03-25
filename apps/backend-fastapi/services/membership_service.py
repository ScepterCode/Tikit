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
    FREE = "free"
    PREMIUM = "premium"
    VIP = "vip"

class MembershipStatus(str, Enum):
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"

# In-memory membership database
memberships_database: Dict[str, Dict[str, Any]] = {}

# Premium features by tier
TIER_FEATURES = {
    MembershipTier.FREE: [
        "basic_events",
        "public_events",
        "standard_support"
    ],
    MembershipTier.PREMIUM: [
        "basic_events",
        "public_events",
        "secret_events",
        "anonymous_tickets",
        "anonymous_chat",
        "premium_messages",
        "priority_support",
        "advanced_analytics",
        "custom_branding"
    ],
    MembershipTier.VIP: [
        "basic_events",
        "public_events",
        "secret_events",
        "anonymous_tickets",
        "anonymous_chat",
        "premium_messages",
        "priority_support",
        "advanced_analytics",
        "custom_branding",
        "early_location_reveal",
        "exclusive_events",
        "custom_invite_codes",
        "white_label_events",
        "vip_early_access"
    ]
}

# Pricing (in Naira)
TIER_PRICING = {
    MembershipTier.PREMIUM: {
        "monthly": 2500,
        "yearly": 25000,  # 2 months free
        "lifetime": 50000
    },
    MembershipTier.VIP: {
        "monthly": 5000,
        "yearly": 50000,  # 2 months free
        "lifetime": 100000
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
        """Create default free membership for new users"""
        membership = {
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "tier": MembershipTier.FREE,
            "status": MembershipStatus.ACTIVE,
            "features": TIER_FEATURES[MembershipTier.FREE],
            "expires_at": None,  # Free never expires
            "created_at": time.time(),
            "updated_at": time.time(),
            "payment_history": []
        }
        
        memberships_database[user_id] = membership
        return membership
    
    def upgrade_membership(
        self, 
        user_id: str, 
        tier: MembershipTier, 
        duration: str = "monthly",
        payment_reference: str = None
    ) -> Dict[str, Any]:
        """Upgrade user to premium tier"""
        try:
            if tier == MembershipTier.FREE:
                return {
                    "success": False,
                    "error": "Cannot upgrade to free tier"
                }
            
            # Calculate expiration
            expires_at = None
            if duration == "monthly":
                expires_at = time.time() + (30 * 24 * 60 * 60)  # 30 days
            elif duration == "yearly":
                expires_at = time.time() + (365 * 24 * 60 * 60)  # 365 days
            elif duration == "lifetime":
                expires_at = None  # Never expires
            
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
                "amount": TIER_PRICING[tier][duration],
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
        """Cancel premium membership (downgrade to free)"""
        try:
            membership = self.get_user_membership(user_id)
            
            if membership["tier"] == MembershipTier.FREE:
                return {
                    "success": False,
                    "error": "User is already on free tier"
                }
            
            # Downgrade to free
            membership.update({
                "tier": MembershipTier.FREE,
                "status": MembershipStatus.CANCELLED,
                "features": TIER_FEATURES[MembershipTier.FREE],
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
            "free_users": 0,
            "premium_users": 0,
            "vip_users": 0,
            "active_subscriptions": 0,
            "expired_subscriptions": 0,
            "total_revenue": 0
        }
        
        for membership in memberships_database.values():
            tier = membership["tier"]
            status = membership["status"]
            
            if tier == MembershipTier.FREE:
                stats["free_users"] += 1
            elif tier == MembershipTier.PREMIUM:
                stats["premium_users"] += 1
            elif tier == MembershipTier.VIP:
                stats["vip_users"] += 1
            
            if status == MembershipStatus.ACTIVE and tier != MembershipTier.FREE:
                stats["active_subscriptions"] += 1
            elif status == MembershipStatus.EXPIRED:
                stats["expired_subscriptions"] += 1
            
            # Calculate revenue
            for payment in membership.get("payment_history", []):
                stats["total_revenue"] += payment["amount"]
        
        return stats

# Global service instance
membership_service = MembershipService()