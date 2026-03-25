"""
Payment Service using payments table
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import uuid
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_payment(self, user_id: str, amount: int, method: str, 
                           provider: str = "paystack", ticket_id: str = None) -> Optional[dict]:
        """Create a new payment record"""
        try:
            payment_data = {
                "user_id": user_id,
                "amount": amount,  # Amount in kobo
                "currency": "NGN",
                "method": method,
                "status": "pending",
                "provider": provider,
                "reference": str(uuid.uuid4()),
                "ticket_id": ticket_id
            }
            
            result = self.supabase.table('payments').insert(payment_data).execute()
            
            if result.data:
                logger.info(f"Payment created: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error creating payment: {str(e)}")
            return None
    
    async def get_payment(self, payment_id: str) -> Optional[dict]:
        """Get payment by ID"""
        try:
            result = self.supabase.table('payments').select('*').eq('id', payment_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting payment: {str(e)}")
            return None
    
    async def get_user_payments(self, user_id: str) -> List[dict]:
        """Get all payments for a user"""
        try:
            result = self.supabase.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting user payments: {str(e)}")
            return []
    
    async def update_payment_status(self, payment_id: str, status: str, metadata: dict = None) -> bool:
        """Update payment status"""
        try:
            update_data = {"status": status}
            if metadata:
                update_data["metadata"] = str(metadata)
            
            result = self.supabase.table('payments').update(update_data).eq('id', payment_id).execute()
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error updating payment status: {str(e)}")
            return False
    
    async def calculate_user_balance(self, user_id: str) -> float:
        """Calculate user balance from payment history"""
        try:
            # Get all successful payments (money spent)
            result = self.supabase.table('payments').select('amount').eq('user_id', user_id).eq('status', 'completed').execute()
            
            total_spent = sum(payment['amount'] for payment in result.data or [])
            
            # Default starting balance (10,000 NGN = 1,000,000 kobo)
            starting_balance = 1000000  # kobo
            
            return (starting_balance - total_spent) / 100  # Convert to naira
            
        except Exception as e:
            logger.error(f"Error calculating balance: {str(e)}")
            return 100.0  # Default balance

# Global service instance
payment_service = PaymentService()
