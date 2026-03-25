"""
Updated Wallet Service using payments table for transaction history
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class WalletService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def get_user_balance(self, user_id: str) -> float:
        """Calculate balance from payments table"""
        try:
            # Get all successful payments for user
            result = self.supabase.table('payments').select('amount').eq('user_id', user_id).eq('status', 'completed').execute()
            
            total_spent = sum(payment['amount'] for payment in result.data or [])
            
            # Default starting balance (could be stored in users table)
            starting_balance = 10000.0  # 10,000 NGN default
            
            return starting_balance - (total_spent / 100)  # Convert kobo to naira
            
        except Exception as e:
            logger.error(f"Error calculating balance: {str(e)}")
            return 0.0
    
    async def get_transaction_history(self, user_id: str, limit: int = 50) -> List[dict]:
        """Get transaction history from payments table"""
        try:
            result = self.supabase.table('payments').select('*').eq('user_id', user_id).order('created_at', desc=True).limit(limit).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting transaction history: {str(e)}")
            return []
    
    async def create_payment_record(self, user_id: str, amount: int, method: str, 
                                  reference: str, status: str = 'pending') -> Optional[dict]:
        """Create payment record"""
        try:
            payment_data = {
                "user_id": user_id,
                "amount": amount,  # Amount in kobo
                "currency": "NGN",
                "method": method,
                "status": status,
                "provider": "paystack",  # or other provider
                "reference": reference
            }
            
            result = self.supabase.table('payments').insert(payment_data).execute()
            
            if result.data:
                logger.info(f"Payment record created: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error creating payment record: {str(e)}")
            return None

# Global service instance
wallet_service = WalletService()
