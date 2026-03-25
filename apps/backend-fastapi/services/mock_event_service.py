"""
Mock Event Service for Development
Provides sample data when Supabase is not configured
"""
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

class MockEventService:
    def __init__(self):
        self.mock_events = [
            {
                "id": "event-1",
                "title": "Tech Conference 2026",
                "description": "Annual technology conference featuring the latest innovations",
                "event_type": "general",
                "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=31)).isoformat(),
                "venue": "Lagos Convention Center",
                "lga": "Victoria Island",
                "state": "Lagos",
                "latitude": 6.4281,
                "longitude": 3.4219,
                "capacity": 200,
                "sold_tickets": 45,
                "available_tickets": 155,
                "status": "active",
                "is_hidden": False,
                "organizer_id": "org-1",
                "organizer_name": "Tech Events Ltd",
                "tiers": [
                    {
                        "id": "tier-1",
                        "name": "Regular",
                        "price": 15000.0,
                        "quantity": 150,
                        "description": "Regular admission",
                        "benefits": ["Access to all sessions"],
                        "sold": 35,
                        "available": 115
                    },
                    {
                        "id": "tier-2", 
                        "name": "VIP",
                        "price": 25000.0,
                        "quantity": 50,
                        "description": "VIP admission with perks",
                        "benefits": ["Access to all sessions", "VIP lounge", "Networking dinner"],
                        "sold": 10,
                        "available": 40
                    }
                ],
                "images": ["https://example.com/tech-conf.jpg"],
                "cultural_features": None,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "event-2", 
                "title": "Music Festival Lagos",
                "description": "Three-day music festival with top Nigerian artists",
                "event_type": "festival",
                "start_date": (datetime.now() + timedelta(days=45)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=47)).isoformat(),
                "venue": "Tafawa Balewa Square",
                "lga": "Lagos Island",
                "state": "Lagos",
                "latitude": 6.4541,
                "longitude": 3.3947,
                "capacity": 500,
                "sold_tickets": 120,
                "available_tickets": 380,
                "status": "active",
                "is_hidden": False,
                "organizer_id": "org-2",
                "organizer_name": "Music Promoters Inc",
                "tiers": [
                    {
                        "id": "tier-3",
                        "name": "General Admission",
                        "price": 8000.0,
                        "quantity": 400,
                        "description": "General festival access",
                        "benefits": ["3-day access", "Food court access"],
                        "sold": 100,
                        "available": 300
                    },
                    {
                        "id": "tier-4",
                        "name": "VIP Experience",
                        "price": 20000.0,
                        "quantity": 100,
                        "description": "Premium festival experience",
                        "benefits": ["3-day access", "VIP area", "Meet & greet", "Premium food"],
                        "sold": 20,
                        "available": 80
                    }
                ],
                "images": ["https://example.com/music-fest.jpg"],
                "cultural_features": None,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            },
            {
                "id": "event-3",
                "title": "Business Networking Event",
                "description": "Connect with entrepreneurs and business leaders",
                "event_type": "general",
                "start_date": (datetime.now() + timedelta(days=15)).isoformat(),
                "end_date": (datetime.now() + timedelta(days=15, hours=6)).isoformat(),
                "venue": "Radisson Blu Hotel",
                "lga": "Ikeja",
                "state": "Lagos",
                "latitude": 6.5964,
                "longitude": 3.3515,
                "capacity": 100,
                "sold_tickets": 25,
                "available_tickets": 75,
                "status": "active",
                "is_hidden": False,
                "organizer_id": "org-1",
                "organizer_name": "Business Network Lagos",
                "tiers": [
                    {
                        "id": "tier-5",
                        "name": "Standard",
                        "price": 5000.0,
                        "quantity": 100,
                        "description": "Standard networking access",
                        "benefits": ["Networking session", "Light refreshments"],
                        "sold": 25,
                        "available": 75
                    }
                ],
                "images": ["https://example.com/business-network.jpg"],
                "cultural_features": None,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat()
            }
        ]
    
    async def get_events_feed(self, user_state: str = 'Lagos', filters: dict = None, page: int = 1, limit: int = 20) -> dict:
        """Get paginated events feed with filtering"""
        try:
            # Apply basic filtering
            events = self.mock_events.copy()
            
            if filters:
                if filters.get('event_type'):
                    events = [e for e in events if e['event_type'] == filters['event_type']]
                if filters.get('lga'):
                    events = [e for e in events if e['lga'] == filters['lga']]
                if filters.get('price_min') is not None:
                    events = [e for e in events if e['price'] >= filters['price_min']]
                if filters.get('price_max') is not None:
                    events = [e for e in events if e['price'] <= filters['price_max']]
            
            # Apply pagination
            start_idx = (page - 1) * limit
            end_idx = start_idx + limit
            paginated_events = events[start_idx:end_idx]
            
            return {
                "events": paginated_events,
                "total": len(events),
                "page": page,
                "limit": limit,
                "has_next": end_idx < len(events),
                "has_prev": page > 1
            }
        except Exception as e:
            logger.error(f"Error getting mock events feed: {str(e)}")
            return {
                "events": [],
                "total": 0,
                "page": page,
                "limit": limit,
                "has_next": False,
                "has_prev": False
            }
    
    async def get_event_by_id(self, event_id: str) -> Optional[dict]:
        """Get event by ID"""
        try:
            for event in self.mock_events:
                if event['id'] == event_id:
                    return event
            return None
        except Exception as e:
            logger.error(f"Error getting mock event {event_id}: {str(e)}")
            return None
    
    async def create_event(self, event_data: dict, organizer_id: str) -> dict:
        """Create a new event (mock)"""
        try:
            new_event = {
                "id": f"event-{len(self.mock_events) + 1}",
                "organizer_id": organizer_id,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "current_attendees": 0,
                "status": "active",
                "is_hidden": False,
                **event_data
            }
            
            self.mock_events.append(new_event)
            
            return {
                "success": True,
                "message": "Event created successfully (mock)",
                "event_id": new_event['id']
            }
        except Exception as e:
            logger.error(f"Error creating mock event: {str(e)}")
            return {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
    
    async def create_hidden_event(self, event_data: dict, organizer_id: str) -> dict:
        """Create a hidden event (mock)"""
        try:
            import secrets
            import string
            
            access_code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))
            
            new_event = {
                "id": f"event-{len(self.mock_events) + 1}",
                "organizer_id": organizer_id,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
                "is_hidden": True,
                "access_code": access_code,
                "current_attendees": 0,
                "status": "active",
                **event_data
            }
            
            self.mock_events.append(new_event)
            
            return {
                "success": True,
                "message": "Hidden event created successfully (mock)",
                "event_id": new_event['id'],
                "access_code": access_code
            }
        except Exception as e:
            logger.error(f"Error creating mock hidden event: {str(e)}")
            return {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
    
    async def validate_access_code(self, access_code: str) -> dict:
        """Validate access code (mock)"""
        try:
            for event in self.mock_events:
                if event.get('access_code') == access_code and event.get('is_hidden'):
                    return {
                        "success": True,
                        "message": "Access code is valid (mock)",
                        "event_id": event['id'],
                        "event_title": event['title']
                    }
            
            return {
                "success": False,
                "error": {
                    "code": "INVALID_ACCESS_CODE",
                    "message": "Invalid access code"
                }
            }
        except Exception as e:
            logger.error(f"Error validating mock access code: {str(e)}")
            return {
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }

# Global mock service instance
mock_event_service = MockEventService()