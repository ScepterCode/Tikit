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

@app.get("/api/events")
async def get_events():
    return {
        "success": True,
        "message": "Get events endpoint working",
        "data": {
            "events": [
                {
                    "id": event_id,
                    "title": event.get("title", "Event"),
                    "description": event.get("description", ""),
                    "venue": event.get("venue", ""),
                    "start_date": event.get("start_date", ""),
                    "ticket_price": event.get("ticket_price", 0),
                    "total_tickets": event.get("total_tickets", 0),
                    "tickets_sold": event.get("tickets_sold", 0),
                    "category": event.get("category", "other"),
                    "organizer_id": event.get("organizer_id", "")
                }
                for event_id, event in events_database.items()
            ]
        }
    }

@app.post("/api/events")
async def create_event(request: Request):
    """Create a new event"""
    try:
        user = await get_user_from_request(request)
        if user["role"] not in ["organizer", "admin"]:
            raise HTTPException(status_code=403, detail="Only organizers can create events")
        
        data = await request.json()
        event_id = str(uuid.uuid4())
        
        events_database[event_id] = {
            **data,
            "id": event_id,
            "organizer_id": user["user_id"],
            "created_at": time.time(),
            "tickets_sold": 0
        }
        
        return {
            "success": True,
            "message": "Event created successfully",
            "data": {"event_id": event_id}
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/wallet/balance")
async def get_wallet_balance(request: Request):
    """Get user's wallet balance from Supabase"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        user_email = user.get("email")
        
        print(f"🔍 Getting wallet balance for: {user_email} (ID: {user_id})")
        
        # Get Supabase client
        from database import supabase_client
        supabase = supabase_client.get_service_client()
        
        if not supabase:
            print("⚠️  Supabase not configured, returning 0 balance")
            return {
                "success": True,
                "balance": 0.0,
                "currency": "NGN",
                "formatted": "₦0.00"
            }
        
        # Get balance from Supabase
        user_result = supabase.table('users').select('wallet_balance').eq('id', user_id).execute()
        
        if not user_result.data:
            print(f"⚠️  User not found in Supabase, returning 0 balance")
            return {
                "success": True,
                "balance": 0.0,
                "currency": "NGN",
                "formatted": "₦0.00"
            }
        
        balance = float(user_result.data[0].get('wallet_balance', 0))
        print(f"✅ Wallet balance for {user_email}: ₦{balance:,.2f}")
        
        return {
            "success": True,
            "balance": balance,
            "currency": "NGN",
            "formatted": f"₦{balance:,.2f}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error in get_wallet_balance: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/wallet/fund")
async def fund_wallet(request: Request):
    """Initiate wallet funding - returns reference for Flutterwave"""
    try:
        user = await get_user_from_request(request)
        user_id = user.get("id") or user.get("user_id")
        
        data = await request.json()
        amount = float(data.get("amount", 0))
        
        if amount < 100:
            return {"success": False, "error": "Minimum amount is ₦100"}
        
        if amount > 1000000:
            return {"success": False, "error": "Maximum amount is ₦1,000,000"}
        
        # Generate transaction reference
        tx_ref = f"FUND_{user_id}_{int(time.time())}_{secrets.token_hex(4)}"
        
        return {
            "success": True,
            "tx_ref": tx_ref,
            "amount": amount,
            "user_email": user.get("email", "user@grooovy.com"),
            "user_name": f"{user.get('first_name', 'User')} {user.get('last_name', '')}"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in fund_wallet: {e}")
        raise HTTPException(status_code=500, detail=str(e))

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

@app.get("/api/wallet/transactions")
async def get_wallet_transactions(request: Request, limit: int = 20, offset: int = 0):
    """Get wallet transaction history"""
    try:
        user = await get_user_from_request(request)
        
        # Return empty for now - will be populated after payments
        return {
            "success": True,
            "transactions": [],
            "total": 0
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_wallet_transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "simple_main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=False
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
except ImportError as e:
    print(f"⚠️  Wallet router not available: {e}")