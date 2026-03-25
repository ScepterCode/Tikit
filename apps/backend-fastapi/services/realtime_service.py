"""
Real-Time Service - Phase 4
WebSocket support for real-time chat and notifications
"""
import asyncio
import json
import time
from typing import Dict, Set, Any, List
from fastapi import WebSocket
import uuid

# Active WebSocket connections
active_connections: Dict[str, WebSocket] = {}
# Room subscriptions: room_id -> set of connection_ids
room_subscriptions: Dict[str, Set[str]] = {}
# User connections: user_id -> connection_id
user_connections: Dict[str, str] = {}

class RealtimeService:
    def __init__(self):
        self.connections = active_connections
        self.room_subs = room_subscriptions
        self.user_conns = user_connections
    
    async def connect_user(self, websocket: WebSocket, user_id: str, connection_id: str = None):
        """Connect user to WebSocket"""
        if not connection_id:
            connection_id = str(uuid.uuid4())
        
        await websocket.accept()
        self.connections[connection_id] = websocket
        self.user_conns[user_id] = connection_id
        
        # Send connection confirmation
        await self.send_to_connection(connection_id, {
            "type": "connection_established",
            "connection_id": connection_id,
            "timestamp": time.time()
        })
        
        return connection_id
    
    async def disconnect_user(self, connection_id: str):
        """Disconnect user from WebSocket"""
        if connection_id in self.connections:
            # Remove from all room subscriptions
            for room_id, subscribers in self.room_subs.items():
                subscribers.discard(connection_id)
            
            # Remove from user connections
            user_id_to_remove = None
            for user_id, conn_id in self.user_conns.items():
                if conn_id == connection_id:
                    user_id_to_remove = user_id
                    break
            
            if user_id_to_remove:
                del self.user_conns[user_id_to_remove]
            
            # Remove connection
            del self.connections[connection_id]
    
    async def subscribe_to_room(self, connection_id: str, room_id: str):
        """Subscribe connection to room updates"""
        if room_id not in self.room_subs:
            self.room_subs[room_id] = set()
        
        self.room_subs[room_id].add(connection_id)
        
        # Send subscription confirmation
        await self.send_to_connection(connection_id, {
            "type": "room_subscribed",
            "room_id": room_id,
            "timestamp": time.time()
        })
    
    async def unsubscribe_from_room(self, connection_id: str, room_id: str):
        """Unsubscribe connection from room updates"""
        if room_id in self.room_subs:
            self.room_subs[room_id].discard(connection_id)
    
    async def broadcast_to_room(self, room_id: str, message: Dict[str, Any]):
        """Broadcast message to all room subscribers"""
        if room_id not in self.room_subs:
            return
        
        message["timestamp"] = time.time()
        disconnected_connections = []
        
        for connection_id in self.room_subs[room_id]:
            try:
                await self.send_to_connection(connection_id, message)
            except:
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for conn_id in disconnected_connections:
            await self.disconnect_user(conn_id)
    
    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to specific user"""
        connection_id = self.user_conns.get(user_id)
        if connection_id:
            await self.send_to_connection(connection_id, message)
    
    async def send_to_connection(self, connection_id: str, message: Dict[str, Any]):
        """Send message to specific connection"""
        websocket = self.connections.get(connection_id)
        if websocket:
            await websocket.send_text(json.dumps(message))

# Global service instance
realtime_service = RealtimeService()