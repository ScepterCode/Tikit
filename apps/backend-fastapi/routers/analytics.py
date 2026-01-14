"""
Analytics Routes
Business intelligence, reporting, and data insights
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from middleware.auth import get_current_user, require_role
from services.analytics_service import AnalyticsService
from models.analytics_schemas import (
    EventAnalytics, UserAnalytics, RevenueAnalytics,
    EngagementMetrics, GeographicData, TrendData
)

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/dashboard")
async def get_analytics_dashboard(
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get analytics dashboard overview"""
    try:
        analytics_service = AnalyticsService()
        
        # Calculate date range based on period
        end_date = datetime.utcnow()
        if period == "7d":
            start_date = end_date - timedelta(days=7)
        elif period == "30d":
            start_date = end_date - timedelta(days=30)
        elif period == "90d":
            start_date = end_date - timedelta(days=90)
        else:  # 1y
            start_date = end_date - timedelta(days=365)
        
        # Get dashboard data based on user role
        if current_user["role"] == "admin":
            dashboard = await analytics_service.get_admin_dashboard(
                start_date=start_date,
                end_date=end_date
            )
        elif current_user["role"] == "organizer":
            dashboard = await analytics_service.get_organizer_dashboard(
                organizer_id=current_user["user_id"],
                start_date=start_date,
                end_date=end_date
            )
        else:
            dashboard = await analytics_service.get_user_dashboard(
                user_id=current_user["user_id"],
                start_date=start_date,
                end_date=end_date
            )
        
        return dashboard
        
    except Exception as e:
        logger.error(f"Analytics dashboard error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load analytics dashboard"
        )

@router.get("/events", response_model=EventAnalytics)
async def get_event_analytics(
    event_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get event analytics"""
    try:
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Check permissions
        if event_id and current_user["role"] not in ["admin"]:
            # Verify user owns the event (for organizers)
            event = await analytics_service.get_event_owner(event_id)
            if not event or event["organizer_id"] != current_user["user_id"]:
                raise HTTPException(
                    status_code=403,
                    detail="Access denied to this event's analytics"
                )
        
        analytics = await analytics_service.get_event_analytics(
            event_id=event_id,
            organizer_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date
        )
        
        return EventAnalytics(**analytics)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Event analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve event analytics"
        )

@router.get("/revenue", response_model=RevenueAnalytics)
async def get_revenue_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    granularity: str = Query("daily", regex="^(hourly|daily|weekly|monthly)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get revenue analytics"""
    try:
        # Only admins and organizers can access revenue analytics
        if current_user["role"] not in ["admin", "organizer"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to revenue analytics"
            )
        
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        analytics = await analytics_service.get_revenue_analytics(
            organizer_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity
        )
        
        return RevenueAnalytics(**analytics)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Revenue analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve revenue analytics"
        )

@router.get("/users", response_model=UserAnalytics)
async def get_user_analytics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    segment: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
    _: None = Depends(require_role(["admin"]))
):
    """Get user analytics (admin only)"""
    try:
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        analytics = await analytics_service.get_user_analytics(
            start_date=start_date,
            end_date=end_date,
            segment=segment
        )
        
        return UserAnalytics(**analytics)
        
    except Exception as e:
        logger.error(f"User analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve user analytics"
        )

@router.get("/engagement", response_model=EngagementMetrics)
async def get_engagement_metrics(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get engagement metrics"""
    try:
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        metrics = await analytics_service.get_engagement_metrics(
            user_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date
        )
        
        return EngagementMetrics(**metrics)
        
    except Exception as e:
        logger.error(f"Engagement metrics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve engagement metrics"
        )

@router.get("/geographic", response_model=List[GeographicData])
async def get_geographic_analytics(
    metric: str = Query("users", regex="^(users|events|revenue|tickets)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get geographic analytics"""
    try:
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        # Check permissions for sensitive metrics
        if metric in ["revenue"] and current_user["role"] not in ["admin", "organizer"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to revenue geographic data"
            )
        
        data = await analytics_service.get_geographic_analytics(
            metric=metric,
            organizer_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date
        )
        
        return [GeographicData(**item) for item in data]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Geographic analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve geographic analytics"
        )

@router.get("/trends", response_model=List[TrendData])
async def get_trend_analytics(
    metric: str = Query("events", regex="^(events|users|revenue|tickets)$"),
    period: str = Query("30d", regex="^(7d|30d|90d|1y)$"),
    granularity: str = Query("daily", regex="^(hourly|daily|weekly|monthly)$"),
    current_user: dict = Depends(get_current_user)
):
    """Get trend analytics"""
    try:
        analytics_service = AnalyticsService()
        
        # Calculate date range
        end_date = datetime.utcnow()
        if period == "7d":
            start_date = end_date - timedelta(days=7)
        elif period == "30d":
            start_date = end_date - timedelta(days=30)
        elif period == "90d":
            start_date = end_date - timedelta(days=90)
        else:  # 1y
            start_date = end_date - timedelta(days=365)
        
        # Check permissions
        if metric in ["revenue"] and current_user["role"] not in ["admin", "organizer"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to revenue trend data"
            )
        
        trends = await analytics_service.get_trend_analytics(
            metric=metric,
            organizer_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity
        )
        
        return [TrendData(**item) for item in trends]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Trend analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve trend analytics"
        )

@router.get("/export")
async def export_analytics_data(
    report_type: str = Query(..., regex="^(events|users|revenue|engagement)$"),
    format: str = Query("csv", regex="^(csv|json|xlsx)$"),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    current_user: dict = Depends(get_current_user)
):
    """Export analytics data"""
    try:
        # Check permissions
        if current_user["role"] not in ["admin", "organizer"]:
            raise HTTPException(
                status_code=403,
                detail="Access denied to analytics export"
            )
        
        analytics_service = AnalyticsService()
        
        # Set default date range
        if not end_date:
            end_date = datetime.utcnow()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        export_data = await analytics_service.export_analytics_data(
            report_type=report_type,
            format=format,
            organizer_id=current_user["user_id"] if current_user["role"] == "organizer" else None,
            start_date=start_date,
            end_date=end_date
        )
        
        return {
            "success": True,
            "download_url": export_data["download_url"],
            "expires_at": export_data["expires_at"],
            "file_size": export_data["file_size"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Export analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to export analytics data"
        )

@router.get("/realtime")
async def get_realtime_analytics(
    current_user: dict = Depends(get_current_user)
):
    """Get real-time analytics"""
    try:
        analytics_service = AnalyticsService()
        
        realtime_data = await analytics_service.get_realtime_analytics(
            user_id=current_user["user_id"],
            role=current_user["role"]
        )
        
        return realtime_data
        
    except Exception as e:
        logger.error(f"Realtime analytics error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to retrieve realtime analytics"
        )