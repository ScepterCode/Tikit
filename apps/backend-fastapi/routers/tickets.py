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
from auth_utils import get_user_from_request

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_current_user(request: Request) -> Dict[str, Any]:
    """Authenticate the request via the shared Supabase JWT validator.

    Mock tokens are only honoured when ENABLE_MOCK_TOKENS is set in a
    development environment (enforced inside auth_utils).
    """
    try:
        return await get_user_from_request(request)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

class TicketValidationRequest(BaseModel):
    ticket_code: str
    event_id: Optional[str] = None


async def _assert_event_organizer(event_id: Optional[str], current_user: Dict[str, Any]) -> dict:
    """Raise 403 unless current_user owns (organizes) the given event.

    Admins are always allowed. Returns the event record on success.
    """
    if not event_id:
        raise HTTPException(status_code=400, detail="event_id is required")

    event = await event_service.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if current_user.get("role") == "admin":
        return event

    organizer_id = event.get("organizer_id") or event.get("host_id")
    if not organizer_id or organizer_id != current_user.get("user_id"):
        raise HTTPException(
            status_code=403,
            detail="Only the event organizer can perform this action",
        )
    return event

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

        # Only the organizer of the ticket's event (or an admin) may validate it
        await _assert_event_organizer(ticket['event_id'], current_user)

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

        # Only the organizer of the ticket's event (or an admin) may mark it used
        await _assert_event_organizer(ticket['event_id'], current_user)

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
