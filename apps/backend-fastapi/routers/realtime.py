"""
Real-time Routes
WebSocket connections, live updates, and real-time features
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from typing import Dict, List, Optional, Any
import json
import logging
from datetime import datetime

from middleware.auth import get_current_user_websocket, get_current_user
from services.realtime_service import RealtimeService
from services.supabase_client import supabase_service

router = APIRouter()
logger = logging.getLogger(__name__)

# Connection manager for WebSocket connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.user_connections: Dict[str, List[str]] = {}
        self.room_connections: Dict[str, List[str]] = {}
    
    async def connect(self, websocket: WebSocket, connection_id: str, user_id: str = None):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections[connection_id] = websocket
        
        if user_id:
            if user_id not in self.user_connections:
                self.user_connections[user_id] = []
            self.user_connections[user_id].append(connection_id)
        
        logger.info(f"WebSocket connected: {connection_id} (user: {user_id})")
    
    def disconnect(self, connection_id: str, user_id: str = None):
        """Remove WebSocket connection"""
        if connection_id in self.active_connections:
            del self.active_connections[connection_id]
        
        if user_id and user_id in self.user_connections:
            if connection_id in self.user_connections[user_id]:
                self.user_connections[user_id].remove(connection_id)
            if not self.user_connections[user_id]:
                del self.user_connections[user_id]
        
        # Remove from all rooms
        for room_id in list(self.room_connections.keys()):
            if connection_id in self.room_connections[room_id]:
                self.room_connections[room_id].remove(connection_id)
                if not self.room_connections[room_id]:
                    del self.room_connections[room_id]
        
        logger.info(f"WebSocket disconnected: {connection_id}")
    
    def join_room(self, connection_id: str, room_id: str):
        """Join a room for group messaging"""
        if room_id not in self.room_connections:
            self.room_connections[room_id] = []
        
        if connection_id not in self.room_connections[room_id]:
            self.room_connections[room_id].append(connection_id)
    
    def leave_room(self, connection_id: str, room_id: str):
        """Leave a room"""
        if room_id in self.room_connections and connection_id in self.room_connections[room_id]:
            self.room_connections[room_id].remove(connection_id)
            if not self.room_connections[room_id]:
                del self.room_connections[room_id]
    
    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to specific user"""
        if user_id in self.user_connections:
            for connection_id in self.user_connections[user_id]:
                if connection_id in self.active_connections:
                    try:
                        await self.active_connections[connection_id].send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Failed to send message to {connection_id}: {e}")
    
    async def send_room_message(self, message: dict, room_id: str):
        """Send message to all users in a room"""
        if room_id in self.room_connections:
            for connection_id in self.room_connections[room_id]:
                if connection_id in self.active_connections:
                    try:
                        await self.active_connections[connection_id].send_text(json.dumps(message))
                    except Exception as e:
                        logger.error(f"Failed to send room message to {connection_id}: {e}")
    
    async def broadcast_message(self, message: dict):
        """Broadcast message to all connected users"""
        for connection_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")

# Global connection manager
manager = ConnectionManager()

@router.websocket("/ws/{connection_id}")
async def websocket_endpoint(websocket: WebSocket, connection_id: str):
    """Main WebSocket endpoint"""
    user_id = None
    
    try:
        # Try to authenticate user from query parameters
        token = websocket.query_params.get("token")
        if token:
            try:
                user_data = await get_current_user_websocket(token)
                user_id = user_data["user_id"]
            except Exception as e:
                logger.warning(f"WebSocket authentication failed: {e}")
        
        await manager.connect(websocket, connection_id, user_id)
        
        # Send welcome message
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "connection_id": connection_id,
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        }))
        
        realtime_service = RealtimeService()
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            message_type = message.get("type")
            
            if message_type == "ping":
                # Handle ping/pong for connection health
                await websocket.send_text(json.dumps({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat()
                }))
            
            elif message_type == "join_room":
                # Join a specific room (e.g., event updates)
                room_id = message.get("room_id")
                if room_id:
                    manager.join_room(connection_id, room_id)
                    await websocket.send_text(json.dumps({
                        "type": "room_joined",
                        "room_id": room_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            elif message_type == "leave_room":
                # Leave a room
                room_id = message.get("room_id")
                if room_id:
                    manager.leave_room(connection_id, room_id)
                    await websocket.send_text(json.dumps({
                        "type": "room_left",
                        "room_id": room_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            elif message_type == "subscribe_event":
                # Subscribe to event updates
                event_id = message.get("event_id")
                if event_id and user_id:
                    await realtime_service.subscribe_to_event(user_id, event_id)
                    manager.join_room(connection_id, f"event_{event_id}")
                    
                    await websocket.send_text(json.dumps({
                        "type": "event_subscribed",
                        "event_id": event_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            elif message_type == "unsubscribe_event":
                # Unsubscribe from event updates
                event_id = message.get("event_id")
                if event_id and user_id:
                    await realtime_service.unsubscribe_from_event(user_id, event_id)
                    manager.leave_room(connection_id, f"event_{event_id}")
                    
                    await websocket.send_text(json.dumps({
                        "type": "event_unsubscribed",
                        "event_id": event_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }))
            
            elif message_type == "send_message":
                # Send message to room or user
                if user_id:  # Only authenticated users can send messages
                    target_type = message.get("target_type")  # "room" or "user"
                    target_id = message.get("target_id")
                    content = message.get("content")
                    
                    if target_type == "room" and target_id and content:
                        await manager.send_room_message({
                            "type": "room_message",
                            "room_id": target_id,
                            "sender_id": user_id,
                            "content": content,
                            "timestamp": datetime.utcnow().isoformat()
                        }, target_id)
                    
                    elif target_type == "user" and target_id and content:
                        await manager.send_personal_message({
                            "type": "personal_message",
                            "sender_id": user_id,
                            "content": content,
                            "timestamp": datetime.utcnow().isoformat()
                        }, target_id)
            
            else:
                # Unknown message type
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Unknown message type: {message_type}",
                    "timestamp": datetime.utcnow().isoformat()
                }))
    
    except WebSocketDisconnect:
        manager.disconnect(connection_id, user_id)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(connection_id, user_id)

@router.post("/broadcast")
async def broadcast_message(
    message: dict,
    current_user: dict = Depends(get_current_user)
):
    """Broadcast message to all connected users (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Only admins can broadcast messages"
            )
        
        broadcast_data = {
            "type": "broadcast",
            "message": message,
            "sender": current_user["user_id"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await manager.broadcast_message(broadcast_data)
        
        return {
            "success": True,
            "message": "Broadcast sent successfully",
            "recipients": len(manager.active_connections)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Broadcast error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send broadcast"
        )

@router.post("/notify-event-update")
async def notify_event_update(
    event_id: str,
    update_type: str,
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """Notify subscribers about event updates"""
    try:
        # Verify user has permission to update this event
        realtime_service = RealtimeService()
        
        if current_user["role"] != "admin":
            event = await supabase_service.client.table('events').select('organizer_id').eq('id', event_id).execute()
            if not event.data or event.data[0]['organizer_id'] != current_user["user_id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to this event"
                )
        
        # Send update to event subscribers
        update_message = {
            "type": "event_update",
            "event_id": event_id,
            "update_type": update_type,
            "data": update_data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await manager.send_room_message(update_message, f"event_{event_id}")
        
        # Also store the update in database for offline users
        await realtime_service.store_event_update(event_id, update_type, update_data, current_user["user_id"])
        
        return {
            "success": True,
            "message": "Event update sent successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Event update notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send event update"
        )

@router.get("/connections")
async def get_connection_stats(
    current_user: dict = Depends(get_current_user)
):
    """Get real-time connection statistics (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        
        return {
            "total_connections": len(manager.active_connections),
            "authenticated_users": len(manager.user_connections),
            "active_rooms": len(manager.room_connections),
            "room_details": {
                room_id: len(connections) 
                for room_id, connections in manager.room_connections.items()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Connection stats error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve connection statistics"
        )

@router.post("/send-notification")
async def send_realtime_notification(
    user_id: str,
    notification: dict,
    current_user: dict = Depends(get_current_user)
):
    """Send real-time notification to specific user"""
    try:
        # Check permissions
        if current_user["role"] not in ["admin", "organizer"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied"
            )
        
        notification_data = {
            "type": "notification",
            "data": notification,
            "sender": current_user["user_id"],
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await manager.send_personal_message(notification_data, user_id)
        
        return {
            "success": True,
            "message": "Notification sent successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send notification"
        )