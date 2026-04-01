"""
Event management service with persistent database storage
"""
from config import config
from typing import Dict, List, Any, Optional
from datetime import datetime
import logging
from services.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# Check if Supabase is configured
SUPABASE_CONFIGURED = bool(config.SUPABASE_URL and config.SUPABASE_SERVICE_KEY)

# For development, let's use mock service to avoid database issues
USE_MOCK_SERVICE = False  # Set to False when Supabase database is properly set up

if SUPABASE_CONFIGURED and not USE_MOCK_SERVICE:
    try:
        class EventService:
            def __init__(self):
                self.supabase = get_supabase_client()
            
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
            
            async def update_event(self, event_id: str, update_data: dict) -> dict:
                """Update event data including ticket tiers"""
                try:
                    # Prepare update data
                    db_update = {}

                    # Handle ticket tiers transformation
                    if 'ticketTiers' in update_data:
                        db_update['ticket_tiers'] = update_data['ticketTiers']

                    # Handle field name transformations for database
                    if 'venue' in update_data:
                        db_update['venue_name'] = update_data['venue']
                        db_update['full_address'] = update_data['venue']
                    
                    # Handle date/time combination
                    if 'date' in update_data and 'time' in update_data:
                        # Combine date and time into ISO format
                        db_update['event_date'] = f"{update_data['date']}T{update_data['time']}:00+00:00"
                    elif 'start_date' in update_data:
                        db_update['event_date'] = update_data['start_date']

                    # Handle other fields (using database field names)
                    # Only include fields that actually exist in the database
                    allowed_fields = [
                        'title', 'description', 'category', 'status', 'banner_image_url',
                        'capacity', 'ticket_price', 'currency'
                    ]
                    for field in allowed_fields:
                        if field in update_data and field not in db_update:
                            db_update[field] = update_data[field]

                    # Add updated_at timestamp
                    db_update['updated_at'] = datetime.utcnow().isoformat()

                    # Update in Supabase
                    result = self.supabase.table('events').update(db_update).eq('id', event_id).execute()

                    if not result.data:
                        return {
                            "success": False,
                            "error": {
                                "code": "UPDATE_FAILED",
                                "message": "Failed to update event"
                            }
                        }

                    return {
                        "success": True,
                        "data": result.data[0]
                    }
                except Exception as e:
                    logger.error(f"Error updating event {event_id}: {str(e)}")
                    return {
                        "success": False,
                        "error": {
                            "code": "UPDATE_ERROR",
                            "message": str(e)
                        }
                    }

            
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
    
            async def get_events_feed(self, user_state: str = 'Lagos', filters: dict = None, page: int = 1, limit: int = 20) -> dict:
                """Get paginated events feed with filtering"""
                try:
                    offset = (page - 1) * limit
                    query = self.supabase.table('events').select('*', count='exact')
                    
                    # Apply filters if provided
                    if filters:
                        if filters.get('event_type'):
                            query = query.eq('category', filters['event_type'])
                        if filters.get('lga'):
                            query = query.ilike('full_address', f'%{filters["lga"]}%')
                        if filters.get('price_min') is not None:
                            query = query.gte('ticket_price', filters['price_min'])
                        if filters.get('price_max') is not None:
                            query = query.lte('ticket_price', filters['price_max'])
                    
                    # Execute query with pagination
                    result = query.range(offset, offset + limit - 1).order('created_at', desc=True).execute()
                    
                    events = result.data or []
                    total_count = result.count if hasattr(result, 'count') else len(events)
                    
                    # Transform database fields to frontend format
                    for event in events:
                        if 'ticket_tiers' in event and event['ticket_tiers']:
                            event['ticketTiers'] = event['ticket_tiers']
                        else:
                            # Fallback: Generate ticket_tiers from legacy fields
                            event['ticketTiers'] = [{
                                'name': 'General Admission',
                                'price': float(event.get('ticket_price', 0)),
                                'quantity': int(event.get('capacity', 0)),
                                'sold': int(event.get('tickets_sold', 0))
                            }]
                        if 'venue_name' in event:
                            event['venue'] = event['venue_name']
                        if 'event_date' in event:
                            event['start_date'] = event['event_date']
                        if 'host_id' in event:
                            event['organizer_id'] = event['host_id']
                    
                    return {
                        "events": events,
                        "total": total_count,
                        "page": page,
                        "limit": limit,
                        "has_next": len(events) == limit,
                        "has_prev": page > 1
                    }
                except Exception as e:
                    logger.error(f"Error getting events feed: {str(e)}")
                    return {
                        "events": [],
                        "total": 0,
                        "page": page,
                        "limit": limit,
                        "has_next": False,
                        "has_prev": False
                    }
            
            async def get_event_by_id(self, event_id: str) -> Optional[dict]:
                """Get event by ID with full details"""
                try:
                    result = self.supabase.table('events').select('*').eq('id', event_id).execute()
                    if not result.data:
                        return None
                    
                    event = result.data[0]
                    
                    # Transform database fields to frontend format
                    if 'ticket_tiers' in event and event['ticket_tiers']:
                        event['ticketTiers'] = event['ticket_tiers']
                    else:
                        # Fallback: Generate ticket_tiers from legacy fields
                        event['ticketTiers'] = [{
                            'name': 'General Admission',
                            'price': float(event.get('ticket_price', 0)),
                            'quantity': int(event.get('capacity', 0)),
                            'sold': int(event.get('tickets_sold', 0))
                        }]
                    
                    # Transform field names to match frontend expectations
                    if 'venue_name' in event:
                        event['venue'] = event['venue_name']
                    if 'event_date' in event:
                        event['start_date'] = event['event_date']
                    if 'host_id' in event:
                        event['organizer_id'] = event['host_id']
                    
                    return event
                except Exception as e:
                    logger.error(f"Error getting event {event_id}: {str(e)}")
                    return None
            
            async def create_event(self, event_data: dict, organizer_id: str) -> dict:
                """Create a new event"""
                try:
                    # Transform frontend field names to database field names
                    if 'ticketTiers' in event_data:
                        event_data['ticket_tiers'] = event_data.pop('ticketTiers')
                    
                    # Add organizer ID and timestamps
                    event_data['organizer_id'] = organizer_id
                    event_data['host_id'] = organizer_id  # Also set host_id for consistency
                    event_data['created_at'] = datetime.utcnow().isoformat()
                    event_data['updated_at'] = datetime.utcnow().isoformat()
                    event_data.setdefault('status', 'active')
                    event_data.setdefault('is_hidden', False)
                    
                    # Remove fields that don't exist in database
                    event_data.pop('current_attendees', None)
                    
                    result = self.supabase.table('events').insert(event_data).execute()
                    
                    if result.data:
                        return {
                            "success": True,
                            "message": "Event created successfully",
                            "event_id": result.data[0]['id']
                        }
                    else:
                        return {
                            "success": False,
                            "error": {
                                "code": "CREATE_FAILED",
                                "message": "Failed to create event"
                            }
                        }
                except Exception as e:
                    logger.error(f"Error creating event: {str(e)}")
                    return {
                        "success": False,
                        "error": {
                            "code": "INTERNAL_ERROR",
                            "message": str(e)
                        }
                    }
            
            async def create_hidden_event(self, event_data: dict, organizer_id: str) -> dict:
                """Create a hidden/private event with access code"""
                try:
                    import secrets
                    import string
                    
                    # Generate access code
                    access_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
                    
                    # Add hidden event specific data
                    event_data['organizer_id'] = organizer_id
                    event_data['created_at'] = datetime.utcnow().isoformat()
                    event_data['updated_at'] = datetime.utcnow().isoformat()
                    event_data['is_hidden'] = True
                    event_data['access_code'] = access_code
                    event_data.setdefault('current_attendees', 0)
                    event_data.setdefault('status', 'active')
                    
                    result = self.supabase.table('events').insert(event_data).execute()
                    
                    if result.data:
                        return {
                            "success": True,
                            "message": "Hidden event created successfully",
                            "event_id": result.data[0]['id'],
                            "access_code": access_code
                        }
                    else:
                        return {
                            "success": False,
                            "error": {
                                "code": "CREATE_FAILED",
                                "message": "Failed to create hidden event"
                            }
                        }
                except Exception as e:
                    logger.error(f"Error creating hidden event: {str(e)}")
                    return {
                        "success": False,
                        "error": {
                            "code": "INTERNAL_ERROR",
                            "message": str(e)
                        }
                    }
            
            async def validate_access_code(self, access_code: str) -> dict:
                """Validate access code for hidden events"""
                try:
                    result = self.supabase.table('events').select('id, title').eq('access_code', access_code).eq('is_hidden', True).execute()
                    
                    if result.data:
                        event = result.data[0]
                        return {
                            "success": True,
                            "message": "Access code is valid",
                            "event_id": event['id'],
                            "event_title": event['title']
                        }
                    else:
                        return {
                            "success": False,
                            "error": {
                                "code": "INVALID_ACCESS_CODE",
                                "message": "Invalid access code"
                            }
                        }
                except Exception as e:
                    logger.error(f"Error validating access code: {str(e)}")
                    return {
                        "success": False,
                        "error": {
                            "code": "INTERNAL_ERROR",
                            "message": str(e)
                        }
                    }
        
        # Global service instance
        event_service = EventService()
        logger.info("✅ Using Supabase EventService")
        
    except Exception as e:
        logger.error(f"Failed to initialize Supabase EventService: {e}")
        SUPABASE_CONFIGURED = False

if not SUPABASE_CONFIGURED or USE_MOCK_SERVICE:
    # Use mock service when Supabase is not configured
    from services.mock_event_service import mock_event_service
    event_service = mock_event_service
    logger.info("⚠️ Using Mock EventService (Supabase not configured)")
