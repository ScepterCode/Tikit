"""
Supabase Client Service
Centralized Supabase client management with connection pooling
"""

import os
from supabase import create_client, Client
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Global client instance
_supabase_client: Optional[Client] = None

def get_supabase_client() -> Client:
    """Get or create Supabase client instance"""
    global _supabase_client
    
    if _supabase_client is None:
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        
        _supabase_client = create_client(supabase_url, supabase_key)
        logger.info("✅ Supabase client initialized")
    
    return _supabase_client

def get_supabase_admin_client() -> Client:
    """Get Supabase client with admin privileges"""
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_service_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_service_key:
        raise ValueError("Admin Supabase credentials not configured")
    
    return create_client(supabase_url, supabase_service_key)

class SupabaseService:
    """Enhanced Supabase service with common operations"""
    
    def __init__(self):
        self.client = get_supabase_client()
    
    async def execute_query(self, query: str, params: dict = None):
        """Execute raw SQL query"""
        try:
            if params:
                result = self.client.rpc('execute_sql', {'query': query, 'params': params})
            else:
                result = self.client.rpc('execute_sql', {'query': query})
            return result.execute()
        except Exception as e:
            logger.error(f"Query execution failed: {e}")
            raise
    
    async def get_user_by_id(self, user_id: str):
        """Get user by ID"""
        result = self.client.table('users').select('*').eq('id', user_id).execute()
        return result.data[0] if result.data else None
    
    async def get_user_by_phone(self, phone_number: str):
        """Get user by phone number"""
        result = self.client.table('users').select('*').eq('phone_number', phone_number).execute()
        return result.data[0] if result.data else None
    
    async def create_user(self, user_data: dict):
        """Create new user"""
        result = self.client.table('users').insert(user_data).execute()
        return result.data[0] if result.data else None
    
    async def update_user(self, user_id: str, updates: dict):
        """Update user data"""
        result = self.client.table('users').update(updates).eq('id', user_id).execute()
        return result.data[0] if result.data else None
    
    async def get_events(self, filters: dict = None, limit: int = 20, offset: int = 0):
        """Get events with optional filters"""
        query = self.client.table('events').select('*')
        
        if filters:
            for key, value in filters.items():
                if value is not None:
                    query = query.eq(key, value)
        
        result = query.range(offset, offset + limit - 1).execute()
        return result.data
    
    async def create_event(self, event_data: dict):
        """Create new event"""
        result = self.client.table('events').insert(event_data).execute()
        return result.data[0] if result.data else None
    
    async def get_tickets(self, user_id: str = None, event_id: str = None):
        """Get tickets with optional filters"""
        query = self.client.table('tickets').select('*, events(*)')
        
        if user_id:
            query = query.eq('user_id', user_id)
        if event_id:
            query = query.eq('event_id', event_id)
        
        result = query.execute()
        return result.data
    
    async def create_ticket(self, ticket_data: dict):
        """Create new ticket"""
        result = self.client.table('tickets').insert(ticket_data).execute()
        return result.data[0] if result.data else None
    
    async def verify_ticket(self, ticket_id: str, verification_data: dict):
        """Verify ticket and update scan history"""
        # Update ticket status
        ticket_result = self.client.table('tickets').update({
            'status': 'used',
            'verified_at': verification_data.get('verified_at'),
            'verified_by': verification_data.get('verified_by')
        }).eq('id', ticket_id).execute()
        
        # Create scan history record
        scan_result = self.client.table('scan_history').insert({
            'ticket_id': ticket_id,
            'scanned_by': verification_data.get('verified_by'),
            'scan_type': verification_data.get('scan_type', 'qr_code'),
            'location': verification_data.get('location'),
            'device_info': verification_data.get('device_info')
        }).execute()
        
        return ticket_result.data[0] if ticket_result.data else None

# Global service instance
supabase_service = SupabaseService()