"""
Notifications Router
Handles notification endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional, List
from datetime import datetime
from middleware.auth import get_current_user
from middleware.rate_limiter import rate_limiter
from services.notification_service import notification_service
import logging

router = APIRouter(prefix="/notifications", tags=["notifications"])
logger = logging.getLogger(__name__)

@router.get("/")
async def get_notifications(
    limit: int = 50,
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """Get notifications for current user"""
    try:
        notifications = await notification_service.get_user_notifications(
            user_id=current_user["user_id"],
            limit=limit,
            unread_only=unread_only
        )
        
        return {
            "success": True,
            "data": notifications,
            "count": len(notifications)
        }
    except Exception as e:
        logger.error(f"Error fetching notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch notifications"
        )

@router.get("/unread-count")
async def get_unread_count(current_user: dict = Depends(get_current_user)):
    """Get count of unread notifications"""
    try:
        count = await notification_service.get_unread_count(current_user["user_id"])
        
        return {
            "success": True,
            "unread_count": count
        }
    except Exception as e:
        logger.error(f"Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get unread count"
        )

@router.put("/{notification_id}/read")
async def mark_notification_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Mark a notification as read"""
    try:
        success = await notification_service.mark_notification_read(notification_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark notification as read"
        )

@router.put("/mark-all-read")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read"""
    try:
        success = await notification_service.mark_all_notifications_read(current_user["user_id"])
        
        return {
            "success": True,
            "message": "All notifications marked as read"
        }
    except Exception as e:
        logger.error(f"Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to mark all notifications as read"
        )

@router.post("/broadcast")
async def send_broadcast(
    title: str,
    message: str,
    target_roles: Optional[List[str]] = None,
    current_user: dict = Depends(get_current_user)
):
    """Send broadcast notification (admin only)"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can send broadcasts"
            )
        
        # Rate limiting check
        is_allowed, rate_message = rate_limiter.check_rate_limit(
            current_user["user_id"], 
            "broadcast_notification"
        )
        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": rate_message,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        result = await notification_service.send_broadcast(
            title=title,
            message=message,
            target_roles=target_roles
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send broadcast")
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending broadcast: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send broadcast"
        )

@router.post("/ticket-sale")
async def notify_ticket_sale(
    event_id: str,
    organizer_id: str,
    ticket_count: int,
    amount: float,
    current_user: dict = Depends(get_current_user)
):
    """Notify organizer about ticket sale (admin/system only)"""
    try:
        if current_user["role"] not in ["admin", "system"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        result = await notification_service.notify_ticket_sale(
            event_id=event_id,
            organizer_id=organizer_id,
            ticket_count=ticket_count,
            amount=amount
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send notification")
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying ticket sale: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send notification"
        )

@router.post("/event-update")
async def notify_event_update(
    event_id: str,
    update_type: str,
    message: str,
    current_user: dict = Depends(get_current_user)
):
    """Notify users about event updates"""
    try:
        result = await notification_service.notify_event_update(
            event_id=event_id,
            update_type=update_type,
            message=message
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Failed to send notification")
            )
        
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error notifying event update: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send notification"
        )
