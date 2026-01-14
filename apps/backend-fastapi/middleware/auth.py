"""
Authentication middleware for FastAPI
"""
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from services.auth_service import auth_service
from config import settings
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "success": False,
            "error": {
                "code": "AUTHENTICATION_ERROR",
                "message": "Could not validate credentials",
                "timestamp": "2024-01-01T00:00:00Z"
            }
        },
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify access token
        payload = auth_service.verify_token(credentials.credentials, settings.jwt_secret)
        if payload is None:
            raise credentials_exception
        
        user_id: str = payload.get("user_id")
        if user_id is None:
            raise credentials_exception
        
        # Get user from database
        user = await auth_service.get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
        
        return {
            "user_id": user["id"],
            "phone_number": user["phone_number"],
            "role": user["role"],
            "state": user["state"],
            "user": user
        }
        
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise credentials_exception

async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Optional authentication dependency - returns None if no token provided
    """
    if not credentials:
        return None
    
    try:
        payload = auth_service.verify_token(credentials.credentials, settings.jwt_secret)
        if payload is None:
            return None
        
        user_id: str = payload.get("user_id")
        if user_id is None:
            return None
        
        user = await auth_service.get_user_by_id(user_id)
        if user is None:
            return None
        
        return {
            "user_id": user["id"],
            "phone_number": user["phone_number"],
            "role": user["role"],
            "state": user["state"],
            "user": user
        }
        
    except Exception as e:
        logger.error(f"Optional authentication error: {e}")
        return None

def require_role(required_role: str):
    """
    Dependency factory to require specific user role
    """
    async def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user["role"] != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_PERMISSIONS",
                        "message": f"Required role: {required_role}",
                        "timestamp": "2024-01-01T00:00:00Z"
                    }
                }
            )
        return current_user
    
    return role_checker

def require_roles(required_roles: list):
    """
    Dependency factory to require one of multiple roles
    """
    async def roles_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        if current_user["role"] not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_PERMISSIONS",
                        "message": f"Required roles: {', '.join(required_roles)}",
                        "timestamp": "2024-01-01T00:00:00Z"
                    }
                }
            )
        return current_user
    
    return roles_checker