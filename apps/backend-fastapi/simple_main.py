"""
Simple FastAPI app for testing integration
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import time
import uuid

app = FastAPI(
    title="Grooovy API - Simple",
    description="Simple version for testing integration",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://grooovy.vercel.app",
        "https://grooovy.netlify.app"  # Add your Netlify domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Grooovy API v2.0 - Simple",
        "status": "ok",
        "timestamp": time.time()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Grooovy FastAPI is running",
        "version": "2.0.0",
        "timestamp": time.time()
    }

@app.get("/api/test")
async def test_endpoint():
    return {
        "success": True,
        "message": "FastAPI backend is working!",
        "timestamp": time.time()
    }

# Mock auth endpoints
@app.post("/api/auth/register")
async def register(request: Request):
    try:
        # Get the request body
        body = await request.json()
        
        # Validate required fields
        required_fields = ['phone_number', 'password', 'first_name', 'last_name', 'state', 'role']
        missing_fields = [field for field in required_fields if not body.get(field)]
        
        if missing_fields:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": f"Missing required fields: {', '.join(missing_fields)}"
                    }
                }
            )
        
        # Extract and validate role
        role = body.get('role')
        if role not in ['attendee', 'organizer', 'admin']:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_ROLE",
                        "message": f"Invalid role '{role}'. Must be one of: attendee, organizer, admin"
                    }
                }
            )
        
        # Additional validation for organizer role
        if role == 'organizer':
            if not body.get('organization_name'):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "success": False,
                        "error": {
                            "code": "VALIDATION_ERROR",
                            "message": "Organization name is required for organizer registration"
                        }
                    }
                )
        
        # Generate a more realistic user ID
        user_id = str(uuid.uuid4())
        
        return {
            "success": True,
            "message": "Registration successful",
            "data": {
                "user": {
                    "id": user_id,
                    "phone_number": body.get("phone_number"),
                    "first_name": body.get("first_name"),
                    "last_name": body.get("last_name"),
                    "email": body.get("email"),
                    "state": body.get("state"),
                    "role": role,
                    "wallet_balance": 0.0,
                    "referral_code": f"REF{user_id[:8].upper()}",
                    "organization_name": body.get("organization_name"),
                    "organization_type": body.get("organization_type"),
                    "is_verified": False,
                    "created_at": time.time()
                },
                "access_token": "mock_access_token",
                "refresh_token": "mock_refresh_token"
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        return {
            "success": False,
            "error": {
                "code": "REGISTRATION_ERROR",
                "message": str(e)
            }
        }

@app.post("/api/auth/login")
async def login(request: Request):
    try:
        body = await request.json()
        phone_number = body.get("phoneNumber") or body.get("phone_number", "1234567890")
        
        # Generate a realistic user for login
        user_id = str(uuid.uuid4())
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "user": {
                    "id": user_id,
                    "phone_number": phone_number,
                    "first_name": "Test",
                    "last_name": "User",
                    "email": body.get("email"),
                    "state": "Lagos",
                    "role": "attendee",  # Default for login
                    "wallet_balance": 0.0,
                    "referral_code": f"REF{user_id[:8].upper()}",
                    "is_verified": False,
                    "created_at": time.time()
                },
                "access_token": "mock_access_token",
                "refresh_token": "mock_refresh_token"
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": {
                "code": "LOGIN_ERROR",
                "message": str(e)
            }
        }

@app.get("/api/auth/me")
async def get_current_user():
    # Generate a realistic user for current user endpoint
    user_id = str(uuid.uuid4())
    
    return {
        "success": True,
        "message": "Current user retrieved",
        "data": {
            "id": user_id,
            "phone_number": "1234567890",
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "state": "Lagos",
            "role": "attendee",  # Default for current user
            "wallet_balance": 0.0,
            "referral_code": f"REF{user_id[:8].upper()}",
            "is_verified": False,
            "created_at": time.time()
        }
    }

@app.get("/api/events")
async def get_events():
    return {
        "success": True,
        "message": "Get events endpoint working",
        "data": {
            "events": [
                {
                    "id": "test-event-1",
                    "title": "Test Event",
                    "description": "A test event",
                    "venue": "Test Venue",
                    "start_date": "2024-02-01T18:00:00Z"
                }
            ]
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)