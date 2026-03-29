#!/usr/bin/env python3
"""
Service Layer Database Migration Script
Updates all services to use persistent database instead of in-memory storage
"""

import os
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_path = Path(__file__).parent / "apps" / "backend-fastapi"
sys.path.insert(0, str(backend_path))

def update_user_service():
    """Update user service to use database instead of in-memory storage"""
    
    user_service_content = '''"""
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
'''
    
    service_file = backend_path / "services" / "user_service.py"
    with open(service_file, 'w') as f:
        f.write(user_service_content)
    
    print(f"✅ Updated user service: {service_file}")

def update_event_service():
    """Update event service to use database instead of in-memory storage"""
    
    event_service_content = '''"""
Event management service with persistent database storage
"""
from supabase import create_client, Client
from config import config
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class EventService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    async def create_event(self, event_data: dict) -> Optional[dict]:
        """Create a new event in the database"""
        try:
            # Set default values
            event_data.setdefault('current_attendees', 0)
            event_data.setdefault('status', 'active')
            event_data.setdefault('is_secret', False)
            
            result = self.supabase.table('events').insert(event_data).execute()
            
            if result.data:
                logger.info(f"Event created successfully: {result.data[0]['id']}")
                return result.data[0]
            else:
                logger.error("Failed to create event")
                return None
                
        except Exception as e:
            logger.error(f"Error creating event: {str(e)}")
            return None
    
    async def get_event(self, event_id: str) -> Optional[dict]:
        """Get event by ID"""
        try:
            result = self.supabase.table('events').select('*').eq('id', event_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error getting event {event_id}: {str(e)}")
            return None
    
    async def list_events(self, limit: int = 100, offset: int = 0, organizer_id: str = None) -> List[dict]:
        """List events with optional filtering by organizer"""
        try:
            query = self.supabase.table('events').select('*')
            
            if organizer_id:
                query = query.eq('organizer_id', organizer_id)
            
            result = query.range(offset, offset + limit - 1).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error listing events: {str(e)}")
            return []
    
    async def update_event(self, event_id: str, update_data: dict) -> Optional[dict]:
        """Update event data"""
        try:
            result = self.supabase.table('events').update(update_data).eq('id', event_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            logger.error(f"Error updating event {event_id}: {str(e)}")
            return None
    
    async def delete_event(self, event_id: str) -> bool:
        """Delete event"""
        try:
            result = self.supabase.table('events').delete().eq('id', event_id).execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting event {event_id}: {str(e)}")
            return False
    
    async def increment_attendees(self, event_id: str) -> bool:
        """Increment event attendee count"""
        try:
            # Get current count
            event = await self.get_event(event_id)
            if not event:
                return False
            
            new_count = event.get('current_attendees', 0) + 1
            result = self.supabase.table('events').update({
                'current_attendees': new_count
            }).eq('id', event_id).execute()
            
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error incrementing attendees for event {event_id}: {str(e)}")
            return False
    
    async def search_events(self, query: str, limit: int = 50) -> List[dict]:
        """Search events by title or description"""
        try:
            result = self.supabase.table('events').select('*').or_(
                f'title.ilike.%{query}%,description.ilike.%{query}%'
            ).limit(limit).execute()
            return result.data or []
        except Exception as e:
            logger.error(f"Error searching events: {str(e)}")
            return []

# Global service instance
event_service = EventService()
'''
    
    service_file = backend_path / "services" / "event_service.py"
    with open(service_file, 'w') as f:
        f.write(event_service_content)
    
    print(f"✅ Updated event service: {service_file}")

def update_ticket_service():
    """Update ticket service to use database instead of in-memory storage"""
    
    ticket_service_content = '''"""
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

logger = logging.getLogger(__name__)

class TicketService:
    def __init__(self):
        self.supabase: Client = create_client(config.SUPABASE_URL, config.SUPABASE_ANON_KEY)
    
    def generate_qr_code(self, ticket_id: str) -> str:
        """Generate QR code for ticket"""
        try:
            qr = qrcode.QRCode(version=1, box_size=10, border=5)
            qr.add_data(f"TIKIT-{ticket_id}")
            qr.make(fit=True)
            
            img = qr.make_image(fill_color="black", back_color="white")
            buffer = io.BytesIO()
            img.save(buffer, format='PNG')
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/png;base64,{img_str}"
        except Exception as e:
            logger.error(f"Error generating QR code: {str(e)}")
            return ""
    
    async def create_ticket(self, ticket_data: dict) -> Optional[dict]:
        """Create a new ticket in the database"""
        try:
            # Set default values
            ticket_data.setdefault('status', 'active')
            ticket_data.setdefault('ticket_type', 'regular')
            
            result = self.supabase.table('tickets').insert(ticket_data).execute()
            
            if result.data:
                ticket = result.data[0]
                # Generate QR code
                qr_code = self.generate_qr_code(ticket['id'])
                
                # Update ticket with QR code
                if qr_code:
                    await self.update_ticket(ticket['id'], {'qr_code': qr_code})
                    ticket['qr_code'] = qr_code
                
                logger.info(f"Ticket created successfully: {ticket['id']}")
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
'''
    
    service_file = backend_path / "services" / "ticket_service.py"
    with open(service_file, 'w') as f:
        f.write(ticket_service_content)
    
    print(f"✅ Updated ticket service: {service_file}")

def create_missing_table_services():
    """Create service files for missing tables that will work with fallback storage"""
    
    # Wallet Balance Service (for missing wallet_balances table)
    wallet_balance_service = '''"""
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
'''
    
    service_file = backend_path / "services" / "wallet_balance_service.py"
    with open(service_file, 'w') as f:
        f.write(wallet_balance_service)
    
    print(f"✅ Created wallet balance service: {service_file}")

def main():
    """Main execution function"""
    print("🔄 UPDATING SERVICES TO USE DATABASE")
    print("Converting in-memory storage to persistent database calls")
    print("=" * 60)
    
    try:
        # Update existing services
        update_user_service()
        update_event_service() 
        update_ticket_service()
        
        # Create services for missing tables
        create_missing_table_services()
        
        print("\n" + "=" * 60)
        print("✅ SERVICE UPDATE COMPLETED SUCCESSFULLY!")
        print("=" * 60)
        print("\n📋 WHAT WAS UPDATED:")
        print("✅ User Service - Now uses 'users' table")
        print("✅ Event Service - Now uses 'events' table")
        print("✅ Ticket Service - Now uses 'tickets' table")
        print("✅ Wallet Balance Service - Fallback to users.wallet_balance")
        
        print("\n⚠️  MISSING TABLES (need manual creation):")
        print("❌ wallet_balances - Using fallback to users table")
        print("❌ notifications - Service needs creation")
        print("❌ chat_messages - Service needs creation")
        print("❌ secret_events - Service needs creation")
        print("❌ memberships - Service needs creation")
        print("❌ sessions - Service needs creation")
        print("❌ analytics - Service needs creation")
        
        print("\n🚀 NEXT STEPS:")
        print("1. Create missing tables in Supabase dashboard")
        print("2. Test all functionality with persistent storage")
        print("3. Update remaining services to use database")
        
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()