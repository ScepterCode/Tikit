"""
Ticket schemas for ticket management and verification
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TicketCreate(BaseModel):
    """Schema for creating a new ticket"""
    event_id: str = Field(..., description="Event ID")
    ticket_type: str = Field(..., description="Type of ticket (regular, vip, etc.)")
    price: float = Field(..., ge=0, description="Ticket price")
    payment_id: str = Field(..., description="Payment transaction ID")
    attendee_name: Optional[str] = Field(None, description="Attendee name")
    attendee_phone: Optional[str] = Field(None, description="Attendee phone")
    attendee_email: Optional[str] = Field(None, description="Attendee email")
    special_requests: Optional[str] = Field(None, description="Special requests")

class TicketResponse(BaseModel):
    """Schema for ticket response"""
    ticket_id: str
    event_id: str
    event_title: str
    ticket_type: str
    price: float
    qr_code: str
    backup_code: str
    attendee_name: Optional[str]
    attendee_phone: Optional[str]
    attendee_email: Optional[str]
    purchase_date: datetime
    event_date: datetime
    venue: str
    is_used: bool
    used_at: Optional[datetime]
    special_requests: Optional[str]

class BulkTicketCreate(BaseModel):
    """Schema for bulk ticket creation"""
    event_id: str = Field(..., description="Event ID")
    ticket_type: str = Field(..., description="Type of ticket")
    quantity: int = Field(..., ge=1, le=100, description="Number of tickets")
    price_per_ticket: float = Field(..., ge=0, description="Price per ticket")
    payment_id: str = Field(..., description="Payment transaction ID")
    attendees: Optional[List[Dict[str, str]]] = Field(None, description="List of attendee details")
    split_payment: Optional[bool] = Field(False, description="Enable split payment links")

class BulkTicketResponse(BaseModel):
    """Schema for bulk ticket response"""
    tickets: List[TicketResponse]
    csv_data: str
    split_payment_links: Optional[List[str]]

class TicketVerifyRequest(BaseModel):
    """Schema for ticket verification request"""
    ticket_code: str = Field(..., description="QR code or backup code")
    event_id: str = Field(..., description="Event ID for verification")

class TicketVerifyResponse(BaseModel):
    """Schema for ticket verification response"""
    success: bool
    message: str
    ticket_id: Optional[str]
    attendee_name: Optional[str]
    ticket_type: Optional[str]
    is_valid: bool
    is_used: bool
    event_title: Optional[str]

class TicketMarkUsedRequest(BaseModel):
    """Schema for marking ticket as used"""
    ticket_id: str = Field(..., description="Ticket ID")
    event_id: str = Field(..., description="Event ID")
    scanner_id: str = Field(..., description="Scanner user ID")

class MyTicketsResponse(BaseModel):
    """Schema for user's tickets response"""
    tickets: List[TicketResponse]
    total_count: int
    upcoming_events: int
    past_events: int

class ScanHistoryResponse(BaseModel):
    """Schema for ticket scan history"""
    scan_id: str
    ticket_id: str
    scanner_name: str
    scan_time: datetime
    scan_location: Optional[str]
    scan_result: str  # "valid", "invalid", "already_used"