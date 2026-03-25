"""
Secret Events API Router
Handles premium-only secret events with invite codes
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

router = APIRouter(prefix="/api/secret-events", tags=["secret-events"])

# Request/Response Models
class CreateSecretEventRequest(BaseModel):
    title: str
    description: Optional[str] = ""
    venue: str  # Full secret address
    public_venue: Optional[str] = "Lagos Island"  # Vague public location
    start_date: str
    end_date: Optional[str] = None
    category: Optional[str] = "secret"
    premium_tier_required: Optional[str] = "premium"  # premium or vip
    location_reveal_hours: Optional[int] = 2  # Hours before event
    max_attendees: Optional[int] = 100
    anonymous_purchases_allowed: Optional[bool] = True
    attendee_list_hidden: Optional[bool] = True
    ticket_tiers: Optional[List[Dict[str, Any]]] = None
    price: Optional[float] = 5000  # Default price if no tiers

class ValidateInviteRequest(BaseModel):
    invite_code: str

class PurchaseAnonymousTicketRequest(BaseModel):
    event_id: str
    tier_id: str
    is_anonymous: Optional[bool] = True
    buyer_email: Optional[str] = None

# Import shared authentication utility
from auth_utils import get_user_from_request

@router.post("/create")
async def create_secret_event(request: Request, event_data: CreateSecretEventRequest):
    """Create a new secret event (premium organizers only)"""
    try:
        # Import here to avoid circular imports
        from services.secret_events_service import secret_events_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] != "organizer":
            raise HTTPException(status_code=403, detail="Only organizers can create secret events")
        
        # Convert request to dict
        event_dict = event_data.dict()
        
        result = secret_events_service.create_secret_event(
            event_data=event_dict,
            organizer_id=user_id,
            premium_tier_required=event_data.premium_tier_required,
            location_reveal_hours=event_data.location_reveal_hours
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/validate-invite")
async def validate_invite_code(request: Request, invite_data: ValidateInviteRequest):
    """Validate invite code and return event details"""
    try:
        from services.secret_events_service import secret_events_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = secret_events_service.validate_invite_code(
            invite_code=invite_data.invite_code,
            user_id=user_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/accessible")
async def get_accessible_secret_events(request: Request):
    """Get secret events accessible to user based on membership tier"""
    try:
        from services.secret_events_service import secret_events_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = secret_events_service.get_secret_events_for_user(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/purchase-anonymous-ticket")
async def purchase_anonymous_ticket(request: Request, ticket_data: PurchaseAnonymousTicketRequest):
    """Purchase anonymous ticket for secret event"""
    try:
        from services.secret_events_service import secret_events_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = secret_events_service.purchase_anonymous_ticket(
            event_id=ticket_data.event_id,
            tier_id=ticket_data.tier_id,
            user_id=user_id,
            is_anonymous=ticket_data.is_anonymous,
            buyer_email=ticket_data.buyer_email
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "message": result["message"],
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/event/{event_id}")
async def get_secret_event_details(request: Request, event_id: str):
    """Get secret event details (with location reveal logic)"""
    try:
        from services.secret_events_service import secret_events_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Check if user has access to this event
        result = secret_events_service.get_secret_events_for_user(user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Find the specific event
        event = None
        for e in result["data"]["events"]:
            if e["id"] == event_id:
                event = e
                break
        
        if not event:
            raise HTTPException(status_code=404, detail="Secret event not found or access denied")
        
        return {
            "success": True,
            "data": {
                "event": event
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/invite-codes/{event_id}")
async def get_event_invite_codes(request: Request, event_id: str):
    """Get invite codes for event (organizer only)"""
    try:
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer of this event
        from services.secret_events_service import secret_events_database
        
        event = secret_events_database.get(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Secret event not found")
        
        if event["organizer_id"] != user_id:
            raise HTTPException(status_code=403, detail="Only event organizer can view invite codes")
        
        # Get invite codes for this event
        from services.secret_events_service import invite_codes_database
        
        event_codes = []
        for code_id, code_record in invite_codes_database.items():
            if code_record["event_id"] == event_id:
                event_codes.append({
                    "id": code_id,
                    "code": code_record["code"],
                    "max_uses": code_record["max_uses"],
                    "used_count": code_record["used_count"],
                    "expires_at": code_record["expires_at"],
                    "created_at": code_record["created_at"],
                    "last_used_at": code_record["last_used_at"],
                    "last_used_by": code_record["last_used_by"]
                })
        
        return {
            "success": True,
            "data": {
                "event_id": event_id,
                "invite_codes": event_codes,
                "total_codes": len(event_codes)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats")
async def get_secret_events_stats(request: Request):
    """Get secret events statistics (admin only)"""
    try:
        user = await get_user_from_request(request)
        
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        from services.secret_events_service import secret_events_database, invite_codes_database, anonymous_tickets_database
        
        stats = {
            "total_secret_events": len(secret_events_database),
            "total_invite_codes": len(invite_codes_database),
            "total_anonymous_tickets": len(anonymous_tickets_database),
            "events_by_tier": {
                "premium": 0,
                "vip": 0
            },
            "total_revenue": 0,
            "active_events": 0
        }
        
        for event in secret_events_database.values():
            tier_required = event["premium_tier_required"]
            stats["events_by_tier"][tier_required] += 1
            
            if event["status"] == "active":
                stats["active_events"] += 1
        
        for ticket in anonymous_tickets_database:
            if ticket["status"] == "active":
                stats["total_revenue"] += ticket["price"]
        
        return {
            "success": True,
            "data": stats
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))