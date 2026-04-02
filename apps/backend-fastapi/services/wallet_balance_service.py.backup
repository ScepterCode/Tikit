"""
Wallet Balance Service with fallback to user table
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class WalletBalanceService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
        # Fallback to in-memory if wallet_balances table doesn't exist
        self.fallback_balances: Dict[str, float] = {}
    
    async def get_balance(self, user_id: str, wallet_type: str = 'main') -> float:
        """Get wallet balance for user"""
        try:
            # Try wallet_balances table first
            result = self.supabase.table('wallet_balances').select('balance').eq('user_id', user_id).eq('wallet_type', wallet_type).execute()
            if result.data:
                return float(result.data[0]['balance'])
        except Exception:
            # Fallback to users table wallet_balance field
            try:
                result = self.supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
                if result.data:
                    return float(result.data[0]['wallet_balance'])
            except Exception:
                # Final fallback to in-memory
                return self.fallback_balances.get(f"{user_id}_{wallet_type}", 10000.0)
        
        return 10000.0  # Default balance
    
    async def update_balance(self, user_id: str, new_balance: float, wallet_type: str = 'main') -> bool:
        """Update wallet balance"""
        try:
            # Try wallet_balances table first
            result = self.supabase.table('wallet_balances').upsert({
                'user_id': user_id,
                'wallet_type': wallet_type,
                'balance': new_balance
            }).execute()
            return len(result.data) > 0
        except Exception:
            # Fallback to users table
            try:
                result = self.supabase.table('users').update({
                    'wallet_balance': new_balance
                }).eq('id', user_id).execute()
                return len(result.data) > 0
            except Exception:
                # Final fallback to in-memory
                self.fallback_balances[f"{user_id}_{wallet_type}"] = new_balance
                return True

# Global service instance
wallet_balance_service = WalletBalanceService()
