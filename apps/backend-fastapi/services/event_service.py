"""
Event management service for creating, retrieving, and managing events
"""
from database import supabase_client
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import secrets
import string
import logging
import math

logger = logging.getLogger(__name__)

class EventService:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
    
    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lon1_rad = math.radians(lon1)
        lat2_rad = math.radians(lat2)
        lon2_rad = math.radians(lon2)
        
        dlat = lat2_rad - lat1_rad
        dlon = lon2_rad - lon1_rad
        
        a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def get_state_center(self, state: str) -> Optional[Dict[str, float]]:
        """Get approximate center coordinates for Nigerian states"""
        state_centers = {
            "Lagos": {"latitude": 6.5244, "longitude": 3.3792},
            "Abuja": {"latitude": 9.0765, "longitude": 7.3986},
            "Kano": {"latitude": 12.0022, "longitude": 8.5920},
            "Rivers": {"latitude": 4.8156, "longitude": 6.9778},
            "Oyo": {"latitude": 8.0000, "longitude": 4.0000},
            "Kaduna": {"latitude": 10.5105, "longitude": 7.4165},
            "Ogun": {"latitude": 7.1608, "longitude": 3.3476},
            "Imo": {"latitude": 5.4840, "longitude": 7.0340},
            "Plateau": {"latitude": 9.2182, "longitude": 9.5179},
            "Akwa Ibom": {"latitude": 5.0077, "longitude": 7.8536},
            # Add more states as needed
        }
        return state_centers.get(state)
    
    async def get_events_feed(
        self, 
        user_state: str, 
        filters: Dict[str, Any] = None,
        page: int = 1,
        limit: int = 20
    ) -> Dict[str, Any]:
        """Get paginated events feed with filtering"""
        try:
            if filters is None:
                filters = {}
            
            offset = (page - 1) * limit
            
            # Build query
            query = self.supabase.table('events').select('''
                *,
                organizer:organizer_id (
                    id,
                    first_name,
                    last_name,
                    role
                )
            ''')
            
            # Apply filters
            query = query.eq('status', 'published')
            query = query.eq('is_hidden', False)
            query = query.gte('start_date', datetime.utcnow().isoformat())
            
            if filters.get('event_type'):
                query = query.eq('event_type', filters['event_type'])
            
            if filters.get('date_from'):
                query = query.gte('start_date', filters['date_from'].isoformat())
            
            if filters.get('date_to'):
                query = query.lte('start_date', filters['date_to'].isoformat())
            
            if filters.get('lga'):
                query = query.eq('lga', filters['lga'])
            
            # Execute query with pagination
            query = query.order('start_date', desc=False)
            query = query.order('created_at', desc=True)
            query = query.range(offset, offset + limit - 1)
            
            result = query.execute()
            
            if not result.data:
                return {
                    'events': [],
                    'total': 0,
                    'page': page,
                    'limit': limit,
                    'has_next': False,
                    'has_prev': page > 1
                }
            
            events = result.data
            
            # Apply geographic filtering if needed
            if filters.get('distance') and user_state:
                state_center = self.get_state_center(user_state)
                if state_center:
                    max_distance = filters['distance']
                    filtered_events = []
                    
                    for event in events:
                        distance = self.calculate_distance(
                            state_center['latitude'],
                            state_center['longitude'],
                            event['latitude'],
                            event['longitude']
                        )
                        if distance <= max_distance:
                            filtered_events.append(event)
                    
                    events = filtered_events
            
            # Get total count for pagination
            count_query = self.supabase.table('events').select('id', count='exact')
            count_query = count_query.eq('status', 'published')
            count_query = count_query.eq('is_hidden', False)
            count_query = count_query.gte('start_date', datetime.utcnow().isoformat())
            
            if filters.get('event_type'):
                count_query = count_query.eq('event_type', filters['event_type'])
            
            count_result = count_query.execute()
            total = count_result.count if count_result.count else len(events)
            
            # Format events
            formatted_events = []
            for event in events:
                # Get tiers
                tiers_result = self.supabase.table('event_tiers').select('*').eq('event_id', event['id']).execute()
                tiers = tiers_result.data or []
                
                # Calculate availability
                sold_tickets = sum(tier.get('sold', 0) for tier in tiers)
                available_tickets = event['capacity'] - sold_tickets
                
                formatted_event = {
                    'id': event['id'],
                    'title': event['title'],
                    'description': event['description'],
                    'event_type': event['event_type'],
                    'start_date': event['start_date'],
                    'end_date': event['end_date'],
                    'venue': event['venue'],
                    'state': event['state'],
                    'lga': event['lga'],
                    'latitude': event['latitude'],
                    'longitude': event['longitude'],
                    'capacity': event['capacity'],
                    'sold_tickets': sold_tickets,
                    'available_tickets': available_tickets,
                    'status': event['status'],
                    'is_hidden': event['is_hidden'],
                    'organizer_id': event['organizer_id'],
                    'organizer_name': f"{event['organizer']['first_name']} {event['organizer']['last_name']}" if event.get('organizer') else 'Unknown',
                    'tiers': [
                        {
                            'id': tier['id'],
                            'name': tier['name'],
                            'price': tier['price'],
                            'quantity': tier['quantity'],
                            'sold': tier.get('sold', 0),
                            'available': tier['quantity'] - tier.get('sold', 0),
                            'description': tier.get('description'),
                            'benefits': tier.get('benefits', [])
                        }
                        for tier in tiers
                    ],
                    'images': event.get('images', []),
                    'cultural_features': event.get('cultural_features'),
                    'created_at': event['created_at'],
                    'updated_at': event['updated_at']
                }
                formatted_events.append(formatted_event)
            
            return {
                'events': formatted_events,
                'total': total,
                'page': page,
                'limit': limit,
                'has_next': (page * limit) < total,
                'has_prev': page > 1
            }
            
        except Exception as e:
            logger.error(f"Get events feed error: {e}")
            return {
                'events': [],
                'total': 0,
                'page': page,
                'limit': limit,
                'has_next': False,
                'has_prev': False
            }
    
    async def get_event_by_id(self, event_id: str) -> Optional[Dict[str, Any]]:
        """Get event by ID with full details"""
        try:
            result = self.supabase.table('events').select('''
                *,
                organizer:organizer_id (
                    id,
                    first_name,
                    last_name,
                    role,
                    organization_name
                )
            ''').eq('id', event_id).execute()
            
            if not result.data:
                return None
            
            event = result.data[0]
            
            # Get tiers
            tiers_result = self.supabase.table('event_tiers').select('*').eq('event_id', event_id).execute()
            tiers = tiers_result.data or []
            
            # Calculate availability
            sold_tickets = sum(tier.get('sold', 0) for tier in tiers)
            available_tickets = event['capacity'] - sold_tickets
            
            return {
                'id': event['id'],
                'title': event['title'],
                'description': event['description'],
                'event_type': event['event_type'],
                'start_date': event['start_date'],
                'end_date': event['end_date'],
                'venue': event['venue'],
                'state': event['state'],
                'lga': event['lga'],
                'latitude': event['latitude'],
                'longitude': event['longitude'],
                'capacity': event['capacity'],
                'sold_tickets': sold_tickets,
                'available_tickets': available_tickets,
                'status': event['status'],
                'is_hidden': event['is_hidden'],
                'access_code': event.get('access_code'),
                'organizer_id': event['organizer_id'],
                'organizer_name': f"{event['organizer']['first_name']} {event['organizer']['last_name']}" if event.get('organizer') else 'Unknown',
                'organizer_organization': event['organizer'].get('organization_name') if event.get('organizer') else None,
                'tiers': [
                    {
                        'id': tier['id'],
                        'name': tier['name'],
                        'price': tier['price'],
                        'quantity': tier['quantity'],
                        'sold': tier.get('sold', 0),
                        'available': tier['quantity'] - tier.get('sold', 0),
                        'description': tier.get('description'),
                        'benefits': tier.get('benefits', [])
                    }
                    for tier in tiers
                ],
                'images': event.get('images', []),
                'cultural_features': event.get('cultural_features'),
                'created_at': event['created_at'],
                'updated_at': event['updated_at']
            }
            
        except Exception as e:
            logger.error(f"Get event by ID error: {e}")
            return None
    
    async def create_event(self, event_data: Dict[str, Any], organizer_id: str) -> Dict[str, Any]:
        """Create a new event"""
        try:
            # Extract tiers from event data
            tiers_data = event_data.pop('tiers', [])
            
            # Prepare event record
            event_record = {
                **event_data,
                'organizer_id': organizer_id,
                'status': 'published',
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
            
            # Create event
            event_result = self.supabase.table('events').insert(event_record).execute()
            
            if not event_result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INTERNAL_ERROR',
                        'message': 'Failed to create event'
                    }
                }
            
            event = event_result.data[0]
            event_id = event['id']
            
            # Create tiers
            if tiers_data:
                tier_records = []
                for tier in tiers_data:
                    tier_record = {
                        'event_id': event_id,
                        'name': tier['name'],
                        'price': tier['price'],
                        'quantity': tier['quantity'],
                        'description': tier.get('description'),
                        'benefits': tier.get('benefits', []),
                        'sold': 0,
                        'created_at': datetime.utcnow().isoformat()
                    }
                    tier_records.append(tier_record)
                
                tiers_result = self.supabase.table('event_tiers').insert(tier_records).execute()
                
                if not tiers_result.data:
                    # Rollback event creation
                    self.supabase.table('events').delete().eq('id', event_id).execute()
                    return {
                        'success': False,
                        'error': {
                            'code': 'INTERNAL_ERROR',
                            'message': 'Failed to create event tiers'
                        }
                    }
            
            return {
                'success': True,
                'message': 'Event created successfully',
                'event_id': event_id
            }
            
        except Exception as e:
            logger.error(f"Create event error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to create event'
                }
            }
    
    async def create_hidden_event(self, event_data: Dict[str, Any], organizer_id: str) -> Dict[str, Any]:
        """Create a hidden event with access code"""
        try:
            # Generate access code if not provided
            if not event_data.get('access_code'):
                event_data['access_code'] = ''.join(secrets.choice(string.digits) for _ in range(4))
            
            event_data['is_hidden'] = True
            
            result = await self.create_event(event_data, organizer_id)
            
            if result['success']:
                result['access_code'] = event_data['access_code']
            
            return result
            
        except Exception as e:
            logger.error(f"Create hidden event error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to create hidden event'
                }
            }
    
    async def validate_access_code(self, access_code: str) -> Dict[str, Any]:
        """Validate access code for hidden event"""
        try:
            result = self.supabase.table('events').select('id, title, access_code').eq('access_code', access_code).eq('is_hidden', True).execute()
            
            if not result.data:
                return {
                    'success': False,
                    'error': {
                        'code': 'INVALID_ACCESS_CODE',
                        'message': 'Invalid access code'
                    }
                }
            
            event = result.data[0]
            
            return {
                'success': True,
                'message': 'Access code valid',
                'event_id': event['id'],
                'event_title': event['title']
            }
            
        except Exception as e:
            logger.error(f"Validate access code error: {e}")
            return {
                'success': False,
                'error': {
                    'code': 'INTERNAL_ERROR',
                    'message': 'Failed to validate access code'
                }
            }

# Global event service instance
event_service = EventService()