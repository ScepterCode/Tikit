"""
Tickets Router - Handle ticket operations
"""
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

from services.ticket_service import ticket_service
from services.event_service import event_service
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple authentication function
async def get_current_user(request: Request):
    """Extract user from token"""
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Not authenticated")
        
        token = auth_header.split(" ")[1]
        
        # For testing, extract user ID from mock token
        if token.startswith("mock_access_token_"):
            user_id = token.replace("mock_access_token_", "")
            return {"user_id": user_id, "token": token}
        
        # For real tokens, decode JWT
        # TODO: Implement proper JWT validation
        
        raise HTTPException(status_code=401, detail="Invalid token")
        
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")

class TicketValidationRequest(BaseModel):
    ticket_code: str
    event_id: Optional[str] = None

@router.get("/my-tickets")
async def get_my_tickets(current_user: dict = Depends(get_current_user)):
    """Get all tickets for the current user"""
    try:
        user_id = current_user["user_id"]
        tickets = await ticket_service.get_user_tickets(user_id)
        
        # Enrich tickets with event details
        enriched_tickets = []
        for ticket in tickets:
            event = await event_service.get_event(ticket['event_id'])
            ticket['event'] = event
            enriched_tickets.append(ticket)
        
        return {
            "success": True,
            "tickets": enriched_tickets,
            "total": len(enriched_tickets)
        }
    except Exception as e:
        logger.error(f"Error fetching user tickets: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "FETCH_ERROR",
                    "message": str(e)
                }
            }
        )

@router.get("/ticket/{ticket_id}")
async def get_ticket_details(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get detailed information about a specific ticket"""
    try:
        ticket = await ticket_service.get_ticket(ticket_id)
        
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # Verify ownership
        if ticket['user_id'] != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to view this ticket")
        
        # Get event details
        event = await event_service.get_event(ticket['event_id'])
        ticket['event'] = event
        
        return {
            "success": True,
            "ticket": ticket
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching ticket details: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "FETCH_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/validate")
async def validate_ticket(
    request: TicketValidationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Validate a ticket code (for organizers at event entrance)"""
    try:
        # Find ticket by code
        supabase = get_supabase_client()
        if not supabase:
            raise HTTPException(status_code=500, detail="Database not available")
        
        result = supabase.table('tickets')\
            .select('*')\
            .eq('ticket_code', request.ticket_code)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            return {
                "success": False,
                "valid": False,
                "status": "invalid",
                "message": "Ticket code not found"
            }
        
        ticket = result.data[0]
        
        # Check if ticket is for the specified event (if provided)
        if request.event_id and ticket['event_id'] != request.event_id:
            return {
                "success": False,
                "valid": False,
                "status": "invalid",
                "message": "Ticket is not for this event"
            }
        
        # Check ticket status
        if ticket['status'] == 'used':
            return {
                "success": False,
                "valid": False,
                "status": "already_used",
                "message": "Ticket has already been used",
                "ticket": ticket,
                "used_at": ticket.get('used_at')
            }
        
        if ticket['status'] != 'active':
            return {
                "success": False,
                "valid": False,
                "status": "invalid",
                "message": f"Ticket status is {ticket['status']}"
            }
        
        # Get event and user details
        event = await event_service.get_event(ticket['event_id'])
        
        # Get user details
        user_result = supabase.table('users')\
            .select('first_name, last_name, email')\
            .eq('id', ticket['user_id'])\
            .execute()
        
        user = user_result.data[0] if user_result.data else {}
        
        return {
            "success": True,
            "valid": True,
            "status": "valid",
            "message": "Ticket is valid",
            "ticket": ticket,
            "event": event,
            "attendee": {
                "name": f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() or "Unknown",
                "email": user.get('email', '')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error validating ticket: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": str(e)
                }
            }
        )

@router.post("/mark-used/{ticket_id}")
async def mark_ticket_used(
    ticket_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a ticket as used (for organizers after scanning)"""
    try:
        # Verify ticket exists
        ticket = await ticket_service.get_ticket(ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket not found")
        
        # TODO: Verify current user is organizer of the event
        
        # Mark ticket as used
        success = await ticket_service.use_ticket(ticket_id)
        
        if success:
            return {
                "success": True,
                "message": "Ticket marked as used",
                "ticket_id": ticket_id
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to mark ticket as used")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking ticket as used: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "UPDATE_ERROR",
                    "message": str(e)
                }
            }
        )
