"""
Events router for event management, creation, and retrieval
"""
from fastapi import APIRouter, HTTPException, Depends, status, Query
from models.event_schemas import (
    EventCreate, HiddenEventCreate, WeddingEventCreate, EventResponse,
    EventFeedResponse, AccessCodeRequest, InvitationTrackRequest,
    ShareableLinkRequest, SprayMoneyTransaction, EventFilters
)
from services.event_service import event_service
from middleware.auth import get_current_user, require_role
from datetime import datetime
from typing import Dict, Any, Optional, List

router = APIRouter(prefix="/events", tags=["events"])

@router.get("/feed", response_model=EventFeedResponse)
async def get_events_feed(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    event_type: Optional[str] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    price_min: Optional[float] = Query(None, ge=0),
    price_max: Optional[float] = Query(None, ge=0),
    lga: Optional[str] = Query(None),
    distance: Optional[int] = Query(None, ge=1, le=500),
    language: Optional[str] = Query(None),
    capacity_status: Optional[str] = Query(None),
    organizer_type: Optional[str] = Query(None),
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Get paginated events feed with filtering options
    """
    try:
        # Get user state for geographic filtering
        user_state = current_user.get('state', 'Lagos') if current_user else 'Lagos'
        
        # Build filters
        filters = {}
        if event_type:
            filters['event_type'] = event_type
        if date_from:
            filters['date_from'] = date_from
        if date_to:
            filters['date_to'] = date_to
        if price_min is not None:
            filters['price_min'] = price_min
        if price_max is not None:
            filters['price_max'] = price_max
        if lga:
            filters['lga'] = lga
        if distance:
            filters['distance'] = distance
        if language:
            filters['language'] = language
        if capacity_status:
            filters['capacity_status'] = capacity_status
        if organizer_type:
            filters['organizer_type'] = organizer_type
        
        result = await event_service.get_events_feed(
            user_state=user_state,
            filters=filters,
            page=page,
            limit=limit
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to get events feed",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/{event_id}", response_model=EventResponse)
async def get_event_by_id(
    event_id: str,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    """
    Get event by ID with full details
    """
    try:
        event = await event_service.get_event_by_id(event_id)
        
        if not event:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "EVENT_NOT_FOUND",
                        "message": "Event not found",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        # Check if event is hidden and user has access
        if event['is_hidden']:
            if not current_user or current_user['user_id'] != event['organizer_id']:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail={
                        "success": False,
                        "error": {
                            "code": "ACCESS_DENIED",
                            "message": "This is a private event",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    }
                )
        
        return event
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to get event",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/create")
async def create_event(
    event_data: EventCreate,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Create a new public event (organizer only)
    """
    try:
        result = await event_service.create_event(
            event_data.dict(),
            current_user['user_id']
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message'],
            "event_id": result['event_id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to create event",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/create-hidden")
async def create_hidden_event(
    event_data: HiddenEventCreate,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Create a new hidden/private event with access code (organizer only)
    """
    try:
        result = await event_service.create_hidden_event(
            event_data.dict(),
            current_user['user_id']
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message'],
            "event_id": result['event_id'],
            "access_code": result['access_code']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to create hidden event",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/create-wedding")
async def create_wedding_event(
    event_data: WeddingEventCreate,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Create a new wedding event with special features (organizer only)
    """
    try:
        # Add wedding-specific data
        wedding_data = event_data.dict()
        wedding_data['cultural_features'] = {
            'bride_name': wedding_data.pop('bride_name'),
            'groom_name': wedding_data.pop('groom_name'),
            'wedding_date': wedding_data.pop('wedding_date').isoformat(),
            'reception_venue': wedding_data.pop('reception_venue', None),
            'dress_code': wedding_data.pop('dress_code', None),
            'gift_registry': wedding_data.pop('gift_registry', [])
        }
        
        result = await event_service.create_event(
            wedding_data,
            current_user['user_id']
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": "Wedding event created successfully",
            "event_id": result['event_id']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to create wedding event",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/validate-access-code")
async def validate_access_code(access_code_data: AccessCodeRequest):
    """
    Validate access code for hidden events
    """
    try:
        result = await event_service.validate_access_code(access_code_data.access_code)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message'],
            "event_id": result['event_id'],
            "event_title": result['event_title']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to validate access code",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

# Placeholder endpoints for future features
@router.post("/track-invitation")
async def track_invitation(invitation_data: InvitationTrackRequest):
    """
    Track invitation source (placeholder for analytics)
    """
    return {
        "success": True,
        "message": "Invitation tracking will be implemented in next phase"
    }

@router.post("/generate-shareable-link")
async def generate_shareable_link(link_data: ShareableLinkRequest):
    """
    Generate shareable link for event (placeholder)
    """
    return {
        "success": True,
        "message": "Shareable link generation will be implemented in next phase",
        "link": f"https://tikit.app/events/{link_data.event_id}?source={link_data.source}"
    }

@router.post("/spray-money")
async def add_spray_money_transaction(
    transaction_data: SprayMoneyTransaction,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Add spray money transaction for wedding events (placeholder)
    """
    return {
        "success": True,
        "message": "Spray money feature will be implemented in next phase"
    }

@router.get("/{event_id}/spray-money-leaderboard")
async def get_spray_money_leaderboard(event_id: str):
    """
    Get spray money leaderboard for wedding event (placeholder)
    """
    return {
        "success": True,
        "message": "Spray money leaderboard will be implemented in next phase",
        "leaderboard": []
    }