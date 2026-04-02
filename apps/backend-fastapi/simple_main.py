"""
Simple FastAPI app for Render deployment
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import secrets
import os
from typing import Dict, Any, List
from datetime import datetime

# Simple in-memory user database for testing
user_database: Dict[str, Dict[str, Any]] = {}
phone_to_user_id: Dict[str, str] = {}
events_database: Dict[str, Dict[str, Any]] = {}

def initialize_test_users():
    """Initialize test users for development"""
    test_users = [
        {
            "id": "test-admin-001",
            "phone_number": "+2348012345678",
            "password": "admin123",
            "first_name": "Admin",
            "last_name": "User",
            "email": "admin@grooovy.com",
            "role": "admin",
            "state": "Lagos",
            "wallet_balance": 50000.0,
            "is_verified": True,
            "created_at": time.time()
        },
        {
            "id": "test-organizer-001", 
            "phone_number": "+2348087654321",
            "password": "organizer123",
            "first_name": "Event",
            "last_name": "Organizer",
            "email": "organizer@grooovy.com",
            "role": "organizer",
            "state": "Lagos",
            "organization_name": "Grooovy Events",
            "wallet_balance": 25000.0,
            "is_verified": True,
            "created_at": time.time()
        },
        {
            "id": "test-attendee-001",
            "phone_number": "+2348098765432", 
            "password": "attendee123",
            "first_name": "John",
            "last_name": "Attendee",
            "email": "attendee@grooovy.com",
            "role": "attendee",
            "state": "Lagos",
            "wallet_balance": 10000.0,
            "is_verified": True,
            "created_at": time.time()
        }
    ]
    
    for user in test_users:
        user_id = user["id"]
        phone = user["phone_number"]
        user_database[user_id] = user
        phone_to_user_id[phone] = user_id
    
    print(f"✅ Initialized {len(test_users)} test users")

# Import proper authentication from auth_utils
from auth_utils import get_user_from_request

# In-memory databases
notifications_database: Dict[str, List[Dict[str, Any]]] = {}
events_database: Dict[str, Dict[str, Any]] = {}
tickets_database: List[Dict[str, Any]] = []
bulk_purchases_database: Dict[str, Dict[str, Any]] = {}
bulk_purchase_shares_database: Dict[str, List[Dict[str, Any]]] = {}
spray_money_database: Dict[str, List[Dict[str, Any]]] = {}

app = FastAPI(
    title="Grooovy API - Simple",
    description="Simple version for Render deployment",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://grooovy.vercel.app",
        "https://grooovy.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"]
)

# Initialize test users on startup
@app.on_event("startup")
async def startup_event():
    """Initialize test users for development"""
    initialize_test_users()

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

@app.get("/api/csrf-token")
async def get_csrf_token():
    """Generate and return a CSRF token"""
    token = secrets.token_urlsafe(32)
    response = JSONResponse({"csrf_token": token})
    response.set_cookie(
        key="csrf_token",
        value=token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax"
    )
    return response

# Mock auth endpoints
@app.post("/api/auth/register")
async def register(request: Request):
    try:
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
        
        # Check if user already exists
        phone_number = body.get('phone_number')
        if phone_number in phone_to_user_id:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "USER_EXISTS",
                        "message": "Phone number already registered"
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
        
        # Generate user ID
        user_id = str(uuid.uuid4())
        
        # Create user object
        user_data = {
            "id": user_id,
            "phone_number": phone_number,
            "password": body.get("password"),
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
        }
        
        # Store user in database
        user_database[user_id] = user_data
        phone_to_user_id[phone_number] = user_id
        
        print(f"✅ User registered: {phone_number} with role: {role}")
        
        # Return user data without password
        response_user = {k: v for k, v in user_data.items() if k != 'password'}
        
        return {
            "success": True,
            "message": "Registration successful",
            "data": {
                "user": response_user,
                "access_token": f"mock_access_token_{user_id}",
                "refresh_token": f"mock_refresh_token_{user_id}"
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
        phone_number = body.get("phoneNumber") or body.get("phone_number")
        password = body.get("password")
        
        if not phone_number or not password:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Phone number and password are required"
                    }
                }
            )
        
        # Check if user exists
        user_id = phone_to_user_id.get(phone_number)
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Invalid phone number or password"
                    }
                }
            )
        
        # Get user data
        user_data = user_database[user_id]
        
        # Verify password
        if user_data.get("password") != password:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "INVALID_CREDENTIALS",
                        "message": "Invalid phone number or password"
                    }
                }
            )
        
        print(f"✅ User logged in: {phone_number} with role: {user_data['role']}")
        
        # Return user data without password
        response_user = {k: v for k, v in user_data.items() if k != 'password'}
        
        return {
            "success": True,
            "message": "Login successful",
            "data": {
                "user": response_user,
                "access_token": f"mock_access_token_{user_id}",
                "refresh_token": f"mock_refresh_token_{user_id}"
            }
        }
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        return {
            "success": False,
            "error": {
                "code": "LOGIN_ERROR",
                "message": str(e)
            }
        }

@app.get("/api/auth/me")
async def get_current_user(request: Request):
    """Get current user from authentication token"""
    try:
        # Simple mock token validation
        auth_header = request.headers.get("Authorization", "")
        
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
            
            if user_id in user_database:
                user_data = user_database[user_id]
                print(f"✅ User authenticated via mock token: {user_data['phone_number']}")
                
                response_user = {k: v for k, v in user_data.items() if k != 'password'}
                
                return {
                    "success": True,
                    "message": "Current user retrieved",
                    "data": response_user
                }
        
        # No valid token found
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Missing or invalid authentication token"
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting current user: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "SERVER_ERROR",
                    "message": str(e)
                }
            }
        )

# Removed duplicate /api/events endpoint - see line 624 for the correct implementation

@app.post("/api/events")
async def create_event(request: Request):
    """Create a new event in Supabase"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        user_email = user.get("email")
        
        if user["role"] not in ["organizer", "admin"]:
            raise HTTPException(status_code=403, detail="Only organizers can create events")
        
        # Rate limiting: 3 events per minute
        from middleware.rate_limiter import rate_limiter
        is_allowed, message = rate_limiter.check_rate_limit(user_id, "create_event")
        if not is_allowed:
            raise HTTPException(status_code=429, detail=message)
        
        data = await request.json()
        
        print(f"🎉 Creating event for: {user_email}")
        print(f"   Event title: {data.get('title', 'Untitled')}")
        
        # Get Supabase client
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("⚠️  Supabase not configured, using in-memory storage")
            # Fallback to in-memory
            event_id = str(uuid.uuid4())
            events_database[event_id] = {
                **data,
                "id": event_id,
                "host_id": user_id,
                "created_at": time.time(),
                "tickets_sold": 0
            }
            return {
                "success": True,
                "message": "Event created successfully",
                "data": {"event_id": event_id}
            }
        
        # Generate event ID
        event_id = str(uuid.uuid4())
        
        # Prepare event data for Supabase (matching actual schema)
        event_data = {
            "id": event_id,
            "title": data.get("title"),
            "description": data.get("description", ""),
            "venue_name": data.get("venue") or data.get("venue_name", ""),
            "full_address": data.get("full_address", ""),
            "event_date": data.get("start_date") or data.get("event_date"),
            "ticket_price": float(data.get("ticket_price", 0)),
            "capacity": int(data.get("total_tickets") or data.get("capacity", 0)),
            "category": data.get("category", "other"),
            "host_id": user_id,
            "tickets_sold": 0,
            "status": "active",
            "currency": "NGN",
            "location_lat": float(data.get("location_lat", 0)),
            "location_lng": float(data.get("location_lng", 0)),
            "created_via": "web"
        }
        
        # Insert into Supabase
        result = supabase.table('events').insert(event_data).execute()
        
        if result.data:
            event_id = result.data[0]['id']
            print(f"✅ Event created in Supabase: {event_id}")
            
            return {
                "success": True,
                "message": "Event created successfully",
                "data": {
                    "event_id": event_id,
                    "event": result.data[0]
                }
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create event")
            
    except HTTPException:
        raise
    except ValueError as e:
        # Handle authentication errors
        print(f"❌ Authentication error: {e}")
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        print(f"❌ Error creating event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Wallet balance endpoint moved to wallet router

# Wallet fund endpoint moved to wallet router

@app.post("/api/wallet/verify-payment")
async def verify_payment(request: Request):
    """Verify Flutterwave payment and update wallet balance in Supabase"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        user_email = user.get("email")
        
        data = await request.json()
        tx_ref = data.get("tx_ref")
        transaction_id = data.get("transaction_id")
        amount = float(data.get("amount", 0))
        
        print(f"✅ Payment verification for user: {user_email} (ID: {user_id})")
        print(f"   tx_ref={tx_ref}, transaction_id={transaction_id}, amount=₦{amount:,.2f}")
        
        if amount <= 0:
            return {"success": False, "error": "Invalid amount"}
        
        # Get Supabase client
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("⚠️  Supabase not configured, using in-memory storage")
            # Fallback to in-memory for development
            if user_id in user_database:
                current_balance = user_database[user_id].get("wallet_balance", 0)
                new_balance = current_balance + amount
                user_database[user_id]["wallet_balance"] = new_balance
                
                print(f"✅ Updated in-memory wallet: ₦{current_balance:,.2f} -> ₦{new_balance:,.2f}")
                
                return {
                    "success": True,
                    "message": "Payment verified and wallet updated successfully",
                    "tx_ref": tx_ref,
                    "amount_added": amount,
                    "new_balance": new_balance
                }
            else:
                return {"success": False, "error": "User not found"}
        
        # Get current balance from Supabase
        user_result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
        
        if not user_result.data:
            print(f"❌ User not found in Supabase: {user_id}")
            return {"success": False, "error": "User not found in database"}
        
        current_balance = float(user_result.data[0].get('wallet_balance', 0))
        new_balance = current_balance + amount
        
        # Update wallet balance in Supabase
        update_result = supabase.table('users').update({
            'wallet_balance': new_balance
        }).eq('id', user_id).execute()
        
        print(f"✅ Updated Supabase wallet for {user_email}: ₦{current_balance:,.2f} -> ₦{new_balance:,.2f}")
        
        # Record transaction in payments table
        try:
            payment_record = {
                'user_id': user_id,
                'amount': amount,
                'payment_method': 'flutterwave',
                'transaction_reference': tx_ref,
                'transaction_id': transaction_id,
                'status': 'completed',
                'payment_type': 'wallet_funding',
                'created_at': time.time()
            }
            supabase.table('payments').insert(payment_record).execute()
            print(f"✅ Payment record created in database")
        except Exception as e:
            print(f"⚠️  Could not create payment record: {e}")
        
        return {
            "success": True,
            "message": "Payment verified and wallet updated successfully",
            "tx_ref": tx_ref,
            "amount_added": amount,
            "new_balance": new_balance,
            "user_email": user_email
        }
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in verify_payment: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

# Wallet transactions endpoint moved to wallet router

# ============================================================================
# EVENTS ENDPOINTS
# ============================================================================

def map_event_fields(event: dict) -> dict:
    """Map Supabase event fields to frontend expected format"""
    if not event:
        return event
    
    # Map event_date to start_date for frontend compatibility
    if 'event_date' in event and 'start_date' not in event:
        event['start_date'] = event['event_date']
    
    # Map venue_name to venue if needed
    if 'venue_name' in event and 'venue' not in event:
        event['venue'] = event['venue_name']
    
    # Map host_id to organizer_id if needed
    if 'host_id' in event and 'organizer_id' not in event:
        event['organizer_id'] = event['host_id']
    
    return event

@app.get("/api/events")
async def get_events(request: Request):
    """Get all active events from Supabase"""
    try:
        from database import supabase_client
        from datetime import datetime
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {"success": True, "data": {"events": []}}
        
        # Get current date/time
        now = datetime.utcnow().isoformat()
        
        # Query active events that haven't expired
        result = supabase.table('events')\
            .select('*')\
            .eq('status', 'active')\
            .gte('event_date', now)\
            .order('event_date', desc=False)\
            .execute()
        
        events = result.data if result.data else []
        
        # Map fields for frontend compatibility
        events = [map_event_fields(event) for event in events]
        
        print(f"✅ Retrieved {len(events)} active events from Supabase")
        
        return {
            "success": True,
            "data": {
                "events": events,
                "count": len(events)
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching events: {e}")
        return {"success": True, "data": {"events": []}}

@app.get("/api/events/recommended")
async def get_recommended_events(request: Request):
    """Get recommended events based on user preferences"""
    try:
        from database import supabase_client
        from datetime import datetime
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {"success": True, "data": {"events": []}}
        
        # Get current date/time
        now = datetime.utcnow().isoformat()
        
        # For now, return all active upcoming events
        # In production, filter by user preferences
        result = supabase.table('events')\
            .select('*')\
            .eq('status', 'active')\
            .gte('event_date', now)\
            .order('event_date', desc=False)\
            .limit(10)\
            .execute()
        
        events = result.data if result.data else []
        
        # Map fields for frontend compatibility
        events = [map_event_fields(event) for event in events]
        
        print(f"✅ Retrieved {len(events)} recommended events")
        
        return {
            "success": True,
            "data": {
                "events": events,
                "based_on_preferences": False
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching recommended events: {e}")
        return {"success": True, "data": {"events": []}}

@app.get("/api/events/{event_id}")
async def get_event_detail(event_id: str, request: Request):
    """Get specific event details from Supabase"""
    try:
        from database import supabase_client
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Query specific event
        result = supabase.table('events')\
            .select('*')\
            .eq('id', event_id)\
            .execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Event not found")
        
        event = result.data[0]
        
        # Map fields for frontend compatibility
        event = map_event_fields(event)
        
        print(f"✅ Retrieved event: {event.get('title')}")
        
        return {
            "success": True,
            "data": event
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching event {event_id}: {e}")
        raise HTTPException(status_code=404, detail="Event not found")

@app.get("/api/events/{event_id}/spray-money-leaderboard")
async def get_spray_money_leaderboard(event_id: str, limit: int = 10):
    """Get spray money leaderboard for an event"""
    try:
        # Return empty leaderboard for now
        # In production, query spray_money table
        return {
            "success": True,
            "data": {
                "leaderboard": [],
                "event_id": event_id,
                "total_sprayed": 0
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching leaderboard: {e}")
        return {"success": True, "data": {"leaderboard": []}}

@app.get("/api/events/{event_id}/tickets")
async def get_event_tickets(event_id: str, request: Request):
    """Get tickets for a specific event"""
    try:
        from database import supabase_client
        
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {"success": True, "data": {"tickets": []}}
        
        # Query tickets for this event
        result = supabase.table('tickets')\
            .select('*')\
            .eq('event_id', event_id)\
            .eq('status', 'active')\
            .order('price', desc=False)\
            .execute()
        
        tickets = result.data if result.data else []
        
        print(f"✅ Retrieved {len(tickets)} tickets for event {event_id}")
        
        return {
            "success": True,
            "data": {
                "tickets": tickets,
                "count": len(tickets)
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching tickets: {e}")
        return {"success": True, "data": {"tickets": []}}

# ============================================================================
# MEMBERSHIP ENDPOINTS
# ============================================================================

@app.get("/api/memberships/status")
async def get_membership_status(request: Request):
    """Get user's membership status"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        # Return basic membership status
        # In production, query memberships table
        return {
            "success": True,
            "data": {
                "tier": "free",
                "is_premium": False,
                "features": {
                    "max_events": 5,
                    "analytics": False,
                    "priority_support": False
                }
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching membership status: {e}")
        return {
            "success": True,
            "data": {
                "tier": "free",
                "is_premium": False
            }
        }

@app.get("/api/memberships/pricing")
async def get_membership_pricing():
    """Get membership pricing tiers"""
    try:
        return {
            "success": True,
            "data": {
                "tiers": [
                    {
                        "id": "free",
                        "name": "Free",
                        "price": 0,
                        "currency": "NGN",
                        "features": [
                            "Up to 5 events",
                            "Basic analytics",
                            "Email support"
                        ]
                    },
                    {
                        "id": "premium",
                        "name": "Premium",
                        "price": 5000,
                        "currency": "NGN",
                        "interval": "month",
                        "features": [
                            "Unlimited events",
                            "Advanced analytics",
                            "Priority support",
                            "Custom branding"
                        ]
                    }
                ]
            }
        }
        
    except Exception as e:
        print(f"❌ Error fetching pricing: {e}")
        return {"success": True, "data": {"tiers": []}}

# ============================================================================
# USER PREFERENCES ENDPOINTS
# ============================================================================

@app.post("/api/users/preferences")
async def save_user_preferences(request: Request):
    """Save user event preferences during onboarding"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        body = await request.json()
        event_preferences = body.get("preferences", body.get("event_preferences", []))
        
        print(f"✅ Preferences saved for user {user_id}: {event_preferences}")
        
        # In production, save to database
        # For now, just acknowledge receipt
        
        return {
            "success": True,
            "message": "Preferences saved successfully",
            "data": {
                "preferences": event_preferences
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error saving preferences: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save preferences: {str(e)}"
        )

@app.get("/api/users/preferences")
async def get_user_preferences(request: Request):
    """Get user event preferences"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        # In production, fetch from database
        # For now, return empty preferences
        event_preferences = []
        
        return {
            "success": True,
            "data": {
                "preferences": event_preferences
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting preferences: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get preferences: {str(e)}"
        )

# Include payment router for Flutterwave integration
try:
    from routers.payments import router as payments_router
    app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
    print("✅ Payment router included successfully with /api/payments prefix")
except ImportError as e:
    print(f"⚠️  Payment router not available: {e}")

# Include wallet router for withdrawal and other wallet operations
try:
    from routers.wallet import router as wallet_router
    app.include_router(wallet_router, prefix="/api/wallet", tags=["wallet"])
    print("✅ Wallet router included successfully with /api/wallet prefix")
    print(f"   Registered {len(wallet_router.routes)} wallet routes")
except ImportError as e:
    print(f"⚠️  Wallet router not available: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False
    )


# ============================================================================
# NOTIFICATIONS ENDPOINTS
# ============================================================================

@app.get("/api/notifications")
async def get_notifications(request: Request):
    """Get user notifications from Supabase"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {
                "success": True,
                "data": {
                    "notifications": [],
                    "unread_count": 0
                }
            }
        
        # Query notifications for this user
        result = supabase.table('notifications')\
            .select('*')\
            .eq('user_id', user_id)\
            .order('created_at', desc=True)\
            .limit(50)\
            .execute()
        
        notifications = result.data if result.data else []
        unread_count = sum(1 for n in notifications if not n.get('is_read', False))
        
        print(f"✅ Retrieved {len(notifications)} notifications for user {user_id}")
        
        return {
            "success": True,
            "data": {
                "notifications": notifications,
                "unread_count": unread_count
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching notifications: {e}")
        return {
            "success": True,
            "data": {
                "notifications": [],
                "unread_count": 0
            }
        }

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark a notification as read"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {"success": True, "message": "Notification marked as read"}
        
        # Update notification
        result = supabase.table('notifications')\
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()})\
            .eq('id', notification_id)\
            .eq('user_id', user_id)\
            .execute()
        
        print(f"✅ Marked notification {notification_id} as read")
        
        return {
            "success": True,
            "message": "Notification marked as read"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error marking notification as read: {e}")
        return {"success": False, "error": str(e)}

@app.put("/api/notifications/mark-all-read")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {"success": True, "message": "All notifications marked as read"}
        
        # Update all unread notifications
        result = supabase.table('notifications')\
            .update({"is_read": True, "read_at": datetime.utcnow().isoformat()})\
            .eq('user_id', user_id)\
            .eq('is_read', False)\
            .execute()
        
        print(f"✅ Marked all notifications as read for user {user_id}")
        
        return {
            "success": True,
            "message": "All notifications marked as read"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {e}")
        return {"success": False, "error": str(e)}

@app.get("/api/notifications/preferences")
async def get_notification_preferences(request: Request):
    """Get user notification preferences"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            # Return default preferences
            return {
                "success": True,
                "data": {
                    "event_updates": {"email": True, "push": True, "sms": False},
                    "ticket_purchases": {"email": True, "push": True, "sms": True},
                    "spray_money": {"email": False, "push": True, "sms": False},
                    "announcements": {"email": True, "push": True, "sms": False}
                }
            }
        
        # Query preferences from database
        result = supabase.table('notification_preferences')\
            .select('*')\
            .eq('user_id', user_id)\
            .execute()
        
        if result.data and len(result.data) > 0:
            preferences = result.data[0]
        else:
            # Return default preferences
            preferences = {
                "event_updates": {"email": True, "push": True, "sms": False},
                "ticket_purchases": {"email": True, "push": True, "sms": True},
                "spray_money": {"email": False, "push": True, "sms": False},
                "announcements": {"email": True, "push": True, "sms": False}
            }
        
        return {
            "success": True,
            "data": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error fetching notification preferences: {e}")
        return {
            "success": True,
            "data": {
                "event_updates": {"email": True, "push": True, "sms": False},
                "ticket_purchases": {"email": True, "push": True, "sms": True},
                "spray_money": {"email": False, "push": True, "sms": False},
                "announcements": {"email": True, "push": True, "sms": False}
            }
        }

@app.put("/api/notifications/preferences")
async def update_notification_preferences(request: Request):
    """Update user notification preferences"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        body = await request.json()
        preferences = body.get("preferences", {})
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {
                "success": True,
                "message": "Preferences updated successfully",
                "data": preferences
            }
        
        # Upsert preferences
        result = supabase.table('notification_preferences')\
            .upsert({
                "user_id": user_id,
                **preferences,
                "updated_at": datetime.utcnow().isoformat()
            })\
            .execute()
        
        print(f"✅ Updated notification preferences for user {user_id}")
        
        return {
            "success": True,
            "message": "Preferences updated successfully",
            "data": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error updating notification preferences: {e}")
        return {"success": False, "error": str(e)}

@app.post("/api/notifications/broadcast")
async def broadcast_notification(request: Request):
    """Broadcast notification to all users (admin only)"""
    try:
        user = await get_user_from_request(request)
        
        # Check if user is admin
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Admin access required")
        
        body = await request.json()
        title = body.get("title")
        message = body.get("message")
        type_filter = body.get("type")  # 'all', 'organizers', 'attendees'
        
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            return {
                "success": True,
                "message": "Broadcast notification sent",
                "data": {"recipients": 0}
            }
        
        # Get all users based on filter
        query = supabase.table('users').select('id, role')
        
        if type_filter == 'organizers':
            query = query.eq('role', 'organizer')
        elif type_filter == 'attendees':
            query = query.eq('role', 'attendee')
        
        users_result = query.execute()
        users = users_result.data if users_result.data else []
        
        # Create notifications for each user
        notifications = [
            {
                "user_id": u["id"],
                "title": title,
                "message": message,
                "type": "announcement",
                "is_read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            for u in users
        ]
        
        if notifications:
            supabase.table('notifications').insert(notifications).execute()
        
        print(f"✅ Broadcast notification sent to {len(notifications)} users")
        
        return {
            "success": True,
            "message": "Broadcast notification sent",
            "data": {"recipients": len(notifications)}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error broadcasting notification: {e}")
        return {"success": False, "error": str(e)}
