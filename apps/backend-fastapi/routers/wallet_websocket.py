"""
Wallet WebSocket Router
Handles real-time wallet updates via WebSocket connections
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import List, Optional
import json
import asyncio

from services.wallet_realtime_service import wallet_realtime_service

router = APIRouter()

@router.websocket("/ws/wallet/{user_id}")
async def wallet_websocket_endpoint(
    websocket: WebSocket,
    user_id: str,
    subscriptions: Optional[str] = Query(default="balance,transactions")
):
    """WebSocket endpoint for real-time wallet updates"""
    
    # Parse subscriptions
    subscription_list = subscriptions.split(",") if subscriptions else ["balance", "transactions"]
    
    try:
        # Connect user
        await wallet_realtime_service.connect_user(websocket, user_id, subscription_list)
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client
                data = await websocket.receive_text()
                message = json.loads(data)
                
                # Handle different message types
                await handle_websocket_message(websocket, user_id, message)
                
            except WebSocketDisconnect:
                break
            except json.JSONDecodeError:
                # Send error for invalid JSON
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": "Invalid JSON format"
                }))
            except Exception as e:
                # Send error for other exceptions
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": f"Error processing message: {str(e)}"
                }))
                
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"WebSocket error for user {user_id}: {e}")
    finally:
        # Disconnect user
        await wallet_realtime_service.disconnect_user(websocket)

async def handle_websocket_message(websocket: WebSocket, user_id: str, message: dict):
    """Handle incoming WebSocket messages from client"""
    
    message_type = message.get("type")
    
    if message_type == "ping":
        # Respond to ping with pong
        await websocket.send_text(json.dumps({
            "type": "pong",
            "timestamp": message.get("timestamp")
        }))
        
    elif message_type == "subscribe_event":
        # Subscribe to event updates
        event_id = message.get("event_id")
        if event_id:
            await wallet_realtime_service.subscribe_to_event(user_id, event_id)
            await websocket.send_text(json.dumps({
                "type": "subscription_confirmed",
                "event_id": event_id,
                "subscription_type": "event_updates"
            }))
    
    elif message_type == "unsubscribe_event":
        # Unsubscribe from event updates
        event_id = message.get("event_id")
        if event_id:
            await wallet_realtime_service.unsubscribe_from_event(user_id, event_id)
            await websocket.send_text(json.dumps({
                "type": "unsubscription_confirmed",
                "event_id": event_id
            }))
    
    elif message_type == "get_connection_info":
        # Send connection information
        metadata = wallet_realtime_service.connection_metadata.get(websocket, {})
        await websocket.send_text(json.dumps({
            "type": "connection_info",
            "data": {
                "user_id": user_id,
                "connected_at": metadata.get("connected_at"),
                "subscriptions": metadata.get("subscriptions", []),
                "last_ping": metadata.get("last_ping")
            }
        }))
    
    else:
        # Unknown message type
        await websocket.send_text(json.dumps({
            "type": "error",
            "message": f"Unknown message type: {message_type}"
        }))

# Helper functions for broadcasting updates (to be called from other services)

async def broadcast_balance_update(user_id: str, balance_data: dict):
    """Broadcast balance update to user's WebSocket connections"""
    await wallet_realtime_service.broadcast_balance_update(user_id, balance_data)

async def broadcast_transaction_update(user_id: str, transaction_data: dict):
    """Broadcast transaction update to user's WebSocket connections"""
    await wallet_realtime_service.broadcast_transaction_update(user_id, transaction_data)

async def broadcast_spray_money_update(event_id: str, spray_data: dict):
    """Broadcast spray money update to event participants"""
    await wallet_realtime_service.broadcast_spray_money_update(event_id, spray_data)

async def broadcast_withdrawal_status_update(user_id: str, withdrawal_data: dict):
    """Broadcast withdrawal status update to user"""
    await wallet_realtime_service.broadcast_withdrawal_status_update(user_id, withdrawal_data)

async def send_notification(user_id: str, notification_data: dict):
    """Send real-time notification to user"""
    await wallet_realtime_service.send_notification(user_id, notification_data)

# Admin endpoint for connection statistics
@router.get("/ws/stats")
async def get_websocket_stats():
    """Get WebSocket connection statistics (admin only)"""
    try:
        stats = await wallet_realtime_service.get_connection_stats()
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }