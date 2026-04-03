"""
Membership API Router
Handles premium membership endpoints
"""
from fastapi import APIRouter, Request, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, Dict, Any
import time
from services.membership_service import membership_service, MembershipTier, MembershipStatus

router = APIRouter(prefix="/api/memberships", tags=["memberships"])

# Request/Response Models
class UpgradeRequest(BaseModel):
    tier: MembershipTier
    duration: str = "monthly"  # monthly, yearly, lifetime
    payment_reference: Optional[str] = None

class StartTrialRequest(BaseModel):
    tier: str  # "special" or "legend"

class ProcessPaymentRequest(BaseModel):
    tier: str  # "special" or "legend"
    payment_reference: str

class MembershipResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    error: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

# Import shared authentication utility
from auth_utils import get_user_from_request

@router.get("/status")
async def get_membership_status(request: Request):
    """Get current user's membership status"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        membership = membership_service.get_user_membership(user_id)
        
        # Calculate days remaining
        days_remaining = None
        if membership.get("expires_at"):
            days_remaining = max(0, int((membership["expires_at"] - time.time()) / 86400))
        
        return {
            "success": True,
            "data": {
                "membership": membership,
                "features": membership["features"],
                "is_premium": membership["tier"] != MembershipTier.REGULAR,
                "expires_at": membership.get("expires_at"),
                "days_remaining": days_remaining,
                "is_trial": membership.get("status") == MembershipStatus.TRIAL
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/start-trial")
async def start_trial(request: Request, trial_data: StartTrialRequest):
    """Start 7-day free trial for Special or Legend tier"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = membership_service.start_trial(user_id, trial_data.tier)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": {
                "membership": result["membership"],
                "trial_ends_at": result["trial_ends_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process-payment")
async def process_payment(request: Request, payment_data: ProcessPaymentRequest):
    """Process membership payment after trial or for renewal"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # TODO: Verify payment with Flutterwave using payment_reference
        # For now, we'll trust the payment_reference
        
        result = membership_service.process_payment(
            user_id=user_id,
            tier=payment_data.tier,
            payment_reference=payment_data.payment_reference
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": {
                "membership": result["membership"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upgrade")
async def upgrade_membership(request: Request, upgrade_data: UpgradeRequest):
    """Upgrade user to premium tier"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Validate tier and duration
        if upgrade_data.tier not in [MembershipTier.SPECIAL, MembershipTier.LEGEND]:
            raise HTTPException(status_code=400, detail="Invalid tier")
        
        if upgrade_data.duration not in ["monthly"]:
            raise HTTPException(status_code=400, detail="Invalid duration")
        
        result = membership_service.upgrade_membership(
            user_id=user_id,
            tier=upgrade_data.tier,
            duration=upgrade_data.duration,
            payment_reference=upgrade_data.payment_reference
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": {
                "membership": result["membership"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/pricing")
async def get_pricing():
    """Get pricing information for all tiers"""
    try:
        pricing = membership_service.get_tier_pricing()
        
        return {
            "success": True,
            "data": {
                "pricing": pricing,
                "features": {
                    "regular": membership_service.get_tier_features(MembershipTier.REGULAR),
                    "special": membership_service.get_tier_features(MembershipTier.SPECIAL),
                    "legend": membership_service.get_tier_features(MembershipTier.LEGEND)
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/cancel")
async def cancel_membership(request: Request):
    """Cancel premium membership"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = membership_service.cancel_membership(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": {
                "membership": result["membership"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-feature/{feature}")
async def check_feature_access(request: Request, feature: str):
    """Check if user has access to a specific feature"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        has_access = membership_service.check_feature_access(user_id, feature)
        membership = membership_service.get_user_membership(user_id)
        
        # Determine required tier for feature
        required_tier = "regular"
        if feature in membership_service.get_tier_features(MembershipTier.LEGEND):
            if feature not in membership_service.get_tier_features(MembershipTier.SPECIAL):
                required_tier = "legend"
            else:
                required_tier = "special"
        
        return {
            "success": True,
            "data": {
                "feature": feature,
                "has_access": has_access,
                "current_tier": membership["tier"],
                "required_tier": required_tier
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_membership_stats(request: Request):
    """Get membership statistics (admin only)"""
    try:
        user = await get_user_from_request(request)
        
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        stats = membership_service.get_membership_stats()
        
        return {
            "success": True,
            "data": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))