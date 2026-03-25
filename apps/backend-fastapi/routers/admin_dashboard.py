"""
Admin Dashboard Router
Provides real-time data for admin dashboard
"""
from fastapi import APIRouter, Depends, HTTPException, status
from middleware.auth import get_current_user
from services.admin_dashboard_service import admin_dashboard_service
import logging

router = APIRouter(prefix="/admin/dashboard", tags=["admin"])
logger = logging.getLogger(__name__)

@router.get("/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    """Get dashboard statistics"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        result = await admin_dashboard_service.get_dashboard_stats()
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting dashboard stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get dashboard stats"
        )

@router.get("/activity")
async def get_recent_activity(
    limit: int = 10,
    current_user: dict = Depends(get_current_user)
):
    """Get recent platform activity"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        activity = await admin_dashboard_service.get_recent_activity(limit=limit)
        
        return {
            "success": True,
            "data": activity,
            "count": len(activity)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recent activity: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get recent activity"
        )

@router.get("/pending-actions")
async def get_pending_actions(current_user: dict = Depends(get_current_user)):
    """Get pending actions"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        pending = await admin_dashboard_service.get_pending_actions()
        
        return {
            "success": True,
            "data": pending
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting pending actions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get pending actions"
        )

@router.get("/user-breakdown")
async def get_user_breakdown(current_user: dict = Depends(get_current_user)):
    """Get user breakdown by role"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        breakdown = await admin_dashboard_service.get_user_breakdown()
        
        return {
            "success": True,
            "data": breakdown
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user breakdown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user breakdown"
        )

@router.get("/event-breakdown")
async def get_event_breakdown(current_user: dict = Depends(get_current_user)):
    """Get event breakdown by status"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        breakdown = await admin_dashboard_service.get_event_breakdown()
        
        return {
            "success": True,
            "data": breakdown
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting event breakdown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get event breakdown"
        )

@router.get("/revenue-breakdown")
async def get_revenue_breakdown(current_user: dict = Depends(get_current_user)):
    """Get revenue breakdown by payment method"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        breakdown = await admin_dashboard_service.get_revenue_breakdown()
        
        return {
            "success": True,
            "data": breakdown
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting revenue breakdown: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get revenue breakdown"
        )

@router.get("/top-events")
async def get_top_events(
    limit: int = 5,
    current_user: dict = Depends(get_current_user)
):
    """Get top events by ticket sales"""
    try:
        if current_user["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        events = await admin_dashboard_service.get_top_events(limit=limit)
        
        return {
            "success": True,
            "data": events,
            "count": len(events)
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting top events: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get top events"
        )
