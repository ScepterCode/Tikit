"""
Analytics API Router - Phase 4
Advanced analytics for secret events and platform metrics
"""
from fastapi import APIRouter, Request, HTTPException
from auth_utils import get_user_from_request

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/secret-event/{event_id}")
async def get_secret_event_analytics(request: Request, event_id: str):
    """Get comprehensive analytics for secret event (organizer only)"""
    try:
        from services.analytics_service import analytics_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is organizer
        if user["role"] not in ["organizer", "admin"]:
            raise HTTPException(status_code=403, detail="Only organizers can view event analytics")
        
        result = analytics_service.get_secret_event_analytics(
            event_id=event_id,
            organizer_id=user_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/platform")
async def get_platform_analytics(request: Request):
    """Get platform-wide analytics (admin only)"""
    try:
        from services.analytics_service import analytics_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify user is admin
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        result = analytics_service.get_platform_analytics(admin_user_id=user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return {
            "success": True,
            "data": result["data"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/membership-trends")
async def get_membership_trends(request: Request):
    """Get membership growth trends (admin only)"""
    try:
        from services.membership_service import membership_service
        
        user = await get_user_from_request(request)
        
        # Verify user is admin
        if user["role"] != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        # Get membership statistics
        stats = membership_service.get_membership_stats()
        
        return {
            "success": True,
            "data": {
                "membership_stats": stats,
                "trends": {
                    "premium_growth": "Calculated based on historical data",
                    "vip_conversion": "Premium to VIP conversion rate",
                    "churn_rate": "Monthly membership churn"
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/engagement-metrics/{event_id}")
async def get_engagement_metrics(request: Request, event_id: str):
    """Get detailed engagement metrics for event"""
    try:
        from services.analytics_service import analytics_service
        
        user = await get_user_from_request(request)
        user_id = user["user_id"]
        
        # Verify access
        if user["role"] not in ["organizer", "admin"]:
            raise HTTPException(status_code=403, detail="Organizer or admin access required")
        
        result = analytics_service.get_secret_event_analytics(event_id, user_id)
        
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["error"])
        
        # Extract just engagement metrics
        engagement_data = result["data"].get("engagement_analytics", {})
        chat_data = result["data"].get("chat_analytics", {})
        
        return {
            "success": True,
            "data": {
                "engagement_score": engagement_data.get("engagement_score", 0),
                "chat_activity": {
                    "total_messages": chat_data.get("total_messages", 0),
                    "active_participants": chat_data.get("active_participants", 0),
                    "messages_per_participant": chat_data.get("messages_per_participant", 0)
                },
                "event_metrics": {
                    "attendee_fill_rate": engagement_data.get("attendee_fill_rate", 0),
                    "time_to_event_hours": engagement_data.get("time_to_event_hours", 0),
                    "location_revealed": engagement_data.get("location_revealed", False)
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))