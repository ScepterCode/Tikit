"""
Database connection and utilities using Supabase
"""
from supabase import create_client, Client
from config import settings
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    def __init__(self):
        self.client: Client = None
        self.service_client: Client = None
        
    def get_client(self) -> Client:
        """Get Supabase client with anon key (for user operations)"""
        if not self.client:
            # Only create client if we have valid credentials
            if (settings.supabase_url and 
                settings.supabase_anon_key and 
                not settings.supabase_url.startswith("https://your-project") and
                not settings.supabase_anon_key.startswith("your-")):
                self.client = create_client(
                    settings.supabase_url,
                    settings.supabase_anon_key
                )
            else:
                logger.warning("Supabase credentials not configured, using mock client")
                self.client = None
        return self.client
    
    def get_service_client(self) -> Client:
        """Get Supabase client with service key (for admin operations)"""
        if not self.service_client:
            # Only create client if we have valid credentials
            if (settings.supabase_url and 
                settings.supabase_service_key and 
                not settings.supabase_url.startswith("https://your-project") and
                not settings.supabase_service_key.startswith("your-")):
                self.service_client = create_client(
                    settings.supabase_url,
                    settings.supabase_service_key
                )
            else:
                logger.warning("Supabase service credentials not configured, using mock client")
                self.service_client = None
        return self.service_client
    
    async def health_check(self) -> bool:
        """Check if Supabase connection is healthy"""
        try:
            client = self.get_client()
            if not client:
                return False
            # Try a simple query to test connection
            result = client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"Supabase health check failed: {e}")
            return False

# Global Supabase client instance
supabase_client = SupabaseClient()