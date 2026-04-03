"""
Authentication router for user registration, login, and token management
"""
from fastapi import APIRouter, HTTPException, Depends, status
from models.schemas import (
    UserCreate, LoginRequest, TokenResponse, RefreshTokenRequest,
    OTPRequest, OTPVerifyRequest, SuccessResponse, ErrorResponse,
    UserResponse
)
from services.auth_service import auth_service
from middleware.auth import get_current_user
from datetime import datetime
from typing import Dict, Any

router = APIRouter(tags=["authentication"])

@router.post("/register", response_model=TokenResponse)
async def register_user(user_data: UserCreate):
    """
    Register a new user
    """
    try:
        result = await auth_service.register_user(user_data.dict())
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "access_token": result['data']['access_token'],
            "refresh_token": result['data']['refresh_token'],
            "token_type": "bearer",
            "user": result['data']['user']
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
                    "message": "Failed to register user",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(login_data: LoginRequest):
    """
    Login user with phone number and password
    """
    try:
        result = await auth_service.login_user(
            login_data.phone_number,
            login_data.password
        )
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "access_token": result['data']['access_token'],
            "refresh_token": result['data']['refresh_token'],
            "token_type": "bearer",
            "user": result['data']['user']
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
                    "message": "Failed to login",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/refresh")
async def refresh_token(refresh_data: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        result = await auth_service.refresh_access_token(refresh_data.refresh_token)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message'],
            "access_token": result['access_token']
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
                    "message": "Failed to refresh token",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/verify-role", response_model=UserResponse)
async def verify_user_role(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Verify current user's role (debugging endpoint)
    """
    try:
        user = current_user["user"]
        return {
            "id": user["id"],
            "phone_number": user["phone_number"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user.get("email"),
            "state": user["state"],
            "role": user["role"],
            "wallet_balance": user.get("wallet_balance", 0.0),
            "referral_code": user.get("referral_code", ""),
            "organization_name": user.get("organization_name"),
            "organization_type": user.get("organization_type"),
            "is_verified": user.get("is_verified", False),
            "created_at": user["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to verify user role",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    try:
        user = current_user["user"]
        return {
            "id": user["id"],
            "phone_number": user["phone_number"],
            "first_name": user["first_name"],
            "last_name": user["last_name"],
            "email": user.get("email"),
            "state": user["state"],
            "role": user["role"],
            "wallet_balance": user.get("wallet_balance", 0.0),
            "referral_code": user.get("referral_code", ""),
            "organization_name": user.get("organization_name"),
            "organization_type": user.get("organization_type"),
            "is_verified": user.get("is_verified", False),
            "created_at": user["created_at"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "Failed to get user information",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/logout", response_model=SuccessResponse)
async def logout_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Logout user (token invalidation would be handled client-side or with Redis blacklist)
    """
    return {
        "success": True,
        "message": "Logout successful"
    }

@router.post("/verify-email")
async def verify_email(token: str):
    """
    Verify email address with token
    """
    try:
        result = await auth_service.verify_email(token)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message']
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
                    "message": "Failed to verify email",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/resend-verification")
async def resend_verification(current_user: Dict[str, Any] = Depends(get_current_user)):
    """
    Resend email verification link (requires authentication)
    """
    try:
        user_id = current_user["user"]["id"]
        result = await auth_service.resend_verification_email(user_id)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message']
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
                    "message": "Failed to resend verification email",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/forgot-password")
async def forgot_password(email: str):
    """
    Request password reset - sends email with reset link
    """
    try:
        result = await auth_service.request_password_reset(email)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message']
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
                    "message": "Failed to process password reset request",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )

@router.post("/reset-password")
async def reset_password(token: str, new_password: str):
    """
    Reset password using token from email
    """
    try:
        result = await auth_service.reset_password(token, new_password)
        
        if not result['success']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "success": False,
                    "error": {
                        **result['error'],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            )
        
        return {
            "success": True,
            "message": result['message']
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
                    "message": "Failed to reset password",
                    "timestamp": datetime.utcnow().isoformat()
                }
            }
        )
