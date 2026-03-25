"""
Updated Notification Service using realtime_notifications table
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_notification(self, user_id: str, title: str, message: str, 
                                notification_type: str = "info", data: dict = None) -> Optional[dict]:
        """Create notification using realtime_notifications table"""
        try:
            notification_data = {
                "user_id": user_id,
                "title": title,
                "message": message,
                "type": notification_type,
                "data": data or {},
                "read": False
            }
            
            result = self.supabase.table('realtime_notifications').insert(notification_data).execute()
            
            if result.data:
                logger.info(f"Notification created: {result.data[0]['id']}")
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error creating notification: {str(e)}")
            return None
    
    async def get_user_notifications(self, user_id: str, limit: int = 50, 
                                   unread_only: bool = False) -> List[dict]:
        """Get notifications for user"""
        try:
            query = self.supabase.table('realtime_notifications').select('*').eq('user_id', user_id)
            
            if unread_only:
                query = query.eq('read', False)
            
            result = query.order('created_at', desc=True).limit(limit).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"Error getting notifications: {str(e)}")
            return []
    
    async def mark_as_read(self, notification_id: str) -> bool:
        """Mark notification as read"""
        try:
            result = self.supabase.table('realtime_notifications').update({
                'read': True
            }).eq('id', notification_id).execute()
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Error marking notification as read: {str(e)}")
            return False

# Global service instance
notification_service = NotificationService()
