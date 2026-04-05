"""
Users router for user preferences and profile management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from middleware.auth import get_current_user
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("/preferences")
async def get_user_preferences(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get user's event preferences
    """
    try:
        from services.supabase_client import get_supabase_client
        
        user_id = current_user['user_id']
        supabase = get_supabase_client()
        
        # Get user preferences from database
        result = supabase.table('users').select('event_preferences').eq('id', user_id).execute()
        
        # Check if user exists and has data
        if not result.data or len(result.data) == 0:
            # Return empty preferences if user not found
            return {
                "success": True,
                "data": {
                    "event_preferences": []
                }
            }
        
        return {
            "success": True,
            "data": {
                "event_preferences": result.data[0].get('event_preferences', [])
            }
        }
        
    except Exception as e:
        # Log the error but return empty preferences instead of failing
        print(f"Error getting preferences for user {current_user.get('user_id')}: {str(e)}")
        return {
            "success": True,
            "data": {
                "event_preferences": []
            }
        }

@router.post("/preferences")
async def update_user_preferences(
    preferences_data: Dict[str, Any],
    current_user: Dict[str, Any] = Depends(get_current_user)
):
    """
    Update user's event preferences
    """
    try:
        from services.supabase_client import get_supabase_client
        
        user_id = current_user['user_id']
        event_preferences = preferences_data.get('event_preferences', [])
        supabase = get_supabase_client()
        
        # Update user preferences in database
        result = supabase.table('users').update({
            'event_preferences': event_preferences
        }).eq('id', user_id).execute()
        
        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        "code": "UPDATE_FAILED",
                        "message": "Failed to update preferences",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "data": {
                "event_preferences": event_preferences
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": f"Failed to update preferences: {str(e)}",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
