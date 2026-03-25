"""
Secret Events Service - Fixed Version
Handles premium-only secret events with invite codes and location reveals
"""
import time
import uuid
import secrets
import string
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# In-memory secret events database
secret_events_database: Dict[str, Dict[str, Any]] = {}
# In-memory invite codes database
invite_codes_database: Dict[str, Dict[str, Any]] = {}
# In-memory anonymous tickets database
anonymous_tickets_database: List[Dict[str, Any]] = []

class SecretEventsService:
    def __init__(self):
        pass
    
    def create_secret_event(
        self, 
        event_data: Dict[str, Any], 
        organizer_id: str,
        premium_tier_required: str = "premium",
        location_reveal_hours: int = 2
    ) -> Dict[str, Any]:
        """Create a secret event with premium requirements"""
        try:
            # Import here to avoid circular imports
            from services.membership_service import membership_service
            
            # Verify organizer has premium access
            membership = membership_service.get_user_membership(organizer_id)
            if not membership_service.check_feature_access(organizer_id, "secret_events"):
                return {
                    "success": False,
                    "error": "Premium membership required to create secret events"
                }
            
            # Generate unique event ID
            event_id = str(uuid.uuid4())
            
            # Generate master invite code (8 characters)
            master_invite_code = self._generate_invite_code()
            
            # Calculate location reveal time
            event_start_time = event_data.get("start_date")
            if isinstance(event_start_time, str):
                # Parse ISO format
                event_start = datetime.fromisoformat(event_start_time.replace('Z', '+00:00'))
            else:
                event_start = datetime.utcnow() + timedelta(days=1)  # Default to tomorrow
            
            location_reveal_time = event_start - timedelta(hours=location_reveal_hours)
            
            # Create secret event record
            secret_event = {
                "id": event_id,
                "organizer_id": organizer_id,
                "title": event_data.get("title", "Secret Event"),
                "description": event_data.get("description", ""),
                "category": event_data.get("category", "secret"),
                "is_secret": True,
                "premium_tier_required": premium_tier_required,
                
                # Location management
                "secret_venue": event_data.get("venue", ""),  # Full address
                "public_venue": event_data.get("public_venue", "Lagos Island"),  # Vague location
                "location_reveal_time": location_reveal_time.timestamp(),
                "location_revealed": False,
                
                # Timing
                "start_date": event_start.isoformat(),
                "end_date": event_data.get("end_date", (event_start + timedelta(hours=4)).isoformat()),
                
                # Invite system
                "master_invite_code": master_invite_code,
                "max_attendees": event_data.get("max_attendees", 100),
                "current_attendees": 0,
                
                # Privacy settings
                "anonymous_purchases_allowed": event_data.get("anonymous_purchases_allowed", True),
                "attendee_list_hidden": event_data.get("attendee_list_hidden", True),
                
                # Ticket tiers (can be anonymous)
                "ticket_tiers": event_data.get("ticket_tiers", [
                    {
                        "id": str(uuid.uuid4()),
                        "name": "Secret Access",
                        "price": event_data.get("price", 5000),
                        "quantity": event_data.get("max_attendees", 100),
                        "sold": 0,
                        "anonymous_allowed": True
                    }
                ]),
                
                # Metadata
                "created_at": time.time(),
                "updated_at": time.time(),
                "status": "active"
            }
            
            # Store secret event
            secret_events_database[event_id] = secret_event
            
            # Create master invite code record
            self._create_invite_code(
                event_id=event_id,
                code=master_invite_code,
                created_by=organizer_id,
                max_uses=event_data.get("max_attendees", 100),
                expires_at=event_start.timestamp()
            )
            
            return {
                "success": True,
                "message": "Secret event created successfully",
                "data": {
                    "event_id": event_id,
                    "master_invite_code": master_invite_code,
                    "location_reveal_time": location_reveal_time.isoformat(),
                    "public_venue": secret_event["public_venue"]
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create secret event: {str(e)}"
            }
    
    def get_secret_events_for_user(self, user_id: str) -> Dict[str, Any]:
        """Get secret events accessible to user based on membership"""
        try:
            from services.membership_service import membership_service
            
            membership = membership_service.get_user_membership(user_id)
            user_tier = membership["tier"]
            
            accessible_events = []
            
            for event_id, event in secret_events_database.items():
                # Check if user meets tier requirement
                required_tier = event["premium_tier_required"]
                
                if required_tier == "premium" and user_tier in ["premium", "vip"]:
                    accessible_events.append(self._prepare_event_for_user(event, user_id))
                elif required_tier == "vip" and user_tier == "vip":
                    accessible_events.append(self._prepare_event_for_user(event, user_id))
            
            return {
                "success": True,
                "data": {
                    "events": accessible_events,
                    "user_tier": user_tier,
                    "total_accessible": len(accessible_events)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get secret events: {str(e)}"
            }
    
    def _generate_invite_code(self, length: int = 8) -> str:
        """Generate unique invite code"""
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
            # Ensure uniqueness
            if not any(record["code"] == code for record in invite_codes_database.values()):
                return code
    
    def _create_invite_code(
        self, 
        event_id: str, 
        code: str, 
        created_by: str, 
        max_uses: int = 1,
        expires_at: float = None
    ) -> str:
        """Create invite code record"""
        code_id = str(uuid.uuid4())
        
        invite_codes_database[code_id] = {
            "id": code_id,
            "event_id": event_id,
            "code": code,
            "created_by": created_by,
            "max_uses": max_uses,
            "used_count": 0,
            "expires_at": expires_at,
            "created_at": time.time(),
            "last_used_at": None,
            "last_used_by": None
        }
        
        return code_id
    
    def validate_invite_code(self, invite_code: str, user_id: str) -> Dict[str, Any]:
        """Validate invite code and return event details"""
        try:
            from services.membership_service import membership_service
            
            # Find invite code record
            code_record = None
            for record in invite_codes_database.values():
                if record["code"] == invite_code:
                    code_record = record
                    break
            
            if not code_record:
                return {
                    "success": False,
                    "error": "Invalid invite code"
                }
            
            # Check if code is expired
            if code_record["expires_at"] and time.time() > code_record["expires_at"]:
                return {
                    "success": False,
                    "error": "Invite code has expired"
                }
            
            # Check if code has reached max uses
            if code_record["used_count"] >= code_record["max_uses"]:
                return {
                    "success": False,
                    "error": "Invite code has reached maximum uses"
                }
            
            # Get the event
            event_id = code_record["event_id"]
            event = secret_events_database.get(event_id)
            
            if not event:
                return {
                    "success": False,
                    "error": "Event not found"
                }
            
            # Check user's membership tier
            membership = membership_service.get_user_membership(user_id)
            user_tier = membership["tier"]
            required_tier = event["premium_tier_required"]
            
            if required_tier == "premium" and user_tier not in ["premium", "vip"]:
                return {
                    "success": False,
                    "error": "Premium membership required for this secret event"
                }
            elif required_tier == "vip" and user_tier != "vip":
                return {
                    "success": False,
                    "error": "VIP membership required for this secret event"
                }
            
            # Update code usage
            code_record["used_count"] += 1
            code_record["last_used_at"] = time.time()
            code_record["last_used_by"] = user_id
            
            # Prepare event data for user
            event_data = self._prepare_event_for_user(event, user_id)
            
            return {
                "success": True,
                "message": "Invite code validated successfully",
                "data": {
                    "event": event_data,
                    "invite_code": invite_code,
                    "remaining_uses": code_record["max_uses"] - code_record["used_count"]
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to validate invite code: {str(e)}"
            }

    def purchase_anonymous_ticket(
        self, 
        event_id: str, 
        tier_id: str, 
        user_id: str,
        is_anonymous: bool = True,
        buyer_email: Optional[str] = None
    ) -> Dict[str, Any]:
        """Purchase anonymous ticket for secret event"""
        try:
            # Get event
            event = secret_events_database.get(event_id)
            if not event:
                return {
                    "success": False,
                    "error": "Secret event not found"
                }
            
            # Check if anonymous purchases are allowed
            if is_anonymous and not event["anonymous_purchases_allowed"]:
                return {
                    "success": False,
                    "error": "Anonymous purchases not allowed for this event"
                }
            
            # Find ticket tier
            tier = None
            for t in event["ticket_tiers"]:
                if t["id"] == tier_id:
                    tier = t
                    break
            
            if not tier:
                return {
                    "success": False,
                    "error": "Ticket tier not found"
                }
            
            # Check availability
            if tier["sold"] >= tier["quantity"]:
                return {
                    "success": False,
                    "error": "Ticket tier sold out"
                }
            
            # Check event capacity
            if event["current_attendees"] >= event["max_attendees"]:
                return {
                    "success": False,
                    "error": "Event is at maximum capacity"
                }
            
            # Create anonymous ticket
            ticket_id = str(uuid.uuid4())
            ticket = {
                "id": ticket_id,
                "event_id": event_id,
                "tier_id": tier_id,
                "tier_name": tier["name"],
                "price": tier["price"],
                "buyer_id": user_id if not is_anonymous else None,
                "buyer_email": buyer_email,
                "is_anonymous": is_anonymous,
                "purchase_code": self._generate_invite_code(12),  # Longer code for tickets
                "status": "active",
                "purchased_at": time.time()
            }
            
            # Store ticket
            anonymous_tickets_database.append(ticket)
            
            # Update tier and event counts
            tier["sold"] += 1
            event["current_attendees"] += 1
            event["updated_at"] = time.time()
            
            return {
                "success": True,
                "message": "Anonymous ticket purchased successfully",
                "data": {
                    "ticket": ticket,
                    "event_title": event["title"],
                    "access_instructions": "Present your purchase code at the event entrance"
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to purchase ticket: {str(e)}"
            }
    
    def _prepare_event_for_user(self, event: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Prepare event data for user (handle location reveal)"""
        from services.membership_service import membership_service
        
        event_data = event.copy()
        
        # Check if location should be revealed
        current_time = time.time()
        location_reveal_time = event["location_reveal_time"]
        
        # VIP users get early access to location
        membership = membership_service.get_user_membership(user_id)
        is_vip = membership["tier"] == "vip"
        
        # VIP gets location 1 hour earlier
        effective_reveal_time = location_reveal_time - (3600 if is_vip else 0)
        
        if current_time < effective_reveal_time:
            # Hide exact location
            event_data["venue"] = event["public_venue"]
            event_data["location_revealed"] = False
            event_data["location_reveal_countdown"] = int(effective_reveal_time - current_time)
        else:
            # Reveal exact location
            event_data["venue"] = event["secret_venue"]
            event_data["location_revealed"] = True
            event_data["location_reveal_countdown"] = 0
        
        return event_data

# Global service instance
secret_events_service = SecretEventsService()