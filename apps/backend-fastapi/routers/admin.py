"""
Admin Routes
Administrative functions for system management
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from middleware.auth import get_current_user, require_role
from services.admin_service import AdminService
from services.supabase_client import supabase_service
from models.admin_schemas import (
    UserManagement, EventModeration, SystemStats,
    SecurityAlert, AdminAction, SystemConfig
)

router = APIRouter()
logger = logging.getLogger(__name__)

# All admin routes require admin role
admin_required = Depends(require_role(["admin"]))

@router.get("/dashboard")
async def get_admin_dashboard(
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get admin dashboard overview"""
    try:
        admin_service = AdminService()
        
        # Get system statistics
        stats = await admin_service.get_system_stats()
        
        # Get recent activities
        recent_activities = await admin_service.get_recent_activities(limit=10)
        
        # Get security alerts
        security_alerts = await admin_service.get_security_alerts(limit=5)
        
        return {
            "stats": stats,
            "recent_activities": recent_activities,
            "security_alerts": security_alerts,
            "system_health": await admin_service.get_system_health()
        }
        
    except Exception as e:
        logger.error(f"Admin dashboard error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load admin dashboard"
        )

@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    role: Optional[str] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get users with filtering and pagination"""
    try:
        admin_service = AdminService()
        
        users = await admin_service.get_users(
            page=page,
            limit=limit,
            search=search,
            role=role,
            status=status
        )
        
        return users
        
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve users"
        )

@router.put("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    status: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Update user status (activate, suspend, ban)"""
    try:
        if status not in ["active", "suspended", "banned"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid status. Must be: active, suspended, or banned"
            )
        
        admin_service = AdminService()
        
        result = await admin_service.update_user_status(
            user_id=user_id,
            status=status,
            reason=reason,
            admin_id=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": f"User status updated to {status}",
            "user_id": user_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update user status error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update user status"
        )

@router.get("/events")
async def get_events_for_moderation(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    flagged_only: bool = False,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get events for moderation"""
    try:
        admin_service = AdminService()
        
        events = await admin_service.get_events_for_moderation(
            page=page,
            limit=limit,
            status=status,
            flagged_only=flagged_only
        )
        
        return events
        
    except Exception as e:
        logger.error(f"Get events for moderation error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve events"
        )

@router.put("/events/{event_id}/moderate")
async def moderate_event(
    event_id: str,
    action: str,
    reason: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Moderate an event (approve, reject, flag)"""
    try:
        if action not in ["approve", "reject", "flag", "unflag"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid action. Must be: approve, reject, flag, or unflag"
            )
        
        admin_service = AdminService()
        
        result = await admin_service.moderate_event(
            event_id=event_id,
            action=action,
            reason=reason,
            admin_id=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": f"Event {action}ed successfully",
            "event_id": event_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Moderate event error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to moderate event"
        )

@router.get("/analytics")
async def get_system_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    metric: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get system analytics"""
    try:
        admin_service = AdminService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        analytics = await admin_service.get_system_analytics(
            start_date=start_date,
            end_date=end_date,
            metric=metric
        )
        
        return analytics
        
    except Exception as e:
        logger.error(f"System analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve system analytics"
        )

@router.get("/security/alerts")
async def get_security_alerts(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    severity: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get security alerts"""
    try:
        admin_service = AdminService()
        
        alerts = await admin_service.get_security_alerts(
            page=page,
            limit=limit,
            severity=severity
        )
        
        return alerts
        
    except Exception as e:
        logger.error(f"Security alerts error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve security alerts"
        )

@router.post("/security/alerts/{alert_id}/resolve")
async def resolve_security_alert(
    alert_id: str,
    resolution_notes: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Resolve a security alert"""
    try:
        admin_service = AdminService()
        
        result = await admin_service.resolve_security_alert(
            alert_id=alert_id,
            resolved_by=current_user["user_id"],
            resolution_notes=resolution_notes
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Security alert resolved",
            "alert_id": alert_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Resolve security alert error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to resolve security alert"
        )

@router.get("/system/config")
async def get_system_config(
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get system configuration"""
    try:
        admin_service = AdminService()
        config = await admin_service.get_system_config()
        return config
        
    except Exception as e:
        logger.error(f"Get system config error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve system configuration"
        )

@router.put("/system/config")
async def update_system_config(
    config_updates: Dict[str, Any],
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Update system configuration"""
    try:
        admin_service = AdminService()
        
        result = await admin_service.update_system_config(
            config_updates=config_updates,
            updated_by=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "System configuration updated",
            "updated_keys": list(config_updates.keys())
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update system config error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to update system configuration"
        )

@router.get("/audit/logs")
async def get_audit_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action_type: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Get audit logs"""
    try:
        admin_service = AdminService()
        
        logs = await admin_service.get_audit_logs(
            page=page,
            limit=limit,
            action_type=action_type,
            user_id=user_id,
            start_date=start_date,
            end_date=end_date
        )
        
        return logs
        
    except Exception as e:
        logger.error(f"Get audit logs error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve audit logs"
        )

@router.post("/broadcast")
async def send_system_broadcast(
    message: str,
    target_audience: str = "all",  # all, users, organizers, admins
    priority: str = "normal",  # low, normal, high, urgent
    current_user: dict = Depends(get_current_user),
    _: None = admin_required
):
    """Send system-wide broadcast message"""
    try:
        if not message.strip():
            raise HTTPException(
                status_code=400,
                detail="Broadcast message cannot be empty"
            )
        
        admin_service = AdminService()
        
        result = await admin_service.send_system_broadcast(
            message=message,
            target_audience=target_audience,
            priority=priority,
            sent_by=current_user["user_id"]
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=400,
                detail=result["message"]
            )
        
        return {
            "success": True,
            "message": "Broadcast sent successfully",
            "recipients_count": result["recipients_count"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Send broadcast error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to send broadcast"
        )