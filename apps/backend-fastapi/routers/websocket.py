"""
WebSocket Router - Phase 4
Real-time communication for chat and notifications
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from services.realtime_service import realtime_service
from auth_utils import user_database
import json
import asyncio

router = APIRouter()

@router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str, token: str = Query(...)):
    """WebSocket endpoint for real-time communication"""
    
    # Validate user token (simplified for demo)
    if not token.startswith("mock_access_token_"):
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    token_user_id = token.replace("mock_access_token_", "")
    if token_user_id != user_id or user_id not in user_database:
        await websocket.close(code=1008, reason="Unauthorized")
        return
    
    connection_id = await realtime_service.connect_user(websocket, user_id)
    
    try:
        while True:
            # Receive messages from client
            data = await websocket.receive_text()
            message = json.loads(data)
            
            # Handle different message types
            if message["type"] == "subscribe_room":
                room_id = message.get("room_id")
                if room_id:
                    await realtime_service.subscribe_to_room(connection_id, room_id)
            
            elif message["type"] == "unsubscribe_room":
                room_id = message.get("room_id")
                if room_id:
                    await realtime_service.unsubscribe_from_room(connection_id, room_id)
            
            elif message["type"] == "ping":
                await realtime_service.send_to_connection(connection_id, {
                    "type": "pong",
                    "timestamp": message.get("timestamp")
                })
    
    except WebSocketDisconnect:
        await realtime_service.disconnect_user(connection_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await realtime_service.disconnect_user(connection_id)