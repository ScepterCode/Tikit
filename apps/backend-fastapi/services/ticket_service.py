"""
Ticket management service with persistent database storage
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
from datetime import datetime
import uuid
import qrcode
import io
import base64
import logging
from services.ticket_code_generator import ticket_code_generator

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    def generate_qr_code(self, ticket_code: str) -> str:
        """Generate QR code for ticket using ticket code (not ticket ID)"""
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            # QR code contains the ticket code (XXXX-1234567)
            qr.add_data(ticket_code)
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return img_str  # Return base64 string without data URI prefix
        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return ""
    
    async def create_ticket(self, ticket_data: dict) -> Optional[dict]:
        """Create a new ticket in the database with unique ticket code"""
        try:
            # Generate unique ticket code
            ticket_code = await ticket_code_generator.generate_unique_code(self.supabase)
            
            if not ticket_code:
                logger.error("Failed to generate unique ticket code")
                return None
            
            # Add ticket code to data
            ticket_data['ticket_code'] = ticket_code
            
            # Set default values
            ticket_data.setdefault('status', 'active')
            ticket_data.setdefault('ticket_type', 'regular')
            
            # Generate QR code from ticket code
            qr_code_base64 = self.generate_qr_code(ticket_code)
            if qr_code_base64:
                ticket_data['qr_code'] = qr_code_base64
            
            result = self.supabase.table('tickets').insert(ticket_data).execute()
            
            if result.data:
                ticket = result.data[0]
                logger.info(f"Ticket created: {ticket['id']} with code: {ticket_code}")
                return ticket
            else:
                logger.error("Failed to create ticket")
                return None
                
        except Exception as e:
            logger.error(f"Error creating ticket: {str(e)}")
            return None
    
    async def get_ticket(self, ticket_id: str) -> Optional[dict]:
        """Get ticket by ID"""
        try:
            result = self.supabase.table('tickets').select('*').eq('id', ticket_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting ticket {ticket_id}: {str(e)}")
            return None
    
    async def get_user_tickets(self, user_id: str) -> List[dict]:
        """Get all tickets for a user"""
        try:
            result = self.supabase.table('tickets').select('*').eq('user_id', user_id).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting tickets for user {user_id}: {str(e)}")
            return []
    
    async def get_event_tickets(self, event_id: str) -> List[dict]:
        """Get all tickets for an event"""
        try:
            result = self.supabase.table('tickets').select('*').eq('event_id', event_id).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting tickets for event {event_id}: {str(e)}")
            return []
    
    async def update_ticket(self, ticket_id: str, update_data: dict) -> Optional[dict]:
        """Update ticket data"""
        try:
            result = self.supabase.table('tickets').update(update_data).eq('id', ticket_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating ticket {ticket_id}: {str(e)}")
            return None
    
    async def use_ticket(self, ticket_id: str) -> bool:
        """Mark ticket as used"""
        try:
            result = self.supabase.table('tickets').update({
                'status': 'used',
                'used_at': datetime.now().isoformat()
            }).eq('id', ticket_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error using ticket {ticket_id}: {str(e)}")
            return False
    
    async def validate_ticket(self, ticket_id: str, event_id: str) -> dict:
        """Validate ticket for event entry"""
        try:
            ticket = await self.get_ticket(ticket_id)
            
            if not ticket:
                return {"valid": False, "reason": "Ticket not found"}
            
            if ticket['event_id'] != event_id:
                return {"valid": False, "reason": "Ticket not for this event"}
            
            if ticket['status'] == 'used':
                return {"valid": False, "reason": "Ticket already used"}
            
            if ticket['status'] != 'active':
                return {"valid": False, "reason": "Ticket not active"}
            
            return {"valid": True, "ticket": ticket}
            
        except Exception as e:
            logger.error(f"Error validating ticket {ticket_id}: {str(e)}")
            return {"valid": False, "reason": "Validation error"}

# Global service instance
ticket_service = TicketService()
