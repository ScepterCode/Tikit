"""
Booking Service using bookings table
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class BookingService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_booking(self, user_id: str, event_id: str, quantity: int, 
                           total_amount: float, phone: str = None, 
                           payment_method: str = "paystack") -> Optional[dict]:
        """Create a new booking"""
        try:
            booking_data = {
                "user_id": user_id,
                "event_id": event_id,
                "quantity": quantity,
                "total_amount": total_amount,
                "status": "pending",
                "phone": phone,
                "payment_method": payment_method,
                "payment_reference": str(uuid.uuid4()),
                "booking_source": "web"
            }
            
            result = self.supabase.table('bookings').insert(booking_data).execute()
            
            if result.data:
                logger.info(f"Booking created: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error creating booking: {str(e)}")
            return None
    
    async def get_booking(self, booking_id: str) -> Optional[dict]:
        """Get booking by ID"""
        try:
            result = self.supabase.table('bookings').select('*').eq('id', booking_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting booking: {str(e)}")
            return None
    
    async def get_user_bookings(self, user_id: str) -> List[dict]:
        """Get all bookings for a user"""
        try:
            result = self.supabase.table('bookings').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting user bookings: {str(e)}")
            return []
    
    async def update_booking_status(self, booking_id: str, status: str) -> bool:
        """Update booking status"""
        try:
            update_data = {"status": status}
            
            if status == "confirmed":
                update_data["confirmed_at"] = "now()"
            elif status == "cancelled":
                update_data["cancelled_at"] = "now()"
            
            result = self.supabase.table('bookings').update(update_data).eq('id', booking_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error updating booking status: {str(e)}")
            return False

# Global service instance
booking_service = BookingService()
