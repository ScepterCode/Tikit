"""
Secret Events Service - Supabase Version
Handles premium-only secret events with:
- Progressive location reveals
- Discovery feed
- VIP early access
- Smart notifications
"""
import uuid
import secrets
import string
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from database import supabase_client
import logging

logger = logging.getLogger(__name__)

class SecretEventsService:
    def __init__(self):
        self.supabase = supabase_client.get_service_client()
    
    def _generate_invite_code(self, length: int = 8) -> str:
        """Generate unique invite code"""
        while True:
            code = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(length))
            # Check uniqueness in database
            result = self.supabase.table('secret_event_invites').select('id').eq('code', code).execute()
            if not result.data:
                return code
    
    def _calculate_progressive_hints(
        self, 
        secret_venue: str, 
        public_venue: str = "Lagos Island"
    ) -> Dict[str, str]:
        """
        Calculate progressive location hints
        Feature #1: Progressive Location Reveal
        """
        # Parse address components (simple heuristic)
        parts = secret_venue.split(',')
        
        hints = {
            'hint_24h': public_venue,  # Very vague
            'hint_12h': parts[-1].strip() if len(parts) > 0 else public_venue,  # Area/City
            'hint_6h': parts[-2].strip() if len(parts) > 1 else public_venue,  # Street/District
            'hint_2h': secret_venue  # Full address
        }
        
        return hints
    
    def get_location_hint(
        self, 
        secret_event: Dict[str, Any], 
        user_tier: str, 
        current_time: datetime = None
    ) -> Dict[str, Any]:
        """
        Get appropriate location hint based on time and user tier
        Feature #1: Progressive Location Reveal
        Feature #4: VIP Early Access (1 hour earlier)
        """
        if current_time is None:
            current_time = datetime.utcnow()
        
        # Parse event start time
        event_start = datetime.fromisoformat(secret_event['location_reveal_time'].replace('Z', '+00:00'))
        time_until_reveal = (event_start - current_time).total_seconds()
        
        # VIP gets 1 hour (3600 seconds) early access
        vip_bonus = 3600 if user_tier == 'vip' else 0
        
        # Determine which hint to show
        if time_until_reveal > 86400:  # 24+ hours
            hint = secret_event.get('location_hint_24h', 'Lagos Island')
            stage = '24h'
        elif time_until_reveal > 43200:  # 12-24 hours
            hint = secret_event.get('location_hint_12h', 'Victoria Island Area')
            stage = '12h'
        elif time_until_reveal > 21600:  # 6-12 hours
            hint = secret_event.get('location_hint_6h', 'Adeola Odeku Street')
            stage = '6h'
        elif time_until_reveal > (7200 - vip_bonus):  # 2-6 hours (or 3 for VIP)
            hint = secret_event.get('location_hint_2h', secret_event['secret_venue'])
            stage = '2h' if user_tier != 'vip' else '3h_vip'
        else:
            # Full reveal
            hint = secret_event['secret_venue']
            stage = 'revealed'
        
        return {
            'location': hint,
            'stage': stage,
            'is_revealed': stage == 'revealed',
            'countdown_seconds': max(0, int(time_until_reveal - vip_bonus)),
            'vip_early_access': user_tier == 'vip' and stage == '3h_vip'
        }
    
    async def create_secret_event(
        self, 
        event_data: Dict[str, Any], 
        organizer_id: str,
        premium_tier_required: str = "premium",
        location_reveal_hours: int = 2
    ) -> Dict[str, Any]:
        """Create a secret event with premium requirements"""
        try:
            # Verify organizer has premium access
            from services.membership_service import membership_service
            
            membership = membership_service.get_user_membership(organizer_id)
            if not membership_service.check_feature_access(organizer_id, "secret_events"):
                return {
                    "success": False,
                    "error": "Premium membership required to create secret events"
                }
            
            # Generate master invite code
            master_invite_code = self._generate_invite_code()
            
            # Calculate location reveal time
            event_start_time = event_data.get("start_date")
            if isinstance(event_start_time, str):
                event_start = datetime.fromisoformat(event_start_time.replace('Z', '+00:00'))
            else:
                event_start = datetime.utcnow() + timedelta(days=1)
            
            location_reveal_time = event_start - timedelta(hours=location_reveal_hours)
            
            # Calculate progressive hints
            hints = self._calculate_progressive_hints(
                event_data.get("venue", ""),
                event_data.get("public_venue", "Lagos Island")
            )
            
            # First, create the regular event in events table
            event_record = {
                "title": event_data.get("title", "Secret Event"),
                "description": event_data.get("description", ""),
                "category": event_data.get("category", "secret"),
                "event_date": event_start.isoformat(),
                "venue_name": event_data.get("public_venue", "Lagos Island"),  # Vague location
                "full_address": event_data.get("public_venue", "Lagos Island"),
                "ticket_price": event_data.get("price", 5000),
                "capacity": event_data.get("max_attendees", 100),
                "host_id": organizer_id,
                "status": "active",
                "is_secret": True
            }
            
            event_result = self.supabase.table('events').insert(event_record).execute()
            
            if not event_result.data:
                return {
                    "success": False,
                    "error": "Failed to create event"
                }
            
            event_id = event_result.data[0]['id']
            
            # Create secret event record
            secret_event_record = {
                "event_id": event_id,
                "organizer_id": organizer_id,
                "secret_venue": event_data.get("venue", ""),
                "public_venue": event_data.get("public_venue", "Lagos Island"),
                "location_reveal_time": location_reveal_time.isoformat(),
                "location_hint_24h": hints['hint_24h'],
                "location_hint_12h": hints['hint_12h'],
                "location_hint_6h": hints['hint_6h'],
                "location_hint_2h": hints['hint_2h'],
                "premium_tier_required": premium_tier_required,
                "master_invite_code": master_invite_code,
                "max_attendees": event_data.get("max_attendees", 100),
                "anonymous_purchases_allowed": event_data.get("anonymous_purchases_allowed", True),
                "attendee_list_hidden": event_data.get("attendee_list_hidden", True),
                "discoverable": event_data.get("discoverable", True),
                "teaser_description": event_data.get("teaser_description", event_data.get("description", "")[:100]),
                "category": event_data.get("category", "secret"),
                "vibe": event_data.get("vibe", "Exclusive"),
                "status": "active"
            }
            
            secret_result = self.supabase.table('secret_events').insert(secret_event_record).execute()
            
            if not secret_result.data:
                # Rollback event creation
                self.supabase.table('events').delete().eq('id', event_id).execute()
                return {
                    "success": False,
                    "error": "Failed to create secret event"
                }
            
            secret_event_id = secret_result.data[0]['id']
            
            # Create master invite code
            invite_record = {
                "event_id": event_id,
                "secret_event_id": secret_event_id,
                "code": master_invite_code,
                "created_by": organizer_id,
                "max_uses": event_data.get("max_attendees", 100),
                "expires_at": event_start.isoformat()
            }
            
            self.supabase.table('secret_event_invites').insert(invite_record).execute()
            
            # Schedule location reveal notification
            await self._schedule_location_reveal_notification(secret_event_id, location_reveal_time)
            
            return {
                "success": True,
                "message": "Secret event created successfully",
                "data": {
                    "event_id": event_id,
                    "secret_event_id": secret_event_id,
                    "master_invite_code": master_invite_code,
                    "location_reveal_time": location_reveal_time.isoformat(),
                    "public_venue": event_data.get("public_venue", "Lagos Island"),
                    "progressive_hints": hints
                }
            }
            
        except Exception as e:
            logger.error(f"Error creating secret event: {e}")
            return {
                "success": False,
                "error": f"Failed to create secret event: {str(e)}"
            }
    
    async def get_secret_events_for_user(self, user_id: str) -> Dict[str, Any]:
        """Get secret events accessible to user based on membership"""
        try:
            from services.membership_service import membership_service
            
            membership = membership_service.get_user_membership(user_id)
            user_tier = membership["tier"]
            
            # Query secret events based on tier
            query = self.supabase.table('secret_events').select('*').eq('status', 'active')
            
            if user_tier == "premium":
                query = query.eq('premium_tier_required', 'premium')
            elif user_tier == "vip":
                # VIP can access both premium and vip events
                query = query.in_('premium_tier_required', ['premium', 'vip'])
            else:
                # Free tier has no access
                return {
                    "success": True,
                    "data": {
                        "events": [],
                        "user_tier": user_tier,
                        "total_accessible": 0
                    }
                }
            
            result = query.execute()
            
            # Prepare events with location hints
            accessible_events = []
            for event in result.data:
                event_with_hint = event.copy()
                location_info = self.get_location_hint(event, user_tier)
                event_with_hint['current_location'] = location_info['location']
                event_with_hint['location_stage'] = location_info['stage']
                event_with_hint['location_revealed'] = location_info['is_revealed']
                event_with_hint['countdown_seconds'] = location_info['countdown_seconds']
                event_with_hint['vip_early_access'] = location_info.get('vip_early_access', False)
                accessible_events.append(event_with_hint)
            
            return {
                "success": True,
                "data": {
                    "events": accessible_events,
                    "user_tier": user_tier,
                    "total_accessible": len(accessible_events)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting secret events: {e}")
            return {
                "success": False,
                "error": f"Failed to get secret events: {str(e)}"
            }
    
    async def get_discovery_feed(
        self, 
        user_id: str, 
        category: Optional[str] = None,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get discoverable secret events (Feature #2: Discovery Feed)
        Shows teaser information only
        """
        try:
            from services.membership_service import membership_service
            
            membership = membership_service.get_user_membership(user_id)
            user_tier = membership["tier"]
            
            if user_tier == "free":
                return {
                    "success": False,
                    "error": "Premium membership required to view secret events"
                }
            
            # Query discoverable events
            query = self.supabase.table('secret_events')\
                .select('id, event_id, teaser_description, category, vibe, premium_tier_required, current_attendees, max_attendees, created_at')\
                .eq('discoverable', True)\
                .eq('status', 'active')\
                .limit(limit)
            
            if category:
                query = query.eq('category', category)
            
            if user_tier == "premium":
                query = query.eq('premium_tier_required', 'premium')
            # VIP sees all
            
            result = query.execute()
            
            # Check if user has already requested invites
            for event in result.data:
                request_check = self.supabase.table('secret_event_invite_requests')\
                    .select('status')\
                    .eq('secret_event_id', event['id'])\
                    .eq('user_id', user_id)\
                    .execute()
                
                event['has_requested'] = len(request_check.data) > 0
                event['request_status'] = request_check.data[0]['status'] if request_check.data else None
            
            return {
                "success": True,
                "data": {
                    "events": result.data,
                    "user_tier": user_tier,
                    "total": len(result.data)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting discovery feed: {e}")
            return {
                "success": False,
                "error": f"Failed to get discovery feed: {str(e)}"
            }
    
    async def request_invite(
        self, 
        secret_event_id: str, 
        user_id: str, 
        message: str = ""
    ) -> Dict[str, Any]:
        """
        Request invite to a secret event (Feature #2)
        """
        try:
            # Check if already requested
            existing = self.supabase.table('secret_event_invite_requests')\
                .select('id')\
                .eq('secret_event_id', secret_event_id)\
                .eq('user_id', user_id)\
                .execute()
            
            if existing.data:
                return {
                    "success": False,
                    "error": "You have already requested an invite to this event"
                }
            
            # Create request
            request_record = {
                "secret_event_id": secret_event_id,
                "user_id": user_id,
                "message": message,
                "status": "pending"
            }
            
            result = self.supabase.table('secret_event_invite_requests').insert(request_record).execute()
            
            if not result.data:
                return {
                    "success": False,
                    "error": "Failed to create invite request"
                }
            
            # Notify organizer
            await self._notify_organizer_of_request(secret_event_id, user_id)
            
            return {
                "success": True,
                "message": "Invite request sent successfully",
                "data": result.data[0]
            }
            
        except Exception as e:
            logger.error(f"Error requesting invite: {e}")
            return {
                "success": False,
                "error": f"Failed to request invite: {str(e)}"
            }
    
    async def _schedule_location_reveal_notification(
        self, 
        secret_event_id: str, 
        reveal_time: datetime
    ):
        """Schedule notification for location reveal (Feature #6)"""
        # This would integrate with a job scheduler like Celery or AWS EventBridge
        # For now, we'll create a notification record that can be processed by a cron job
        logger.info(f"Location reveal scheduled for {reveal_time} for event {secret_event_id}")
    
    async def _notify_organizer_of_request(self, secret_event_id: str, user_id: str):
        """Notify organizer of invite request (Feature #6)"""
        logger.info(f"Notifying organizer of invite request from user {user_id}")
    
    def validate_invite_code(self, invite_code: str, user_id: str) -> Dict[str, Any]:
        """Validate invite code and return event details"""
        try:
            # Find invite code
            invite_result = self.supabase.table('secret_event_invites')\
                .select('*, secret_events(*)')\
                .eq('code', invite_code)\
                .execute()
            
            if not invite_result.data:
                return {
                    "success": False,
                    "error": "Invalid invite code"
                }
            
            invite = invite_result.data[0]
            
            # Check if expired
            if invite.get('expires_at'):
                expires_at = datetime.fromisoformat(invite['expires_at'].replace('Z', '+00:00'))
                if datetime.utcnow() > expires_at:
                    return {
                        "success": False,
                        "error": "Invite code has expired"
                    }
            
            # Check usage limit
            if invite['used_count'] >= invite['max_uses']:
                return {
                    "success": False,
                    "error": "Invite code has reached maximum uses"
                }
            
            # Update usage
            self.supabase.table('secret_event_invites')\
                .update({
                    "used_count": invite['used_count'] + 1,
                    "last_used_at": datetime.utcnow().isoformat(),
                    "last_used_by": user_id
                })\
                .eq('id', invite['id'])\
                .execute()
            
            # Get user tier for location hint
            from services.membership_service import membership_service
            membership = membership_service.get_user_membership(user_id)
            user_tier = membership["tier"]
            
            # Get location hint
            secret_event = invite['secret_events']
            location_info = self.get_location_hint(secret_event, user_tier)
            
            return {
                "success": True,
                "message": "Invite code validated successfully",
                "data": {
                    "event_id": secret_event['event_id'],
                    "secret_event_id": secret_event['id'],
                    "title": "Secret Event",  # Don't reveal title yet
                    "current_location": location_info['location'],
                    "location_stage": location_info['stage'],
                    "location_revealed": location_info['is_revealed'],
                    "countdown_seconds": location_info['countdown_seconds'],
                    "vip_early_access": location_info.get('vip_early_access', False)
                }
            }
            
        except Exception as e:
            logger.error(f"Error validating invite code: {e}")
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
            # Get secret event
            secret_event_result = self.supabase.table('secret_events')\
                .select('*')\
                .eq('event_id', event_id)\
                .execute()
            
            if not secret_event_result.data:
                return {
                    "success": False,
                    "error": "Secret event not found"
                }
            
            secret_event = secret_event_result.data[0]
            
            # Check capacity
            if secret_event['current_attendees'] >= secret_event['max_attendees']:
                return {
                    "success": False,
                    "error": "Event is at full capacity"
                }
            
            # Generate unique codes
            purchase_code = self._generate_invite_code(12)
            ticket_code = self._generate_invite_code(12)
            
            # Get tier info (simplified - would normally query ticket_tiers table)
            tier_name = "General Admission"
            price = 5000  # Default price
            
            # Create anonymous ticket
            ticket_record = {
                "event_id": event_id,
                "secret_event_id": secret_event['id'],
                "tier_id": tier_id,
                "buyer_id": user_id if not is_anonymous else None,
                "buyer_email": buyer_email,
                "is_anonymous": is_anonymous,
                "purchase_code": purchase_code,
                "ticket_code": ticket_code,
                "price": price,
                "tier_name": tier_name,
                "status": "active"
            }
            
            ticket_result = self.supabase.table('anonymous_tickets').insert(ticket_record).execute()
            
            if not ticket_result.data:
                return {
                    "success": False,
                    "error": "Failed to create ticket"
                }
            
            # Update attendee count
            self.supabase.table('secret_events')\
                .update({"current_attendees": secret_event['current_attendees'] + 1})\
                .eq('id', secret_event['id'])\
                .execute()
            
            return {
                "success": True,
                "message": "Anonymous ticket purchased successfully",
                "data": {
                    "ticket_id": ticket_result.data[0]['id'],
                    "purchase_code": purchase_code,
                    "ticket_code": ticket_code,
                    "is_anonymous": is_anonymous
                }
            }
            
        except Exception as e:
            logger.error(f"Error purchasing anonymous ticket: {e}")
            return {
                "success": False,
                "error": f"Failed to purchase ticket: {str(e)}"
            }

# Global service instance
secret_events_service = SecretEventsService()
