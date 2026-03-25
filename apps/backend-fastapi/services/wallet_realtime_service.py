"""
Wallet Real-time Service
Handles WebSocket connections for live wallet updates
"""
import json
import time
from typing import Dict, Any, List, Set
from fastapi import WebSocket
import asyncio
from datetime import datetime

class WalletRealtimeService:
    def __init__(self):
        # Active WebSocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}  # user_id -> {websockets}
        self.connection_metadata: Dict[WebSocket, Dict[str, Any]] = {}  # websocket -> metadata
        
        # Event queues for different types of updates
        self.balance_updates: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> [updates]
        self.transaction_updates: Dict[str, List[Dict[str, Any]]] = {}  # user_id -> [updates]
        self.spray_money_updates: Dict[str, List[Dict[str, Any]]] = {}  # event_id -> [updates]
        
        # Subscription management
        self.user_subscriptions: Dict[str, Set[str]] = {}  # user_id -> {subscription_types}
        self.event_subscriptions: Dict[str, Set[str]] = {}  # event_id -> {user_ids}
        
        # Rate limiting
        self.message_counts: Dict[WebSocket, List[float]] = {}  # websocket -> [timestamps]
        self.MAX_MESSAGES_PER_MINUTE = 60

    async def connect_user(self, websocket: WebSocket, user_id: str, subscription_types: List[str] = None):
        """Connect a user's WebSocket for real-time updates"""
        await websocket.accept()
        
        # Initialize user connections if not exists
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        # Add connection
        self.active_connections[user_id].add(websocket)
        
        # Store connection metadata
        self.connection_metadata[websocket] = {
            "user_id": user_id,
            "connected_at": time.time(),
            "subscriptions": subscription_types or ["balance", "transactions"],
            "last_ping": time.time()
        }
        
        # Set up subscriptions
        if user_id not in self.user_subscriptions:
            self.user_subscriptions[user_id] = set()
        
        for sub_type in (subscription_types or ["balance", "transactions"]):
            self.user_subscriptions[user_id].add(sub_type)
        
        # Send connection confirmation
        await self.send_to_user(user_id, {
            "type": "connection_established",
            "user_id": user_id,
            "subscriptions": list(self.user_subscriptions[user_id]),
            "timestamp": time.time()
        })
        
        # Send any pending updates
        await self._send_pending_updates(user_id)

    async def disconnect_user(self, websocket: WebSocket):
        """Disconnect a user's WebSocket"""
        if websocket in self.connection_metadata:
            user_id = self.connection_metadata[websocket]["user_id"]
            
            # Remove from active connections
            if user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                
                # Clean up if no more connections
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
                    if user_id in self.user_subscriptions:
                        del self.user_subscriptions[user_id]
            
            # Clean up metadata
            del self.connection_metadata[websocket]
            
            # Clean up rate limiting
            if websocket in self.message_counts:
                del self.message_counts[websocket]

    async def send_to_user(self, user_id: str, message: Dict[str, Any]):
        """Send message to all of a user's active connections"""
        if user_id not in self.active_connections:
            return
        
        # Add timestamp if not present
        if "timestamp" not in message:
            message["timestamp"] = time.time()
        
        # Send to all user connections
        disconnected_connections = set()
        
        for websocket in self.active_connections[user_id].copy():
            try:
                # Check rate limiting
                if not self._check_rate_limit(websocket):
                    continue
                
                await websocket.send_text(json.dumps(message))
                
                # Update last activity
                if websocket in self.connection_metadata:
                    self.connection_metadata[websocket]["last_ping"] = time.time()
                    
            except Exception as e:
                print(f"Error sending message to user {user_id}: {e}")
                disconnected_connections.add(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected_connections:
            await self.disconnect_user(websocket)

    async def broadcast_balance_update(self, user_id: str, balance_data: Dict[str, Any]):
        """Broadcast balance update to user"""
        if user_id not in self.user_subscriptions or "balance" not in self.user_subscriptions[user_id]:
            return
        
        message = {
            "type": "balance_update",
            "user_id": user_id,
            "data": balance_data,
            "timestamp": time.time()
        }
        
        await self.send_to_user(user_id, message)

    async def broadcast_transaction_update(self, user_id: str, transaction_data: Dict[str, Any]):
        """Broadcast transaction update to user"""
        if user_id not in self.user_subscriptions or "transactions" not in self.user_subscriptions[user_id]:
            return
        
        message = {
            "type": "transaction_update",
            "user_id": user_id,
            "data": transaction_data,
            "timestamp": time.time()
        }
        
        await self.send_to_user(user_id, message)

    async def broadcast_spray_money_update(self, event_id: str, spray_data: Dict[str, Any]):
        """Broadcast spray money update to event participants"""
        if event_id not in self.event_subscriptions:
            return
        
        message = {
            "type": "spray_money_update",
            "event_id": event_id,
            "data": spray_data,
            "timestamp": time.time()
        }
        
        # Send to all subscribed users
        for user_id in self.event_subscriptions[event_id]:
            if user_id in self.user_subscriptions and "spray_money" in self.user_subscriptions[user_id]:
                await self.send_to_user(user_id, message)

    async def broadcast_withdrawal_status_update(self, user_id: str, withdrawal_data: Dict[str, Any]):
        """Broadcast withdrawal status update to user"""
        if user_id not in self.user_subscriptions or "withdrawals" not in self.user_subscriptions[user_id]:
            return
        
        message = {
            "type": "withdrawal_update",
            "user_id": user_id,
            "data": withdrawal_data,
            "timestamp": time.time()
        }
        
        await self.send_to_user(user_id, message)

    async def subscribe_to_event(self, user_id: str, event_id: str):
        """Subscribe user to event updates"""
        if event_id not in self.event_subscriptions:
            self.event_subscriptions[event_id] = set()
        
        self.event_subscriptions[event_id].add(user_id)
        
        # Add spray_money subscription
        if user_id in self.user_subscriptions:
            self.user_subscriptions[user_id].add("spray_money")

    async def unsubscribe_from_event(self, user_id: str, event_id: str):
        """Unsubscribe user from event updates"""
        if event_id in self.event_subscriptions:
            self.event_subscriptions[event_id].discard(user_id)
            
            # Clean up if no more subscribers
            if not self.event_subscriptions[event_id]:
                del self.event_subscriptions[event_id]

    async def send_notification(self, user_id: str, notification_data: Dict[str, Any]):
        """Send real-time notification to user"""
        message = {
            "type": "notification",
            "user_id": user_id,
            "data": notification_data,
            "timestamp": time.time()
        }
        
        await self.send_to_user(user_id, message)

    async def ping_connections(self):
        """Send ping to all connections to keep them alive"""
        ping_message = {
            "type": "ping",
            "timestamp": time.time()
        }
        
        for user_id in list(self.active_connections.keys()):
            try:
                await self.send_to_user(user_id, ping_message)
            except Exception as e:
                print(f"Error pinging user {user_id}: {e}")

    async def get_connection_stats(self) -> Dict[str, Any]:
        """Get real-time connection statistics"""
        total_connections = sum(len(connections) for connections in self.active_connections.values())
        
        return {
            "total_users_connected": len(self.active_connections),
            "total_connections": total_connections,
            "active_subscriptions": {
                user_id: list(subs) for user_id, subs in self.user_subscriptions.items()
            },
            "event_subscriptions": {
                event_id: len(users) for event_id, users in self.event_subscriptions.items()
            },
            "connection_details": [
                {
                    "user_id": metadata["user_id"],
                    "connected_at": metadata["connected_at"],
                    "subscriptions": metadata["subscriptions"],
                    "last_ping": metadata["last_ping"]
                }
                for metadata in self.connection_metadata.values()
            ]
        }

    def _check_rate_limit(self, websocket: WebSocket) -> bool:
        """Check if websocket is within rate limits"""
        current_time = time.time()
        
        if websocket not in self.message_counts:
            self.message_counts[websocket] = []
        
        # Clean old timestamps (older than 1 minute)
        self.message_counts[websocket] = [
            timestamp for timestamp in self.message_counts[websocket]
            if current_time - timestamp < 60
        ]
        
        # Check if under limit
        if len(self.message_counts[websocket]) >= self.MAX_MESSAGES_PER_MINUTE:
            return False
        
        # Add current timestamp
        self.message_counts[websocket].append(current_time)
        return True

    async def _send_pending_updates(self, user_id: str):
        """Send any pending updates to newly connected user"""
        # Send pending balance updates
        if user_id in self.balance_updates:
            for update in self.balance_updates[user_id]:
                await self.send_to_user(user_id, update)
            del self.balance_updates[user_id]
        
        # Send pending transaction updates
        if user_id in self.transaction_updates:
            for update in self.transaction_updates[user_id]:
                await self.send_to_user(user_id, update)
            del self.transaction_updates[user_id]

    async def queue_update_for_offline_user(self, user_id: str, update_type: str, update_data: Dict[str, Any]):
        """Queue update for user who is currently offline"""
        if update_type == "balance":
            if user_id not in self.balance_updates:
                self.balance_updates[user_id] = []
            self.balance_updates[user_id].append({
                "type": "balance_update",
                "data": update_data,
                "timestamp": time.time()
            })
        elif update_type == "transaction":
            if user_id not in self.transaction_updates:
                self.transaction_updates[user_id] = []
            self.transaction_updates[user_id].append({
                "type": "transaction_update",
                "data": update_data,
                "timestamp": time.time()
            })

    async def cleanup_stale_connections(self):
        """Clean up stale connections that haven't pinged recently"""
        current_time = time.time()
        stale_threshold = 300  # 5 minutes
        
        stale_connections = []
        
        for websocket, metadata in self.connection_metadata.items():
            if current_time - metadata["last_ping"] > stale_threshold:
                stale_connections.append(websocket)
        
        for websocket in stale_connections:
            await self.disconnect_user(websocket)

# Global instance
wallet_realtime_service = WalletRealtimeService()

# Background task to maintain connections
async def maintain_websocket_connections():
    """Background task to maintain WebSocket connections"""
    while True:
        try:
            await wallet_realtime_service.ping_connections()
            await wallet_realtime_service.cleanup_stale_connections()
            await asyncio.sleep(30)  # Run every 30 seconds
        except Exception as e:
            print(f"Error in WebSocket maintenance: {e}")
            await asyncio.sleep(60)  # Wait longer on error