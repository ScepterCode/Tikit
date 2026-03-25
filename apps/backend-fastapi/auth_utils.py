"""
Authentication utilities shared between main app and routers
"""
from fastapi import Request, HTTPException
from typing import Dict, Any
import time
import os
from datetime import datetime

# In-memory user database for testing (shared)
user_database: Dict[str, Dict[str, Any]] = {}
phone_to_user_id: Dict[str, str] = {}

# SECURITY: Strict production environment detection
ENVIRONMENT = os.getenv("ENVIRONMENT", "production").lower()
ENABLE_TEST_USERS = ENVIRONMENT == "development" and os.getenv("ENABLE_TEST_USERS", "false").lower() == "true"
ENABLE_MOCK_TOKENS = ENVIRONMENT == "development" and os.getenv("ENABLE_MOCK_TOKENS", "false").lower() == "true"

# SECURITY: Additional production safety check
if ENVIRONMENT == "production" and (ENABLE_TEST_USERS or ENABLE_MOCK_TOKENS):
    raise RuntimeError("SECURITY ERROR: Test users and mock tokens are FORBIDDEN in production environment")

def initialize_test_users():
    """Initialize test users for development ONLY"""
    
    # SECURITY CHECK: Strict production environment validation
    if not ENABLE_TEST_USERS:
        print("🔒 SECURITY: Test users disabled - production mode active")
        return
    
    # SECURITY: Double-check environment to prevent accidental production use
    if os.getenv("ENVIRONMENT", "production").lower() != "development":
        print("🔒 SECURITY: Refusing to create test users - not in development environment")
        return
    
    import uuid
    
    # Clear existing data
    user_database.clear()
    phone_to_user_id.clear()
    
    print("⚠️  WARNING: Creating test users for DEVELOPMENT only")
    
    # Create test admin user
    admin_id = "admin"  # Use simple ID for mock tokens
    admin_phone = "+2349012345678"
    user_database[admin_id] = {
        "id": admin_id,
        "phone_number": admin_phone,
        "password": "password123",
        "first_name": "Admin",
        "last_name": "User",
        "email": "admin@grooovy.com",
        "state": "Lagos",
        "role": "admin",
        "wallet_balance": 50000.0,
        "referral_code": f"REF{admin_id.upper()}",
        "is_verified": True,
        "created_at": time.time()
    }
    phone_to_user_id[admin_phone] = admin_id
    
    # Create test organizer user
    organizer_id = "organizer"  # Use simple ID for mock tokens
    organizer_phone = "+2349087654321"
    user_database[organizer_id] = {
        "id": organizer_id,
        "phone_number": organizer_phone,
        "password": "password123",
        "first_name": "Organizer",
        "last_name": "User",
        "email": "organizer@grooovy.com",
        "state": "Lagos",
        "role": "organizer",
        "wallet_balance": 25000.0,
        "referral_code": f"REF{organizer_id.upper()}",
        "organization_name": "Test Events Co",
        "organization_type": "Event Management",
        "is_verified": True,
        "created_at": time.time()
    }
    phone_to_user_id[organizer_phone] = organizer_id
    
    # Create test attendee user
    attendee_id = "attendee"  # Use simple ID for mock tokens
    attendee_phone = "+2349011111111"
    user_database[attendee_id] = {
        "id": attendee_id,
        "phone_number": attendee_phone,
        "password": "password123",
        "first_name": "Attendee",
        "last_name": "User",
        "email": "attendee@grooovy.com",
        "state": "Lagos",
        "role": "attendee",
        "wallet_balance": 10000.0,
        "referral_code": f"REF{attendee_id.upper()}",
        "is_verified": True,
        "created_at": time.time()
    }
    phone_to_user_id[attendee_phone] = attendee_id
    
    print(f"📊 Total test users initialized in auth_utils: {len(user_database)}")

# Initialize test users when module is imported (only in development)
initialize_test_users()

async def get_user_from_request(request: Request) -> Dict[str, Any]:
    """Extract user from JWT token or mock token (development only)"""
    auth_header = request.headers.get("Authorization", "")
    print(f"🔍 Authorization header: {auth_header[:50]}..." if len(auth_header) > 50 else f"🔍 Authorization header: {auth_header}")
    
    # SECURITY CHECK: Strict validation for mock tokens
    if auth_header.startswith("Bearer mock_access_token_"):
        # SECURITY: Multiple layers of protection against production use
        if not ENABLE_MOCK_TOKENS:
            print("🔒 SECURITY: Mock tokens disabled in production")
            raise ValueError("Mock authentication not allowed in production")
        
        if os.getenv("ENVIRONMENT", "production").lower() != "development":
            print("🔒 SECURITY: Mock tokens forbidden - not in development environment")
            raise ValueError("Mock authentication forbidden in production environment")
        
        # SECURITY: Log mock token usage for audit trail
        user_id = auth_header.replace("Bearer mock_access_token_", "")
        print(f"⚠️  SECURITY AUDIT: Mock token authentication attempt for user_id: {user_id} at {datetime.now().isoformat()}")
        
        if user_id in user_database:
            user_data = user_database[user_id]
            print(f"⚠️  DEV MODE: User authenticated via mock token: {user_data.get('phone_number')}, role: {user_data.get('role')}")
            return {
                "user_id": user_data["id"],
                "email": user_data.get("email"),
                "phone_number": user_data.get("phone_number"),
                "first_name": user_data.get("first_name"),
                "last_name": user_data.get("last_name"),
                "role": user_data.get("role", "attendee"),
                "state": user_data.get("state"),
                "organization_name": user_data.get("organization_name"),
                "organization_type": user_data.get("organization_type"),
                "wallet_balance": user_data.get("wallet_balance", 0),
                "is_verified": user_data.get("is_verified", False),
                "created_at": user_data.get("created_at")
            }
        else:
            print(f"❌ Invalid mock token user ID: {user_id}")
            raise ValueError("Invalid mock token")
    
    # Try Supabase JWT for real tokens
    try:
        from jwt_validator import validate_request_token
        user_info = validate_request_token(request)
        print(f"✅ User authenticated via JWT: {user_info.get('email')}, role: {user_info.get('role')}")
        
        # Map to expected format
        return {
            "user_id": user_info.get("id"),
            "email": user_info.get("email"),
            "phone_number": user_info.get("phone_number"),
            "first_name": user_info.get("first_name"),
            "last_name": user_info.get("last_name"),
            "role": user_info.get("role", "attendee"),
            "state": user_info.get("state"),
            "organization_name": user_info.get("organization_name"),
            "organization_type": user_info.get("organization_type"),
            "wallet_balance": user_info.get("wallet_balance", 10000),
            "is_verified": user_info.get("is_verified", False),
            "created_at": user_info.get("created_at")
        }
    except ValueError as e:
        print(f"❌ JWT validation failed: {e}")
        raise ValueError("No valid authentication token found")