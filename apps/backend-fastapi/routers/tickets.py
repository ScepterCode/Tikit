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
from datetime import datetime
from typing import Dict, Any, List

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/issue", response_model=TicketResponse)
async def issue_ticket(
    ticket_data: TicketCreate,
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Issue a ticket after successful payment
    """
    try:
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