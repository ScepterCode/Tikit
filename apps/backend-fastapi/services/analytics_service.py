"""
Analytics Service using interaction_logs and message_logs tables
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def log_interaction(self, phone: str, kind: str, context: str, 
                            options: dict = None, selected_id: str = None) -> Optional[dict]:
        """Log user interaction"""
        try:
            interaction_data = {
                "phone": phone,
                "kind": kind,
                "context": context,
                "options": options or {},
                "selected_id": selected_id
            }
            
            result = self.supabase.table('interaction_logs').insert(interaction_data).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error logging interaction: {str(e)}")
            return None
    
    async def log_message(self, phone: str, direction: str, message_type: str, 
                        content: str, whatsapp_message_id: str = None) -> Optional[dict]:
        """Log message"""
        try:
            message_data = {
                "phone": phone,
                "direction": direction,
                "message_type": message_type,
                "content": content,
                "whatsapp_message_id": whatsapp_message_id
            }
            
            result = self.supabase.table('message_logs').insert(message_data).execute()
            
            if result.data:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"Error logging message: {str(e)}")
            return None
    
    async def get_user_interactions(self, phone: str, limit: int = 100) -> List[dict]:
        """Get user interactions"""
        try:
            result = self.supabase.table('interaction_logs').select('*').eq('phone', phone).order('created_at', desc=True).limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error getting interactions: {str(e)}")
            return []
    
    async def get_analytics_summary(self) -> Dict[str, Any]:
        """Get analytics summary"""
        try:
            # Get interaction counts
            interactions_result = self.supabase.table('interaction_logs').select('kind').execute()
            interactions = interactions_result.data or []
            
            # Get message counts
            messages_result = self.supabase.table('message_logs').select('direction').execute()
            messages = messages_result.data or []
            
            return {
                "total_interactions": len(interactions),
                "total_messages": len(messages),
                "interaction_types": {},
                "message_directions": {}
            }
            
        except Exception as e:
            logger.error(f"Error getting analytics summary: {str(e)}")
            return {}

# Global service instance
analytics_service = AnalyticsService()
