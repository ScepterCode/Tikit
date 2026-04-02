"""
Tickets router for ticket management, verification, and QR code scanning
"""
from fastapi import APIRouter, HTTPException, Depends, status
from models.ticket_schemas import (
    TicketCreate, TicketResponse, BulkTicketCreate, BulkTicketResponse,
    TicketVerifyRequest, TicketVerifyResponse, TicketMarkUsedRequest,
    MyTicketsResponse, ScanHistoryResponse
)
from services.ticket_service import ticket_service
from middleware.auth import get_current_user, require_role
from middleware.rate_limiter import rate_limiter
from datetime import datetime
from typing import Dict, Any, List

router = APIRouter(tags=["tickets"])

@router.post("/create")
async def create_ticket_after_payment(
    ticket_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Create ticket(s) after successful payment and credit organizer
    """
    try:
        import logging
        logger = logging.getLogger(__name__)
        
        # Extract ticket data
        event_id = ticket_data.get('event_id')
        quantity = ticket_data.get('quantity', 1)
        tier_name = ticket_data.get('tier_name')
        payment_reference = ticket_data.get('payment_reference')
        transaction_id = ticket_data.get('transaction_id')
        
        if not all([event_id, tier_name, payment_reference]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "MISSING_REQUIRED_FIELDS",
                        "message": "event_id, tier_name, and payment_reference are required",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        # Get event details to determine ticket price
        from services.supabase_client import supabase_client
        
        event_result = supabase_client.client.table('events')\
            .select('id, title, organizer_id, ticket_tiers')\
            .eq('id', event_id)\
            .single()\
            .execute()
        
        if not event_result.data:
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
        
        event = event_result.data
        
        # Find ticket price from tier
        ticket_price = 0
        if event.get('ticket_tiers'):
            for tier in event['ticket_tiers']:
                if tier.get('name') == tier_name:
                    ticket_price = tier.get('price', 0)
                    break
        
        if ticket_price == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_TIER",
                        "message": f"Ticket tier '{tier_name}' not found or has no price",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        # Create tickets
        created_tickets = []
        for i in range(quantity):
            ticket_create_data = {
                'event_id': event_id,
                'user_id': current_user['user_id'],
                'tier_name': tier_name,
                'price': ticket_price,
                'payment_reference': payment_reference,
                'status': 'active',
                'ticket_type': 'regular'
            }
            
            ticket = await ticket_service.create_ticket(ticket_create_data)
            
            if ticket:
                created_tickets.append(ticket)
            else:
                logger.error(f"Failed to create ticket {i+1}/{quantity}")
        
        if not created_tickets:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "success": False,
                    "error": {
                        "code": "TICKET_CREATION_FAILED",
                        "message": "Failed to create tickets",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        # ⭐ CREDIT ORGANIZER (NEW)
        from services.organizer_payment_service import organizer_payment_service
        
        credit_result = await organizer_payment_service.credit_organizer_for_ticket_sale(
            event_id=event_id,
            ticket_price=ticket_price,
            payment_reference=payment_reference,
            attendee_id=current_user['user_id'],
            quantity=quantity
        )
        
        if not credit_result['success']:
            # Log error but don't fail ticket creation
            logger.error(f"Failed to credit organizer: {credit_result.get('error')}")
            logger.error(f"Event: {event_id}, Amount: {ticket_price * quantity}, Reference: {payment_reference}")
        else:
            logger.info(f"✅ Organizer credited: ₦{credit_result.get('amount_credited', 0):,.2f}")
        
        return {
            "success": True,
            "tickets": created_tickets,
            "quantity": len(created_tickets),
            "organizer_credited": credit_result['success'],
            "organizer_amount": credit_result.get('amount_credited', 0),
            "platform_fee": credit_result.get('platform_fee', 0),
            "message": f"Successfully created {len(created_tickets)} ticket(s)"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error creating tickets: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Error creating tickets: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/issue", response_model=TicketResponse)
async def issue_ticket(
    ticket_data: TicketCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Issue a ticket after successful payment
    """
    try:
        # Rate limiting check
        is_allowed, message = rate_limiter.check_rate_limit(
            current_user['user_id'], 
            "issue_ticket"
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": message,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        result = await ticket_service.issue_ticket(
            ticket_data.dict(),
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
        
        return result['data']
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to issue ticket",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/my-tickets", response_model=MyTicketsResponse)
async def get_my_tickets(
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get current user's tickets
    """
    try:
        result = await ticket_service.get_tickets_by_user_id(current_user['user_id'])
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to retrieve tickets",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/{ticket_id}", response_model=TicketResponse)
async def get_ticket_by_id(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get ticket by ID (user must own the ticket)
    """
    try:
        ticket = await ticket_service.get_ticket_by_id(ticket_id, current_user['user_id'])
        
        if not ticket:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "TICKET_NOT_FOUND",
                        "message": "Ticket not found or access denied",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return ticket
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to get ticket",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/verify", response_model=TicketVerifyResponse)
async def verify_ticket(
    verify_data: TicketVerifyRequest,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Verify a ticket using QR code or backup code (organizer only)
    """
    try:
        result = await ticket_service.verify_ticket(verify_data.dict())
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to verify ticket",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/mark-used")
async def mark_ticket_used(
    mark_data: TicketMarkUsedRequest,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Mark a ticket as used after successful verification (organizer only)
    """
    try:
        result = await ticket_service.mark_ticket_used(mark_data.dict())
        
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
            "message": result['message']
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
                    "message": "Failed to mark ticket as used",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/{ticket_id}/scan-history", response_model=List[ScanHistoryResponse])
async def get_ticket_scan_history(
    ticket_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get scan history for a ticket
    """
    try:
        # First verify user owns the ticket or is an organizer
        if current_user['role'] != 'organizer':
            ticket = await ticket_service.get_ticket_by_id(ticket_id, current_user['user_id'])
            if not ticket:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail={
                        "success": False,
                        "error": {
                            "code": "TICKET_NOT_FOUND",
                            "message": "Ticket not found or access denied",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    }
                )
        
        scan_history = await ticket_service.get_scan_history(ticket_id)
        return scan_history
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to get scan history",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/bulk-purchase/{purchase_id}")
async def get_bulk_purchase(
    purchase_id: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Get bulk purchase details and payment status
    """
    try:
        from services.supabase_client import supabase_client
        
        # Get bulk purchase from payments table
        result = supabase_client.client.table('payments').select('*').eq('id', purchase_id).single().execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "success": False,
                    "error": {
                        "code": "PURCHASE_NOT_FOUND",
                        "message": "Bulk purchase not found",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        purchase = result.data
        
        # Get associated tickets
        tickets_result = supabase_client.client.table('tickets').select('*').eq('payment_id', purchase_id).execute()
        
        return {
            "success": True,
            "data": {
                "purchase_id": purchase_id,
                "status": purchase.get('status'),
                "amount": purchase.get('amount'),
                "quantity": len(tickets_result.data) if tickets_result.data else 0,
                "tickets": tickets_result.data or [],
                "created_at": purchase.get('created_at'),
                "payment_method": purchase.get('payment_method')
            }
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
                    "message": f"Failed to get bulk purchase: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/organizer/scan-history")
async def get_organizer_scan_history(
    event_id: str = None,
    current_user: Dict[str, Any] = Depends(require_role("organizer"))
):
    """
    Get all scan history for organizer's events
    """
    try:
        from services.supabase_client import supabase_client
        
        # Get organizer's events
        events_query = supabase_client.client.table('events').select('id').eq('organizer_id', current_user['user_id'])
        
        if event_id:
            events_query = events_query.eq('id', event_id)
        
        events_result = events_query.execute()
        
        if not events_result.data:
            return {
                "success": True,
                "data": []
            }
        
        event_ids = [event['id'] for event in events_result.data]
        
        # Get tickets for these events
        tickets_result = supabase_client.client.table('tickets').select('id, event_id').in_('event_id', event_ids).execute()
        
        if not tickets_result.data:
            return {
                "success": True,
                "data": []
            }
        
        ticket_ids = [ticket['id'] for ticket in tickets_result.data]
        
        # Get scan history for these tickets (if table exists)
        try:
            scan_history_result = supabase_client.client.table('ticket_scans').select('*').in_('ticket_id', ticket_ids).order('scanned_at', desc=True).limit(100).execute()
            
            return {
                "success": True,
                "data": scan_history_result.data or []
            }
        except Exception:
            # Table might not exist yet, return empty
            return {
                "success": True,
                "data": []
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
                    "message": f"Failed to get scan history: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

# Placeholder endpoints for future features
@router.post("/bulk-issue", response_model=BulkTicketResponse)
async def bulk_issue_tickets(
    bulk_data: BulkTicketCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Issue multiple tickets for bulk purchases (placeholder)
    """
    return {
        "tickets": [],
        "csv_data": "",
        "split_payment_links": None
    }

@router.post("/transfer/{ticket_id}")
async def transfer_ticket(
    ticket_id: str,
    new_owner_phone: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Transfer ticket to another user (placeholder)
    """
    return {
        "success": True,
        "message": "Ticket transfer feature will be implemented in next phase"
    }

@router.post("/cancel/{ticket_id}")
async def cancel_ticket(
    ticket_id: str,
    reason: str,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Cancel a ticket and process refund (placeholder)
    """
    return {
        "success": True,
        "message": "Ticket cancellation feature will be implemented in next phase"
    }