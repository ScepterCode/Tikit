"""
Anonymous Chat API Router - Phase 3
Handles anonymous chat and premium messaging for secret events
"""
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any, List

# Import shared authentication utility
from auth_utils import get_user_from_request

router = APIRouter(prefix="/api/anonymous-chat", tags=["anonymous-chat"])

# Request/Response Models
class CreateChatRoomRequest(BaseModel):
    event_id: str

class JoinChatRoomRequest(BaseModel):
    room_id: str

class SendMessageRequest(BaseModel):
    room_id: str
    message: str
    message_type: Optional[str] = "text"

class SendPremiumMessageRequest(BaseModel):
    event_id: str
    message: str
    message_type: Optional[str] = "announcement"
    recipients: Optional[List[str]] = None

class GetMessagesRequest(BaseModel):
    room_id: str
    limit: Optional[int] = 50
    before_timestamp: Optional[float] = None

@router.post("/create-room")
async def create_chat_room(request: Request, room_data: CreateChatRoomRequest):
    """Create anonymous chat room for secret event"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] != "organizer":
            raise HTTPException(status_code=403, detail="Only organizers can create chat rooms")
        
        result = anonymous_chat_service.create_chat_room(
            event_id=room_data.event_id,
            organizer_id=user_id
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

@router.post("/join-room")
async def join_chat_room(request: Request, join_data: JoinChatRoomRequest):
    """Join anonymous chat room with generated identity"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = anonymous_chat_service.join_chat_room(
            room_id=join_data.room_id,
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

@router.post("/send-message")
async def send_anonymous_message(request: Request, message_data: SendMessageRequest):
    """Send anonymous message to chat room"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = anonymous_chat_service.send_anonymous_message(
            room_id=message_data.room_id,
            user_id=user_id,
            message=message_data.message,
            message_type=message_data.message_type
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

@router.get("/messages/{room_id}")
async def get_chat_messages(request: Request, room_id: str, limit: int = 50, before_timestamp: Optional[float] = None):
    """Get chat messages for room"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = anonymous_chat_service.get_chat_messages(
            room_id=room_id,
            user_id=user_id,
            limit=limit,
            before_timestamp=before_timestamp
        )
        
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

@router.post("/send-premium-message")
async def send_premium_message(request: Request, message_data: SendPremiumMessageRequest):
    """Send premium message to event attendees"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] != "organizer":
            raise HTTPException(status_code=403, detail="Only organizers can send premium messages")
        
        result = anonymous_chat_service.send_premium_message(
            event_id=message_data.event_id,
            sender_id=user_id,
            message=message_data.message,
            message_type=message_data.message_type,
            recipients=message_data.recipients
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

@router.get("/premium-messages/{event_id}")
async def get_premium_messages(request: Request, event_id: str):
    """Get premium messages for user"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        result = anonymous_chat_service.get_premium_messages(
            event_id=event_id,
            user_id=user_id
        )
        
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

@router.get("/room-stats/{room_id}")
async def get_chat_room_stats(request: Request, room_id: str):
    """Get chat room statistics (organizer only)"""
    try:
        from services.anonymous_chat_service import anonymous_chat_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] != "organizer":
            raise HTTPException(status_code=403, detail="Only organizers can view chat stats")
        
        result = anonymous_chat_service.get_chat_room_stats(
            room_id=room_id,
            organizer_id=user_id
        )
        
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

@router.get("/rooms/by-event/{event_id}")
async def get_chat_rooms_by_event(request: Request, event_id: str):
    """Get chat rooms for an event"""
    try:
        from services.anonymous_chat_service import chat_rooms_database
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Find rooms for this event
        event_rooms = []
        for room_id, room in chat_rooms_database.items():
            if room["event_id"] == event_id:
                # Check if user has access (either organizer or premium member)
                if (room["organizer_id"] == user_id or 
                    user["role"] in ["admin"] or
                    user.get("membership_tier") in ["premium", "vip"]):
                    
                    event_rooms.append({
                        "room_id": room_id,
                        "name": room["name"],
                        "current_participants": room["current_participants"],
                        "max_participants": room["max_participants"],
                        "created_at": room["created_at"],
                        "status": room["status"]
                    })
        
        return {
            "success": True,
            "data": {
                "rooms": event_rooms,
                "event_id": event_id,
                "total_rooms": len(event_rooms)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))