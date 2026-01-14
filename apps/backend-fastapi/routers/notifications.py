"""
Notification Routes
Push notifications, SMS, email, and real-time messaging
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime

from middleware.auth import get_current_user, require_role
from services.notification_service import NotificationService
from models.notification_schemas import (
    NotificationCreate, NotificationResponse, NotificationPreferences,
    BroadcastMessage, SMSMessage, EmailMessage
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 20,
    offset: int = 0,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get user notifications"""
    try:
        notification_service = NotificationService()
        
        notifications = await notification_service.get_user_notifications(
            user_id=current_user["user_id"],
            limit=limit,
            offset=offset,
            unread_only=unread_only
        )
        
        return [
            NotificationResponse(
                id=notif["id"],
                user_id=notif["user_id"],
                title=notif["title"],
                message=notif["message"],
                type=notif["type"],
                priority=notif["priority"],
                read=notif["read"],
                action_url=notif.get("action_url"),
                metadata=notif.get("metadata", {}),
                created_at=notif["created_at"]
            )
            for notif in notifications
        ]
        
    except Exception as e:
        logger.error(f"Get notifications error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve notifications"
        )

@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Create a new notification"""
    try:
        notification_service = NotificationService()
        
        # Create notification
        result = await notification_service.create_notification(
            user_id=notification.user_id or current_user["user_id"],
            title=notification.title,
            message=notification.message,
            type=notification.type,
            priority=notification.priority,
            action_url=notification.action_url,
            metadata=notification.metadata,
            created_by=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        # Send push notification in background
        if notification.send_push:
            background_tasks.add_task(
                notification_service.send_push_notification,
                result["notification_id"]
            )
        
        return NotificationResponse(
            id=result["notification"]["id"],
            user_id=result["notification"]["user_id"],
            title=result["notification"]["title"],
            message=result["notification"]["message"],
            type=result["notification"]["type"],
            priority=result["notification"]["priority"],
            read=False,
            action_url=result["notification"].get("action_url"),
            metadata=result["notification"].get("metadata", {}),
            created_at=result["notification"]["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to create notification"
        )

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark notification as read"""
    try:
        notification_service = NotificationService()
        
        result = await notification_service.mark_notification_read(
            notification_id=notification_id,
            user_id=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Mark notification read error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to mark notification as read"
        )

@router.put("/mark-all-read")
async def mark_all_notifications_read(
    current_user: dict = Depends(get_current_user)
):
    """Mark all notifications as read"""
    try:
        notification_service = NotificationService()
        
        result = await notification_service.mark_all_notifications_read(
            user_id=current_user["user_id"]
        )
        
        return {
            "success": True,
            "message": f"Marked {result['count']} notifications as read"
        }
        
    except Exception as e:
        logger.error(f"Mark all notifications read error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to mark notifications as read"
        )

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a notification"""
    try:
        notification_service = NotificationService()
        
        result = await notification_service.delete_notification(
            notification_id=notification_id,
            user_id=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Notification deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Delete notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to delete notification"
        )

@router.get("/preferences", response_model=NotificationPreferences)
async def get_notification_preferences(
    current_user: dict = Depends(get_current_user)
):
    """Get user notification preferences"""
    try:
        notification_service = NotificationService()
        
        preferences = await notification_service.get_notification_preferences(
            user_id=current_user["user_id"]
        )
        
        return NotificationPreferences(**preferences)
        
    except Exception as e:
        logger.error(f"Get notification preferences error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve notification preferences"
        )

@router.put("/preferences")
async def update_notification_preferences(
    preferences: NotificationPreferences,
    current_user: dict = Depends(get_current_user)
):
    """Update user notification preferences"""
    try:
        notification_service = NotificationService()
        
        result = await notification_service.update_notification_preferences(
            user_id=current_user["user_id"],
            preferences=preferences.dict()
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Notification preferences updated"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update notification preferences error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update notification preferences"
        )

@router.post("/broadcast", dependencies=[Depends(require_role(["admin", "organizer"]))])
async def send_broadcast_notification(
    broadcast: BroadcastMessage,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send broadcast notification to multiple users"""
    try:
        notification_service = NotificationService()
        
        # Validate broadcast parameters
        if not broadcast.title or not broadcast.message:
            raise HTTPException(
                status_code=400,
                detail="Title and message are required"
            )
        
        # Send broadcast
        result = await notification_service.send_broadcast_notification(
            title=broadcast.title,
            message=broadcast.message,
            target_audience=broadcast.target_audience,
            filters=broadcast.filters,
            priority=broadcast.priority,
            sent_by=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        # Send push notifications in background
        background_tasks.add_task(
            notification_service.send_broadcast_push_notifications,
            result["broadcast_id"]
        )
        
        return {
            "success": True,
            "message": "Broadcast notification sent",
            "recipients_count": result["recipients_count"],
            "broadcast_id": result["broadcast_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send broadcast notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send broadcast notification"
        )

@router.post("/sms", dependencies=[Depends(require_role(["admin", "organizer"]))])
async def send_sms_notification(
    sms: SMSMessage,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send SMS notification"""
    try:
        notification_service = NotificationService()
        
        # Send SMS
        result = await notification_service.send_sms_notification(
            phone_number=sms.phone_number,
            message=sms.message,
            sender_id=sms.sender_id,
            sent_by=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "SMS sent successfully",
            "message_id": result["message_id"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send SMS notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send SMS notification"
        )

@router.post("/email", dependencies=[Depends(require_role(["admin", "organizer"]))])
async def send_email_notification(
    email: EmailMessage,
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Send email notification"""
    try:
        notification_service = NotificationService()
        
        # Send email in background
        background_tasks.add_task(
            notification_service.send_email_notification,
            email_address=email.email_address,
            subject=email.subject,
            message=email.message,
            html_content=email.html_content,
            sent_by=current_user["user_id"]
        )
        
        return {
            "success": True,
            "message": "Email queued for delivery"
        }
        
    except Exception as e:
        logger.error(f"Send email notification error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to queue email notification"
        )

@router.get("/stats", dependencies=[Depends(require_role(["admin"]))])
async def get_notification_stats(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get notification statistics (admin only)"""
    try:
        notification_service = NotificationService()
        
        stats = await notification_service.get_notification_stats(
            start_date=start_date,
            end_date=end_date
        )
        
        return stats
        
    except Exception as e:
        logger.error(f"Get notification stats error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve notification statistics"
        )