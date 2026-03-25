"""
User management service with persistent database storage
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import bcrypt
import logging

logger = logging.getLogger(__name__)

class UserService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_user(self, user_data: dict) -> dict:
        """Create a new user in the database"""
        try:
            # Hash password if provided
            if 'password' in user_data:
                password_hash = bcrypt.hashpw(
                    user_data['password'].encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                user_data['password_hash'] = password_hash
                del user_data['password']
            
            # Set default values
            user_data.setdefault('role', 'attendee')
            user_data.setdefault('wallet_balance', 10000.00)
            user_data.setdefault('is_verified', False)
            
            result = self.supabase.table('users').insert(user_data).execute()
            
            if result.data:
                logger.info(f"User created successfully: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to create user")
                return None
                
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return None
    
    async def get_user(self, user_id: str) -> Optional[dict]:
        """Get user by ID"""
        try:
            result = self.supabase.table('users').select('*').eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user {user_id}: {str(e)}")
            return None
    
    async def get_user_by_email(self, email: str) -> Optional[dict]:
        """Get user by email"""
        try:
            result = self.supabase.table('users').select('*').eq('email', email).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting user by email {email}: {str(e)}")
            return None
    
    async def update_user(self, user_id: str, update_data: dict) -> Optional[dict]:
        """Update user data"""
        try:
            # Hash password if being updated
            if 'password' in update_data:
                password_hash = bcrypt.hashpw(
                    update_data['password'].encode('utf-8'), 
                    bcrypt.gensalt()
                ).decode('utf-8')
                update_data['password_hash'] = password_hash
                del update_data['password']
            
            result = self.supabase.table('users').update(update_data).eq('id', user_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating user {user_id}: {str(e)}")
            return None
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        try:
            result = self.supabase.table('users').delete().eq('id', user_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {str(e)}")
            return False
    
    async def list_users(self, limit: int = 100, offset: int = 0) -> List[dict]:
        """List all users with pagination"""
        try:
            result = self.supabase.table('users').select('*').range(offset, offset + limit - 1).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing users: {str(e)}")
            return []
    
    async def verify_password(self, user_id: str, password: str) -> bool:
        """Verify user password"""
        try:
            user = await self.get_user(user_id)
            if not user or not user.get('password_hash'):
                return False
            
            return bcrypt.checkpw(
                password.encode('utf-8'), 
                user['password_hash'].encode('utf-8')
            )
        except Exception as e:
            logger.error(f"Error verifying password for user {user_id}: {str(e)}")
            return False
    
    async def update_wallet_balance(self, user_id: str, new_balance: float) -> bool:
        """Update user wallet balance"""
        try:
            result = self.supabase.table('users').update({
                'wallet_balance': new_balance
            }).eq('id', user_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error updating wallet balance for user {user_id}: {str(e)}")
            return False

# Global service instance
user_service = UserService()
