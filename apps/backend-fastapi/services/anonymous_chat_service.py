"""
Anonymous Chat Service - Phase 3
Handles anonymous chat for secret events with premium features
"""
import time
import uuid
import secrets
import string
import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta

# In-memory chat databases
chat_rooms_database: Dict[str, Dict[str, Any]] = {}
chat_messages_database: Dict[str, List[Dict[str, Any]]] = {}
anonymous_identities_database: Dict[str, Dict[str, Any]] = {}
premium_messages_database: Dict[str, List[Dict[str, Any]]] = {}

class AnonymousChatService:
    def __init__(self):
        self.animal_names = [
            "Wolf", "Eagle", "Tiger", "Panther", "Falcon", "Lion", "Bear", "Fox",
            "Hawk", "Raven", "Shark", "Phoenix", "Dragon", "Viper", "Lynx", "Cobra"
        ]
        self.colors = [
            "Shadow", "Crimson", "Golden", "Silver", "Midnight", "Azure", "Emerald",
            "Violet", "Scarlet", "Obsidian", "Platinum", "Ruby", "Sapphire", "Onyx"
        ]
    
    def create_chat_room(self, event_id: str, organizer_id: str) -> Dict[str, Any]:
        """Create anonymous chat room for secret event"""
        try:
            from services.secret_events_service import secret_events_database
            
            # Verify event exists and is secret
            event = secret_events_database.get(event_id)
            if not event:
                return {
                    "success": False,
                    "error": "Secret event not found"
                }
            
            if event["organizer_id"] != organizer_id:
                return {
                    "success": False,
                    "error": "Only event organizer can create chat room"
                }
            
            # Create chat room
            room_id = str(uuid.uuid4())
            chat_room = {
                "id": room_id,
                "event_id": event_id,
                "organizer_id": organizer_id,
                "name": f"Secret Chat - {event['title']}",
                "is_anonymous": True,
                "premium_only": True,
                "max_participants": event.get("max_attendees", 100),
                "current_participants": 0,
                "created_at": time.time(),
                "status": "active",
                "settings": {
                    "allow_media": True,
                    "allow_location_sharing": False,  # Keep locations secret
                    "message_retention_hours": 24,  # Auto-delete after 24h
                    "organizer_can_reveal_identities": False  # Full anonymity
                }
            }
            
            chat_rooms_database[room_id] = chat_room
            chat_messages_database[room_id] = []
            
            return {
                "success": True,
                "message": "Anonymous chat room created",
                "data": {
                    "room_id": room_id,
                    "chat_room": chat_room
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to create chat room: {str(e)}"
            }
    
    def join_chat_room(self, room_id: str, user_id: str) -> Dict[str, Any]:
        """Join anonymous chat room with generated identity"""
        try:
            from services.membership_service import membership_service
            
            # Check if room exists
            room = chat_rooms_database.get(room_id)
            if not room:
                return {
                    "success": False,
                    "error": "Chat room not found"
                }
            
            # Verify user has premium access
            membership = membership_service.get_user_membership(user_id)
            if not membership_service.check_feature_access(user_id, "anonymous_chat"):
                return {
                    "success": False,
                    "error": "Premium membership required for anonymous chat"
                }
            
            # Check room capacity
            if room["current_participants"] >= room["max_participants"]:
                return {
                    "success": False,
                    "error": "Chat room is full"
                }
            
            # Generate or get existing anonymous identity for this room
            identity_key = f"{room_id}_{user_id}"
            
            if identity_key not in anonymous_identities_database:
                # Generate unique anonymous identity
                anonymous_name = self._generate_anonymous_name(room_id)
                avatar_color = secrets.choice(["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"])
                
                anonymous_identities_database[identity_key] = {
                    "id": str(uuid.uuid4()),
                    "room_id": room_id,
                    "user_id": user_id,
                    "anonymous_name": anonymous_name,
                    "avatar_color": avatar_color,
                    "joined_at": time.time(),
                    "message_count": 0,
                    "is_active": True
                }
                
                # Increment room participants
                room["current_participants"] += 1
            
            identity = anonymous_identities_database[identity_key]
            identity["is_active"] = True
            identity["last_seen"] = time.time()
            
            return {
                "success": True,
                "message": "Joined anonymous chat room",
                "data": {
                    "room": room,
                    "anonymous_identity": {
                        "id": identity["id"],
                        "anonymous_name": identity["anonymous_name"],
                        "avatar_color": identity["avatar_color"]
                    }
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to join chat room: {str(e)}"
            }
    
    def send_anonymous_message(
        self, 
        room_id: str, 
        user_id: str, 
        message: str,
        message_type: str = "text"
    ) -> Dict[str, Any]:
        """Send anonymous message to chat room"""
        try:
            # Verify room exists
            room = chat_rooms_database.get(room_id)
            if not room:
                return {
                    "success": False,
                    "error": "Chat room not found"
                }
            
            # Get user's anonymous identity
            identity_key = f"{room_id}_{user_id}"
            identity = anonymous_identities_database.get(identity_key)
            
            if not identity or not identity["is_active"]:
                return {
                    "success": False,
                    "error": "You must join the chat room first"
                }
            
            # Create message
            message_id = str(uuid.uuid4())
            chat_message = {
                "id": message_id,
                "room_id": room_id,
                "sender_id": identity["id"],  # Use anonymous identity ID
                "sender_name": identity["anonymous_name"],
                "sender_avatar_color": identity["avatar_color"],
                "message": message,
                "message_type": message_type,
                "timestamp": time.time(),
                "edited": False,
                "reactions": {},
                "reply_to": None
            }
            
            # Store message
            if room_id not in chat_messages_database:
                chat_messages_database[room_id] = []
            
            chat_messages_database[room_id].append(chat_message)
            
            # Update identity stats
            identity["message_count"] += 1
            identity["last_seen"] = time.time()
            
            # Clean up old messages (keep last 1000 or 24 hours)
            self._cleanup_old_messages(room_id)
            
            # Broadcast to WebSocket subscribers (real-time)
            asyncio.create_task(self._broadcast_message_realtime(room_id, chat_message))
            
            return {
                "success": True,
                "message": "Anonymous message sent",
                "data": {
                    "message": chat_message
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to send message: {str(e)}"
            }
    
    async def _broadcast_message_realtime(self, room_id: str, message: Dict[str, Any]):
        """Broadcast message to real-time subscribers"""
        try:
            from services.realtime_service import realtime_service
            
            await realtime_service.broadcast_to_room(room_id, {
                "type": "new_message",
                "room_id": room_id,
                "message": message
            })
        except Exception as e:
            print(f"Failed to broadcast message: {e}")
    
    def get_chat_messages(
        self, 
        room_id: str, 
        user_id: str, 
        limit: int = 50,
        before_timestamp: Optional[float] = None
    ) -> Dict[str, Any]:
        """Get chat messages for room"""
        try:
            # Verify user has access to room
            identity_key = f"{room_id}_{user_id}"
            identity = anonymous_identities_database.get(identity_key)
            
            if not identity:
                return {
                    "success": False,
                    "error": "Access denied to chat room"
                }
            
            # Get messages
            messages = chat_messages_database.get(room_id, [])
            
            # Filter by timestamp if provided
            if before_timestamp:
                messages = [msg for msg in messages if msg["timestamp"] < before_timestamp]
            
            # Sort by timestamp and limit
            messages = sorted(messages, key=lambda x: x["timestamp"], reverse=True)[:limit]
            messages.reverse()  # Return in chronological order
            
            return {
                "success": True,
                "data": {
                    "messages": messages,
                    "room_id": room_id,
                    "total_messages": len(chat_messages_database.get(room_id, []))
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get messages: {str(e)}"
            }
    
    def send_premium_message(
        self, 
        event_id: str, 
        sender_id: str, 
        message: str,
        message_type: str = "location_reveal",
        recipients: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Send premium message (location reveals, updates) to event attendees"""
        try:
            from services.secret_events_service import secret_events_database
            from services.membership_service import membership_service
            
            # Verify event exists
            event = secret_events_database.get(event_id)
            if not event:
                return {
                    "success": False,
                    "error": "Secret event not found"
                }
            
            # Verify sender is organizer
            if event["organizer_id"] != sender_id:
                return {
                    "success": False,
                    "error": "Only event organizer can send premium messages"
                }
            
            # Create premium message
            message_id = str(uuid.uuid4())
            premium_message = {
                "id": message_id,
                "event_id": event_id,
                "sender_id": sender_id,
                "message": message,
                "message_type": message_type,  # location_reveal, update, announcement
                "recipients": recipients or "all_attendees",
                "timestamp": time.time(),
                "read_by": [],
                "priority": "high" if message_type == "location_reveal" else "normal"
            }
            
            # Store message
            if event_id not in premium_messages_database:
                premium_messages_database[event_id] = []
            
            premium_messages_database[event_id].append(premium_message)
            
            return {
                "success": True,
                "message": "Premium message sent",
                "data": {
                    "message": premium_message,
                    "event_title": event["title"]
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to send premium message: {str(e)}"
            }
    
    def get_premium_messages(self, event_id: str, user_id: str) -> Dict[str, Any]:
        """Get premium messages for user"""
        try:
            from services.membership_service import membership_service
            
            # Verify user has premium access
            membership = membership_service.get_user_membership(user_id)
            if membership["tier"] not in ["premium", "vip"]:
                return {
                    "success": False,
                    "error": "Premium membership required"
                }
            
            # Get messages for event
            messages = premium_messages_database.get(event_id, [])
            
            # Filter messages user can see
            user_messages = []
            for msg in messages:
                if (msg["recipients"] == "all_attendees" or 
                    (isinstance(msg["recipients"], list) and user_id in msg["recipients"])):
                    user_messages.append(msg)
            
            # Sort by timestamp
            user_messages = sorted(user_messages, key=lambda x: x["timestamp"], reverse=True)
            
            return {
                "success": True,
                "data": {
                    "messages": user_messages,
                    "event_id": event_id,
                    "unread_count": len([msg for msg in user_messages if user_id not in msg["read_by"]])
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get premium messages: {str(e)}"
            }
    
    def _generate_anonymous_name(self, room_id: str) -> str:
        """Generate unique anonymous name for room"""
        existing_names = set()
        
        # Get existing names in room
        for identity in anonymous_identities_database.values():
            if identity["room_id"] == room_id:
                existing_names.add(identity["anonymous_name"])
        
        # Generate unique name
        attempts = 0
        while attempts < 100:
            color = secrets.choice(self.colors)
            animal = secrets.choice(self.animal_names)
            name = f"{color} {animal}"
            
            if name not in existing_names:
                return name
            
            attempts += 1
        
        # Fallback with number
        return f"{secrets.choice(self.colors)} {secrets.choice(self.animal_names)} {secrets.randbelow(999)}"
    
    def _cleanup_old_messages(self, room_id: str):
        """Clean up old messages to prevent memory bloat"""
        messages = chat_messages_database.get(room_id, [])
        
        # Keep only last 1000 messages or messages from last 24 hours
        cutoff_time = time.time() - (24 * 3600)  # 24 hours ago
        
        # Filter by time and limit
        recent_messages = [msg for msg in messages if msg["timestamp"] > cutoff_time]
        if len(recent_messages) > 1000:
            recent_messages = recent_messages[-1000:]  # Keep last 1000
        
        chat_messages_database[room_id] = recent_messages
    
    def get_chat_room_stats(self, room_id: str, organizer_id: str) -> Dict[str, Any]:
        """Get chat room statistics (organizer only)"""
        try:
            room = chat_rooms_database.get(room_id)
            if not room:
                return {
                    "success": False,
                    "error": "Chat room not found"
                }
            
            if room["organizer_id"] != organizer_id:
                return {
                    "success": False,
                    "error": "Only organizer can view stats"
                }
            
            messages = chat_messages_database.get(room_id, [])
            
            # Calculate stats
            stats = {
                "room_id": room_id,
                "total_messages": len(messages),
                "active_participants": room["current_participants"],
                "max_participants": room["max_participants"],
                "created_at": room["created_at"],
                "last_activity": max([msg["timestamp"] for msg in messages]) if messages else room["created_at"],
                "message_types": {},
                "hourly_activity": {}
            }
            
            # Analyze message types and activity
            for msg in messages:
                msg_type = msg.get("message_type", "text")
                stats["message_types"][msg_type] = stats["message_types"].get(msg_type, 0) + 1
                
                # Hourly activity
                hour = int(msg["timestamp"] // 3600)
                stats["hourly_activity"][hour] = stats["hourly_activity"].get(hour, 0) + 1
            
            return {
                "success": True,
                "data": stats
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to get stats: {str(e)}"
            }

# Global service instance
anonymous_chat_service = AnonymousChatService()