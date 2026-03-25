"""
Simple FastAPI app for testing integration
"""
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import secrets
from typing import Dict, Any, List
from datetime import datetime
from jwt_validator import validate_request_token, get_token_from_header

# Import shared authentication utilities
from auth_utils import user_database, phone_to_user_id, get_user_from_request, initialize_test_users
# In-memory notifications database
notifications_database: Dict[str, List[Dict[str, Any]]] = {}
# In-memory events database
events_database: Dict[str, Dict[str, Any]] = {}
# In-memory tickets database
tickets_database: List[Dict[str, Any]] = []

# Helper function to send event change notifications
async def send_event_change_notifications(event_id: str, changes: List[str]):
    """Send notifications to all ticket holders about event changes"""
    try:
        event = events_database.get(event_id)
        if not event:
            return
        
        # Find all ticket holders for this event
        ticket_holders = []
        for ticket in tickets_database:
            if ticket.get("event_id") == event_id:
                user_id = ticket.get("user_id")
                if user_id and user_id in user_database:
                    ticket_holders.append(user_database[user_id])
        
        # Create notification for each ticket holder
        for holder in ticket_holders:
            user_id = holder["id"]
            if user_id not in notifications_database:
                notifications_database[user_id] = []
            
            notification = {
                "id": str(uuid.uuid4()),
                "user_id": user_id,
                "title": f"Event Update: {event['title']}",
                "message": f"Important changes to your event:\n• " + "\n• ".join(changes),
                "type": "event_update",
                "event_id": event_id,
                "is_read": False,
                "created_at": time.time()
            }
            
            notifications_database[user_id].append(notification)
        
        print(f"📧 Sent notifications to {len(ticket_holders)} ticket holders")
        
    except Exception as e:
        print(f"❌ Error sending notifications: {e}")

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
        
        # Create user object
        user_data = {
            "id": user_id,
            "phone_number": phone_number,
            "password": body.get("password"),  # In production, this should be hashed
            "first_name": body.get("first_name"),
            "last_name": body.get("last_name"),
            "email": body.get("email"),
            "state": body.get("state"),
            "role": role,  # CRITICAL: Store the actual role
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
        print(f"📊 Total users in database: {len(user_database)}")
        
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
        
        # Verify password (in production, use proper password hashing)
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
    """Get current user from Supabase JWT token"""
    try:
        # Try to validate Supabase JWT token first
        try:
            user_info = validate_request_token(request)
            print(f"✅ User authenticated via Supabase JWT: {user_info.get('email')}")
            
            return {
                "success": True,
                "message": "Current user retrieved",
                "data": user_info
            }
        except ValueError as jwt_error:
            print(f"⚠️ JWT validation failed: {str(jwt_error)}")
            
            # Fallback to mock token validation for backward compatibility
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

@app.get("/api/events/recommended")
async def get_recommended_events(request: Request):
    """Get recommended events based on user preferences"""
    try:
        # Try to get authenticated user (optional for this endpoint)
        user_preferences = []
        try:
            user = await get_user_from_request(request)
            # In a real app, you'd fetch preferences from database
            # For now, we'll return all events
        except:
            # If not authenticated, just return all events
            pass
        
        # Filter events by preferences
        recommended_events = []
        for event_id, event in events_database.items():
            recommended_events.append({
                "id": event_id,
                **event
            })
        
        return {
            "success": True,
            "message": "Recommended events retrieved",
            "data": {
                "events": recommended_events,
                "based_on_preferences": len(user_preferences) > 0
            }
        }
    except Exception as e:
        print(f"❌ Error getting recommended events: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.post("/api/events")
async def create_event(request: Request):
    """Create a new event (organizer only)"""
    try:
        # Get authenticated user from JWT token
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        user_role = user.get("role")
        
        # Check if user is organizer or admin
        if user_role not in ["organizer", "admin"]:
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Only organizers can create events"
                    }
                }
            )
        
        body = await request.json()
        event_id = str(uuid.uuid4())
        
        # Combine date and time into start_date
        date_str = body.get("date", "")
        time_str = body.get("time", "")
        start_date = f"{date_str}T{time_str}:00Z" if date_str and time_str else datetime.utcnow().isoformat()
        
        # Handle ticket tiers (new flexible system)
        ticket_tiers = body.get("ticketTiers", [])
        if not ticket_tiers:
            # Fallback to old single-price system for backward compatibility
            ticket_tiers = [{
                "name": "General Admission",
                "price": float(body.get("ticketPrice", body.get("price", 0))),
                "quantity": int(body.get("totalTickets", body.get("capacity", 0))),
                "sold": 0
            }]
        
        # Calculate total tickets from all tiers
        total_tickets = sum(tier.get("quantity", 0) for tier in ticket_tiers)
        
        # Handle images (base64 encoded or URLs)
        images = body.get("images", [])
        
        event = {
            "id": event_id,
            "title": body.get("title"),
            "description": body.get("description"),
            "venue": body.get("venue"),
            "start_date": start_date,
            "category": body.get("category", "other"),
            "organizer_id": user_id,
            "organizer_name": user.get("organization_name") or f"{user.get('first_name')} {user.get('last_name')}",
            "created_at": datetime.utcnow().isoformat(),
            "status": body.get("status", "active"),
            "access_code": body.get("access_code"),
            "state": body.get("state"),
            "lga": body.get("lga"),
            "date": body.get("date"),
            "time": body.get("time"),
            # New fields
            "ticketTiers": ticket_tiers,
            "total_tickets": total_tickets,
            "tickets_sold": 0,
            "images": images,
            "enableLivestream": body.get("enableLivestream", False),
            "isLive": False,  # Will be toggled by organizer
            # Backward compatibility
            "ticket_price": ticket_tiers[0]["price"] if ticket_tiers else 0,
        }
        
        events_database[event_id] = event
        print(f"✅ Event created: {event_id} - {event['title']} by {event['organizer_name']}")
        print(f"   - Ticket tiers: {len(ticket_tiers)}")
        print(f"   - Images: {len(images)}")
        print(f"   - Livestream enabled: {event['enableLivestream']}")
        
        return {
            "success": True,
            "message": "Event created successfully",
            "data": {
                "event_id": event_id,
                "event": event
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/events/{event_id}")
async def get_event_by_id(event_id: str):
    """Get event details by ID"""
    try:
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        return {
            "success": True,
            "data": event
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.put("/api/events/{event_id}")
async def update_event(event_id: str, request: Request):
    """Update an existing event (organizer only)"""
    print(f"🚀 UPDATE_EVENT CALLED: {event_id}")
    try:
        print(f"🔍 Updating event {event_id}")
        
        # Get authenticated user from JWT token
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        user_role = user.get("role")
        
        print(f"🔍 User authenticated: {user_id}, role: {user_role}")
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        print(f"🔍 Event found, organizer_id: {event['organizer_id']}")
        
        # Check if user is the organizer or admin
        if event["organizer_id"] != user_id and user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "You can only update your own events"
                    }
                }
            )
        
        body = await request.json()
        
        # Track changes for notifications
        changes = []
        
        # Update fields if provided
        if "title" in body and body["title"] != event.get("title"):
            changes.append(f"Title changed from '{event.get('title')}' to '{body['title']}'")
            event["title"] = body["title"]
        
        if "description" in body and body["description"] != event.get("description"):
            event["description"] = body["description"]
        
        if "venue" in body and body["venue"] != event.get("venue"):
            changes.append(f"Venue changed from '{event.get('venue')}' to '{body['venue']}'")
            event["venue"] = body["venue"]
        
        if "date" in body or "time" in body:
            date_str = body.get("date", event.get("start_date", "").split("T")[0])
            time_str = body.get("time", event.get("start_date", "").split("T")[1][:5] if "T" in event.get("start_date", "") else "00:00")
            new_start_date = f"{date_str}T{time_str}:00Z"
            if new_start_date != event.get("start_date"):
                changes.append(f"Date/time changed to {date_str} at {time_str}")
                event["start_date"] = new_start_date
        
        if "ticketPrice" in body:
            new_price = float(body["ticketPrice"])
            if new_price != event.get("ticket_price"):
                changes.append(f"Ticket price changed from ₦{event.get('ticket_price')} to ₦{new_price}")
                event["ticket_price"] = new_price
        
        if "totalTickets" in body:
            new_total = int(body["totalTickets"])
            if new_total != event.get("total_tickets"):
                event["total_tickets"] = new_total
        
        if "category" in body:
            event["category"] = body["category"]
        
        if "status" in body:
            if body["status"] != event.get("status"):
                changes.append(f"Status changed to {body['status']}")
                event["status"] = body["status"]
                
                # Add postponement/cancellation reason
                if body["status"] in ["postponed", "cancelled"] and body.get("postponementReason"):
                    event["postponement_reason"] = body["postponementReason"]
                    changes.append(f"Reason: {body['postponementReason']}")
        
        # Handle livestream toggle
        if "enableLivestream" in body:
            event["enableLivestream"] = body["enableLivestream"]
            if body["enableLivestream"]:
                changes.append("Livestream enabled")
            else:
                changes.append("Livestream disabled")
                event["isLive"] = False  # Stop live stream if disabled
        
        # Handle live status toggle (separate from enableLivestream)
        if "isLive" in body and event.get("enableLivestream"):
            event["isLive"] = body["isLive"]
            if body["isLive"]:
                changes.append("Event is now LIVE")
            else:
                changes.append("Event livestream ended")
        
        event["updated_at"] = datetime.utcnow().isoformat()
        
        # Send notifications if requested and there are significant changes
        notify_attendees = body.get("notifyAttendees", False)
        if changes and notify_attendees:
            await send_event_change_notifications(event_id, changes)
        
        print(f"📝 Event updated: {event_id} - Changes: {', '.join(changes)}")
        if notify_attendees:
            print(f"📧 Notifications sent to ticket holders")
        
        return {
            "success": True,
            "message": "Event updated successfully",
            "data": {
                "event": event,
                "changes": changes,
                "notifications_sent": notify_attendees and len(changes) > 0
            }
        }
    except HTTPException:
        raise
    except ValueError as e:
        print(f"❌ JWT validation failed: {e}")
        raise HTTPException(
            status_code=401,
            detail={
                "success": False,
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": "Authentication failed"
                }
            }
        )
    except Exception as e:
        print(f"❌ Error updating event: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.delete("/api/events/{event_id}")
async def delete_event(event_id: str, request: Request):
    """Delete an event (organizer only)"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        # Check if user is authenticated
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        
        # Check if user is the organizer or admin
        user_role = user_database[user_id].get("role")
        if event["organizer_id"] != user_id and user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "You can only delete your own events"
                    }
                }
            )
        
        # Check if tickets have been sold
        if event.get("tickets_sold", 0) > 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "TICKETS_SOLD",
                        "message": "Cannot delete event with sold tickets. Cancel the event instead."
                    }
                }
            )
        
        # Delete event
        del events_database[event_id]
        print(f"🗑️ Event deleted: {event_id}")
        
        return {
            "success": True,
            "message": "Event deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error deleting event: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# LIVESTREAM CONTROL ENDPOINTS
# ============================================================================

@app.post("/api/events/{event_id}/livestream/start")
async def start_livestream(event_id: str, request: Request):
    """Start livestream for an event (organizer only)"""
    try:
        # Get authenticated user
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        user_role = user.get("role")
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        
        # Check if user is the organizer or admin
        if event["organizer_id"] != user_id and user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Only event organizers can control livestream"
                    }
                }
            )
        
        # Check if livestream is enabled for this event
        if not event.get("enableLivestream"):
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "LIVESTREAM_DISABLED",
                        "message": "Livestream is not enabled for this event"
                    }
                }
            )
        
        # Start the livestream
        event["isLive"] = True
        event["livestream_started_at"] = datetime.utcnow().isoformat()
        
        print(f"🔴 Livestream started for event: {event_id} - {event['title']}")
        
        return {
            "success": True,
            "message": "Livestream started successfully",
            "data": {
                "event_id": event_id,
                "isLive": True,
                "started_at": event["livestream_started_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error starting livestream: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.post("/api/events/{event_id}/livestream/stop")
async def stop_livestream(event_id: str, request: Request):
    """Stop livestream for an event (organizer only)"""
    try:
        # Get authenticated user
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        user_role = user.get("role")
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        
        # Check if user is the organizer or admin
        if event["organizer_id"] != user_id and user_role != "admin":
            raise HTTPException(
                status_code=403,
                detail={
                    "success": False,
                    "error": {
                        "code": "FORBIDDEN",
                        "message": "Only event organizers can control livestream"
                    }
                }
            )
        
        # Stop the livestream
        event["isLive"] = False
        event["livestream_ended_at"] = datetime.utcnow().isoformat()
        
        print(f"⏹️ Livestream stopped for event: {event_id} - {event['title']}")
        
        return {
            "success": True,
            "message": "Livestream stopped successfully",
            "data": {
                "event_id": event_id,
                "isLive": False,
                "ended_at": event["livestream_ended_at"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error stopping livestream: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# SPRAY MONEY ENDPOINTS - Livestream Tipping
# ============================================================================

@app.post("/api/events/{event_id}/spray-money")
async def spray_money(event_id: str, request: Request):
    """Send spray money (tip) during an event"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        # Check if user is authenticated
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        body = await request.json()
        amount = float(body.get("amount", 0))
        sprayer_name = body.get("sprayer_name")  # Optional, can be anonymous
        is_anonymous = body.get("is_anonymous", False)
        message = body.get("message", "")
        
        # Validate amount
        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Amount must be greater than 0"
                    }
                }
            )
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        
        # Check user wallet balance
        user = user_database[user_id]
        if user.get("wallet_balance", 0) < amount:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "INSUFFICIENT_FUNDS",
                        "message": "Insufficient wallet balance"
                    }
                }
            )
        
        # Deduct from sprayer wallet
        user_database[user_id]["wallet_balance"] -= amount
        
        # Add to organizer wallet
        organizer_id = event.get("organizer_id")
        if organizer_id and organizer_id in user_database:
            user_database[organizer_id]["wallet_balance"] = user_database[organizer_id].get("wallet_balance", 0) + amount
        
        # Create spray transaction
        spray_id = str(uuid.uuid4())
        display_name = "Anonymous" if is_anonymous else (sprayer_name or f"{user.get('first_name')} {user.get('last_name')}")
        
        spray_transaction = {
            "id": spray_id,
            "event_id": event_id,
            "sprayer_id": user_id,
            "sprayer_name": display_name,
            "amount": amount,
            "message": message,
            "is_anonymous": is_anonymous,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Store in database
        if event_id not in spray_money_database:
            spray_money_database[event_id] = []
        
        spray_money_database[event_id].append(spray_transaction)
        
        print(f"💸 Spray money: {display_name} sprayed ₦{amount} at event {event_id}")
        
        # TODO: Broadcast to WebSocket for real-time updates
        
        return {
            "success": True,
            "message": "Spray money sent successfully",
            "data": {
                "spray_id": spray_id,
                "amount": amount,
                "new_balance": user_database[user_id]["wallet_balance"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing spray money: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/events/{event_id}/spray-money-leaderboard")
async def get_spray_money_leaderboard(event_id: str, limit: int = 10):
    """Get spray money leaderboard for an event"""
    try:
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        # Get all spray transactions for this event
        sprays = spray_money_database.get(event_id, [])
        
        # Aggregate by sprayer
        sprayer_totals = {}
        for spray in sprays:
            sprayer_name = spray["sprayer_name"]
            if sprayer_name not in sprayer_totals:
                sprayer_totals[sprayer_name] = {
                    "sprayer_name": sprayer_name,
                    "total_amount": 0,
                    "spray_count": 0,
                    "is_anonymous": spray["is_anonymous"]
                }
            sprayer_totals[sprayer_name]["total_amount"] += spray["amount"]
            sprayer_totals[sprayer_name]["spray_count"] += 1
        
        # Sort by total amount and get top sprayers
        leaderboard = sorted(
            sprayer_totals.values(),
            key=lambda x: x["total_amount"],
            reverse=True
        )[:limit]
        
        # Add rank
        for i, entry in enumerate(leaderboard):
            entry["rank"] = i + 1
        
        # Calculate total sprayed
        total_sprayed = sum(spray["amount"] for spray in sprays)
        
        return {
            "success": True,
            "data": {
                "leaderboard": leaderboard,
                "total_sprayed": total_sprayed,
                "total_sprays": len(sprays)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error getting leaderboard: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/events/{event_id}/spray-money-feed")
async def get_spray_money_feed(event_id: str, limit: int = 50):
    """Get recent spray money transactions for an event"""
    try:
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        # Get spray transactions
        sprays = spray_money_database.get(event_id, [])
        
        # Sort by created_at descending and limit
        recent_sprays = sorted(
            sprays,
            key=lambda x: x["created_at"],
            reverse=True
        )[:limit]
        
        return {
            "success": True,
            "data": {
                "sprays": recent_sprays,
                "count": len(recent_sprays)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# WALLET ENDPOINTS
# ============================================================================

@app.get("/api/payments/wallet/balance")
async def get_wallet_balance(request: Request):
    """Get user wallet balance"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        user = user_database[user_id]
        balance = user.get("wallet_balance", 0)
        
        return {
            "success": True,
            "data": {
                "balance": balance,
                "currency": "NGN"
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.post("/api/payments/wallet/topup")
async def topup_wallet(request: Request):
    """Top up wallet balance"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        body = await request.json()
        amount = float(body.get("amount", 0))
        payment_method = body.get("payment_method", "card")
        
        if amount <= 0:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Amount must be greater than 0"
                    }
                }
            )
        
        # Add to wallet
        user_database[user_id]["wallet_balance"] = user_database[user_id].get("wallet_balance", 0) + amount
        new_balance = user_database[user_id]["wallet_balance"]
        
        print(f"💰 Wallet top-up: User {user_id} added ₦{amount}. New balance: ₦{new_balance}")
        
        return {
            "success": True,
            "message": "Wallet topped up successfully",
            "data": {
                "amount": amount,
                "new_balance": new_balance,
                "payment_method": payment_method
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/payments/wallet/transactions")
async def get_wallet_transactions(request: Request):
    """Get wallet transaction history"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        # Mock transaction history
        transactions = [
            {
                "id": "txn_001",
                "type": "topup",
                "amount": 10000,
                "description": "Wallet top-up",
                "created_at": datetime.utcnow().isoformat()
            }
        ]
        
        return {
            "success": True,
            "data": {
                "transactions": transactions,
                "count": len(transactions)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# TICKET PURCHASE ENDPOINTS
# ============================================================================

# Initialize tickets database
tickets_database: Dict[str, Dict[str, Any]] = {}

@app.post("/api/tickets/purchase")
async def purchase_ticket(request: Request):
    """Purchase event tickets"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        body = await request.json()
        event_id = body.get("event_id")
        quantity = int(body.get("quantity", 1))
        payment_method = body.get("payment_method", "wallet")
        
        # Validate event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        ticket_price = event.get("ticket_price", event.get("price", 0))
        total_price = ticket_price * quantity
        
        # Check wallet balance if paying with wallet
        if payment_method == "wallet":
            user_balance = user_database[user_id].get("wallet_balance", 0)
            if user_balance < total_price:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "success": False,
                        "error": {
                            "code": "INSUFFICIENT_FUNDS",
                            "message": "Insufficient wallet balance"
                        }
                    }
                )
            
            # Deduct from wallet
            user_database[user_id]["wallet_balance"] -= total_price
        
        # Create tickets
        tickets = []
        for i in range(quantity):
            ticket_id = str(uuid.uuid4())
            ticket = {
                "id": ticket_id,
                "event_id": event_id,
                "user_id": user_id,
                "event_title": event["title"],
                "event_date": event.get("date", event.get("startDate", "")),
                "event_venue": event.get("venue", ""),
                "price": ticket_price,
                "status": "valid",
                "qr_code": f"QR_{ticket_id}",
                "purchased_at": datetime.utcnow().isoformat()
            }
            tickets_database[ticket_id] = ticket
            tickets.append(ticket)
        
        print(f"🎫 Ticket purchase: User {user_id} bought {quantity} tickets for event {event_id}")
        
        return {
            "success": True,
            "message": "Tickets purchased successfully",
            "data": {
                "tickets": tickets,
                "total_price": total_price,
                "payment_method": payment_method
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error purchasing tickets: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/tickets/my-tickets")
async def get_my_tickets(request: Request):
    """Get user's purchased tickets"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        # Get user's tickets
        user_tickets = [
            ticket for ticket in tickets_database.values()
            if ticket["user_id"] == user_id
        ]
        
        return {
            "success": True,
            "data": {
                "tickets": user_tickets,
                "count": len(user_tickets)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# GROUP BUY / BULK PURCHASE ENDPOINTS
# ============================================================================

@app.post("/api/tickets/bulk-purchase")
async def create_bulk_purchase(request: Request):
    """Create a bulk ticket purchase with optional split payments"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        # Check if user is authenticated
        if not user_id or user_id not in user_database:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        body = await request.json()
        event_id = body.get("event_id")
        quantity = int(body.get("quantity", 0))
        buyer_type = body.get("buyer_type", "individual")  # individual or organization
        organization_name = body.get("organization_name")
        enable_split_payment = body.get("enable_split_payment", False)
        
        # Validate inputs
        if not event_id or quantity < 1:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Event ID and quantity (min 1) are required"
                    }
                }
            )
        
        # Check if event exists
        if event_id not in events_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Event not found"
                    }
                }
            )
        
        event = events_database[event_id]
        ticket_price = event.get("ticket_price", 0)
        
        # Calculate bulk discount
        discount_percentage = 0
        if quantity >= 21:
            discount_percentage = 15
        elif quantity >= 11:
            discount_percentage = 10
        elif quantity >= 6:
            discount_percentage = 5
        
        total_amount = ticket_price * quantity
        discount_amount = total_amount * (discount_percentage / 100)
        final_amount = total_amount - discount_amount
        
        # Create bulk purchase
        purchase_id = str(uuid.uuid4())
        bulk_purchase = {
            "id": purchase_id,
            "event_id": event_id,
            "event_title": event.get("title"),
            "buyer_id": user_id,
            "buyer_name": f"{user_database[user_id].get('first_name')} {user_database[user_id].get('last_name')}",
            "buyer_type": buyer_type,
            "organization_name": organization_name,
            "quantity": quantity,
            "ticket_price": ticket_price,
            "total_amount": total_amount,
            "discount_percentage": discount_percentage,
            "discount_amount": discount_amount,
            "final_amount": final_amount,
            "enable_split_payment": enable_split_payment,
            "status": "pending" if enable_split_payment else "completed",
            "paid_count": 0 if enable_split_payment else quantity,
            "created_at": datetime.utcnow().isoformat()
        }
        
        bulk_purchases_database[purchase_id] = bulk_purchase
        
        # Generate split payment links if enabled
        split_links = []
        if enable_split_payment:
            share_amount = final_amount / quantity
            bulk_purchase_shares_database[purchase_id] = []
            
            for i in range(quantity):
                share_id = str(uuid.uuid4())
                share_link = f"pay/{purchase_id}/{share_id}"
                
                share = {
                    "id": share_id,
                    "bulk_purchase_id": purchase_id,
                    "share_number": i + 1,
                    "share_link": share_link,
                    "amount": share_amount,
                    "status": "pending",
                    "paid_by_user_id": None,
                    "paid_at": None,
                    "created_at": datetime.utcnow().isoformat()
                }
                
                bulk_purchase_shares_database[purchase_id].append(share)
                split_links.append({
                    "share_number": i + 1,
                    "link": f"http://localhost:3000/payment-share/{share_link}",
                    "qr_code": f"QR_{share_id}",
                    "amount": share_amount
                })
        
        print(f"✅ Bulk purchase created: {purchase_id} - {quantity} tickets with {discount_percentage}% discount")
        
        return {
            "success": True,
            "message": "Bulk purchase created successfully",
            "data": {
                "purchase_id": purchase_id,
                "purchase": bulk_purchase,
                "discount_percentage": discount_percentage,
                "split_links": split_links if enable_split_payment else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error creating bulk purchase: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/tickets/bulk-purchase/{purchase_id}")
async def get_bulk_purchase(purchase_id: str, request: Request):
    """Get bulk purchase details"""
    try:
        if purchase_id not in bulk_purchases_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Bulk purchase not found"
                    }
                }
            )
        
        bulk_purchase = bulk_purchases_database[purchase_id]
        shares = bulk_purchase_shares_database.get(purchase_id, [])
        
        return {
            "success": True,
            "data": {
                "bulk_purchase": bulk_purchase,
                "shares": shares
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.post("/api/tickets/bulk-purchase/{purchase_id}/pay-share")
async def pay_share(purchase_id: str, request: Request):
    """Pay for a share of a bulk purchase"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        body = await request.json()
        share_id = body.get("share_id")
        payment_method = body.get("payment_method", "wallet")
        
        # Check if bulk purchase exists
        if purchase_id not in bulk_purchases_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Bulk purchase not found"
                    }
                }
            )
        
        # Find the share
        shares = bulk_purchase_shares_database.get(purchase_id, [])
        share = next((s for s in shares if s["id"] == share_id), None)
        
        if not share:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Share not found"
                    }
                }
            )
        
        # Check if already paid
        if share["status"] == "paid":
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "ALREADY_PAID",
                        "message": "This share has already been paid"
                    }
                }
            )
        
        # Process payment (mock)
        share["status"] = "paid"
        share["paid_by_user_id"] = user_id
        share["paid_at"] = datetime.utcnow().isoformat()
        
        # Update bulk purchase
        bulk_purchase = bulk_purchases_database[purchase_id]
        bulk_purchase["paid_count"] += 1
        
        # Check if all shares are paid
        all_paid = all(s["status"] == "paid" for s in shares)
        if all_paid:
            bulk_purchase["status"] = "completed"
            # TODO: Issue tickets to all participants
            print(f"✅ All shares paid for bulk purchase {purchase_id}. Issuing tickets...")
        
        print(f"✅ Share {share_id} paid by user {user_id}")
        
        return {
            "success": True,
            "message": "Payment successful",
            "data": {
                "share": share,
                "bulk_purchase_status": bulk_purchase["status"],
                "paid_count": bulk_purchase["paid_count"],
                "total_count": bulk_purchase["quantity"]
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing share payment: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/tickets/bulk-purchase/{purchase_id}/status")
async def get_bulk_purchase_status(purchase_id: str):
    """Get payment status for a bulk purchase"""
    try:
        if purchase_id not in bulk_purchases_database:
            raise HTTPException(
                status_code=404,
                detail={
                    "success": False,
                    "error": {
                        "code": "NOT_FOUND",
                        "message": "Bulk purchase not found"
                    }
                }
            )
        
        bulk_purchase = bulk_purchases_database[purchase_id]
        shares = bulk_purchase_shares_database.get(purchase_id, [])
        
        # Get payment status for each share
        share_statuses = []
        for share in shares:
            status_info = {
                "share_number": share["share_number"],
                "status": share["status"],
                "amount": share["amount"],
                "paid_by": None,
                "paid_at": share.get("paid_at")
            }
            
            if share["paid_by_user_id"] and share["paid_by_user_id"] in user_database:
                user = user_database[share["paid_by_user_id"]]
                status_info["paid_by"] = f"{user.get('first_name')} {user.get('last_name')}"
            
            share_statuses.append(status_info)
        
        return {
            "success": True,
            "data": {
                "purchase_id": purchase_id,
                "status": bulk_purchase["status"],
                "total_shares": bulk_purchase["quantity"],
                "paid_shares": bulk_purchase["paid_count"],
                "pending_shares": bulk_purchase["quantity"] - bulk_purchase["paid_count"],
                "share_statuses": share_statuses
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# TEST DATA ENDPOINTS - For creating sample data
# ============================================================================

@app.post("/api/events/validate-access-code")
async def validate_access_code(request: Request):
    """Validate access code for hidden events"""
    try:
        body = await request.json()
        access_code = body.get("access_code")
        
        if not access_code:
            raise HTTPException(
                status_code=400,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Access code is required"
                    }
                }
            )
        
        # Search for event with this access code
        for event_id, event in events_database.items():
            if event.get("access_code") == access_code:
                print(f"✅ Access code validated: {access_code} for event {event_id}")
                return {
                    "success": True,
                    "message": "Access code valid",
                    "data": {
                        "event": event
                    }
                }
        
        # Access code not found
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "error": {
                    "code": "INVALID_CODE",
                    "message": "Invalid access code"
                }
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error validating access code: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

# ============================================================================
# USER PREFERENCES ENDPOINTS
# ============================================================================

# In-memory bulk purchases database
bulk_purchases_database: Dict[str, Dict[str, Any]] = {}
bulk_purchase_shares_database: Dict[str, List[Dict[str, Any]]] = {}
# In-memory spray money database
spray_money_database: Dict[str, List[Dict[str, Any]]] = {}

@app.post("/api/users/preferences")
async def save_user_preferences(request: Request):
    """Save user event preferences"""
    try:
        # Validate JWT token and get user info
        user_info = await get_user_from_request(request)
        user_id = user_info.get("user_id")
        
        # Check if user is authenticated
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        body = await request.json()
        event_preferences = body.get("preferences", body.get("event_preferences", []))
        
        # Store preferences in user data (create user if doesn't exist)
        if user_id not in user_database:
            user_database[user_id] = {
                "id": user_id,
                "email": user_info.get("email"),
                "role": user_info.get("role", "attendee"),
                "event_preferences": [],
                "wallet_balance": 10000
            }
        
        user_database[user_id]["event_preferences"] = event_preferences
        user_database[user_id]["preferences_updated_at"] = datetime.utcnow().isoformat()
        
        print(f"✅ Preferences saved for user {user_id}: {event_preferences}")
        
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
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.get("/api/users/preferences")
async def get_user_preferences(request: Request):
    """Get user event preferences"""
    try:
        # Validate JWT token and get user info
        user_info = await get_user_from_request(request)
        user_id = user_info.get("user_id")
        
        # Check if user is authenticated
        if not user_id:
            raise HTTPException(
                status_code=401,
                detail={
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "User not authenticated"
                    }
                }
            )
        
        # Get user data (create if doesn't exist)
        if user_id not in user_database:
            user_database[user_id] = {
                "id": user_id,
                "email": user_info.get("email"),
                "role": user_info.get("role", "attendee"),
                "event_preferences": [],
                "wallet_balance": 10000
            }
        
        user_data = user_database[user_id]
        event_preferences = user_data.get("event_preferences", [])
        
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
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.post("/api/test/create-event")
async def create_test_event(request: Request):
    """Create a test event (for testing only)"""
    try:
        body = await request.json()
        event_id = str(uuid.uuid4())
        
        event = {
            "id": event_id,
            "title": body.get("title", "Test Event"),
            "description": body.get("description", "A test event"),
            "venue": body.get("venue", "Test Venue"),
            "start_date": body.get("start_date", "2024-02-01T18:00:00Z"),
            "organizer_id": body.get("organizer_id", "test-organizer"),
            "created_at": datetime.utcnow().isoformat()
        }
        
        events_database[event_id] = event
        print(f"✅ Test event created: {event_id}")
        
        return {
            "success": True,
            "message": "Test event created",
            "data": event
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/test/create-ticket")
async def create_test_ticket(request: Request):
    """Create a test ticket (for testing only)"""
    try:
        body = await request.json()
        ticket_id = str(uuid.uuid4())
        
        ticket = {
            "id": ticket_id,
            "event_id": body.get("event_id"),
            "user_id": body.get("user_id"),
            "quantity": body.get("quantity", 1),
            "amount": body.get("amount", 5000.0),
            "created_at": datetime.utcnow().isoformat()
        }
        
        tickets_database.append(ticket)
        print(f"✅ Test ticket created: {ticket_id}")
        
        return {
            "success": True,
            "message": "Test ticket created",
            "data": ticket
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/test/send-notification")
async def send_test_notification(request: Request):
    """Send a test notification (for testing only)"""
    try:
        body = await request.json()
        user_id = body.get("user_id")
        
        if user_id not in notifications_database:
            notifications_database[user_id] = []
        
        notification = {
            "id": f"notif_{user_id}_{int(time.time() * 1000)}",
            "type": body.get("type", "alert"),
            "title": body.get("title", "Test Notification"),
            "message": body.get("message", "This is a test notification"),
            "data": body.get("data", {}),
            "read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        
        notifications_database[user_id].append(notification)
        print(f"✅ Test notification sent to {user_id}")
        
        return {
            "success": True,
            "message": "Test notification sent",
            "data": notification
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

# ============================================================================
# ADMIN DASHBOARD ENDPOINTS - Real-time data
# ============================================================================

@app.get("/api/admin/dashboard/stats")
async def get_dashboard_stats(request: Request):
    """Get dashboard statistics"""
    # Count users by role
    total_users = len(user_database)
    
    # Count active events (mock - all events are active)
    active_events = len(events_database)
    
    # Count tickets sold
    tickets_sold = len(tickets_database)
    
    # Calculate platform revenue (mock - 5% commission on ticket sales)
    platform_revenue = sum(ticket.get("amount", 0) * 0.05 for ticket in tickets_database)
    
    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "active_events": active_events,
            "tickets_sold": tickets_sold,
            "platform_revenue": platform_revenue
        }
    }

@app.get("/api/admin/dashboard/activity")
async def get_recent_activity(limit: int = 10):
    """Get recent platform activity"""
    activity = []
    
    # Add user registration activities
    for user_id, user_data in list(user_database.items())[-5:]:
        activity.append({
            "type": "user_registration",
            "title": f"New {user_data.get('role', 'user')} registered",
            "description": f"{user_data.get('first_name', 'User')} {user_data.get('last_name', '')} ({user_data.get('phone_number', 'N/A')})",
            "timestamp": datetime.fromtimestamp(user_data.get('created_at', time.time())).isoformat(),
            "icon": "👤"
        })
    
    # Add event creation activities
    for event_id, event_data in list(events_database.items())[-3:]:
        activity.append({
            "type": "event_created",
            "title": "New event created",
            "description": event_data.get('title', 'Event'),
            "timestamp": event_data.get('created_at', datetime.utcnow().isoformat()),
            "icon": "🎉"
        })
    
    # Add ticket sale activities
    for ticket in list(tickets_database)[-2:]:
        activity.append({
            "type": "ticket_sale",
            "title": "Ticket sold",
            "description": f"{ticket.get('quantity', 1)} ticket(s) for ₦{ticket.get('amount', 0):,.2f}",
            "timestamp": ticket.get('created_at', datetime.utcnow().isoformat()),
            "icon": "🎫"
        })
    
    # Sort by timestamp descending and limit
    activity = sorted(activity, key=lambda x: x.get('timestamp', ''), reverse=True)[:limit]
    
    return {
        "success": True,
        "data": activity,
        "count": len(activity)
    }

@app.get("/api/admin/dashboard/pending-actions")
async def get_pending_actions():
    """Get pending actions"""
    # Count organizers pending verification (mock - 0 for now)
    organizer_verifications = 0
    
    # Count flagged events (mock - 0 for now)
    flagged_events = 0
    
    # Count support tickets (mock - 0 for now)
    support_tickets = 0
    
    return {
        "success": True,
        "data": {
            "organizer_verifications": organizer_verifications,
            "flagged_events": flagged_events,
            "support_tickets": support_tickets
        }
    }

@app.get("/api/admin/dashboard/user-breakdown")
async def get_user_breakdown():
    """Get user breakdown by role"""
    attendee_count = sum(1 for u in user_database.values() if u.get('role') == 'attendee')
    organizer_count = sum(1 for u in user_database.values() if u.get('role') == 'organizer')
    admin_count = sum(1 for u in user_database.values() if u.get('role') == 'admin')
    
    return {
        "success": True,
        "data": {
            "attendee": attendee_count,
            "organizer": organizer_count,
            "admin": admin_count
        }
    }

@app.get("/api/admin/dashboard/event-breakdown")
async def get_event_breakdown():
    """Get event breakdown by status"""
    # Mock: all events are upcoming
    upcoming = len(events_database)
    past = 0
    cancelled = 0
    
    return {
        "success": True,
        "data": {
            "upcoming": upcoming,
            "past": past,
            "cancelled": cancelled
        }
    }

@app.get("/api/admin/dashboard/top-events")
async def get_top_events(limit: int = 5):
    """Get top events by ticket sales"""
    # Count tickets per event
    event_ticket_counts = {}
    event_revenue = {}
    
    for ticket in tickets_database:
        event_id = ticket.get('event_id')
        if event_id not in event_ticket_counts:
            event_ticket_counts[event_id] = 0
            event_revenue[event_id] = 0
        event_ticket_counts[event_id] += ticket.get('quantity', 1)
        event_revenue[event_id] += ticket.get('amount', 0)
    
    # Build top events list
    top_events = []
    for event_id, ticket_count in sorted(event_ticket_counts.items(), key=lambda x: x[1], reverse=True)[:limit]:
        event = events_database.get(event_id, {})
        top_events.append({
            "id": event_id,
            "title": event.get('title', 'Event'),
            "tickets_sold": ticket_count,
            "revenue": event_revenue.get(event_id, 0),
            "organizer": event.get('organizer_id', 'N/A')
        })
    
    return {
        "success": True,
        "data": top_events,
        "count": len(top_events)
    }

# ============================================================================
# NOTIFICATION ENDPOINTS - Real-time notifications
# ============================================================================

@app.get("/api/notifications")
async def get_notifications(limit: int = 50, unread_only: bool = False, request: Request = None):
    """Get notifications for current user"""
    try:
        # Get authenticated user
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        
        # Get user notifications or return empty list
        user_notifications = notifications_database.get(user_id, [])
        
        # Filter by unread if requested
        if unread_only:
            user_notifications = [n for n in user_notifications if not n.get("is_read", False)]
        
        # Sort by created_at descending and limit
        user_notifications = sorted(
            user_notifications,
            key=lambda x: x.get("created_at", 0),
            reverse=True
        )[:limit]
        
        return {
            "success": True,
            "data": {
                "notifications": user_notifications
            },
            "count": len(user_notifications)
        }
        
    except Exception as e:
        print(f"❌ Error getting notifications: {e}")
        return {
            "success": True,
            "data": {
                "notifications": []
            },
            "count": 0
        }

@app.get("/api/notifications/unread-count")
async def get_unread_count(request: Request = None):
    """Get count of unread notifications"""
    # Extract user from Authorization header
    auth_header = request.headers.get("Authorization", "") if request else ""
    user_id = None
    if auth_header.startswith("Bearer mock_access_token_"):
        user_id = auth_header.replace("Bearer mock_access_token_", "")
    
    # Count unread notifications for user
    user_notifications = notifications_database.get(user_id, [])
    unread_count = len([n for n in user_notifications if not n.get("read", False)])
    
    return {
        "success": True,
        "unread_count": unread_count
    }

@app.put("/api/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    """Mark a notification as read"""
    try:
        # Get authenticated user
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        
        # Find and mark notification as read
        user_notifications = notifications_database.get(user_id, [])
        
        for notification in user_notifications:
            if notification.get("id") == notification_id:
                notification["is_read"] = True
                print(f"📧 Notification marked as read: {notification_id}")
                return {
                    "success": True,
                    "message": "Notification marked as read"
                }
        
        raise HTTPException(
            status_code=404,
            detail={
                "success": False,
                "error": {
                    "code": "NOT_FOUND",
                    "message": "Notification not found"
                }
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error marking notification as read: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )

@app.put("/api/notifications/mark-all-read")
async def mark_all_notifications_read(request: Request):
    """Mark all notifications as read for current user"""
    try:
        # Get authenticated user
        user = await get_user_from_request(request)
        user_id = user.get("user_id")
        
        # Mark all notifications as read
        user_notifications = notifications_database.get(user_id, [])
        
        for notification in user_notifications:
            notification["is_read"] = True
        
        print(f"📧 All notifications marked as read for user: {user_id}")
        
        return {
            "success": True,
            "message": f"Marked {len(user_notifications)} notifications as read"
        }
        
    except Exception as e:
        print(f"❌ Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": str(e)
                }
            }
        )
    user_notifications = notifications_database.get(user_id, [])
    for notification in user_notifications:
        if notification.get("id") == notification_id:
            notification["read"] = True
            return {
                "success": True,
                "message": "Notification marked as read"
            }
    
    return {
        "success": False,
        "error": "Notification not found"
    }

@app.put("/api/notifications/mark-all-read")
async def mark_all_read(request: Request = None):
    """Mark all notifications as read"""
    # Extract user from Authorization header
    auth_header = request.headers.get("Authorization", "") if request else ""
    user_id = None
    if auth_header.startswith("Bearer mock_access_token_"):
        user_id = auth_header.replace("Bearer mock_access_token_", "")
    
    # Mark all notifications as read for user
    user_notifications = notifications_database.get(user_id, [])
    for notification in user_notifications:
        notification["read"] = True
    
    return {
        "success": True,
        "message": "All notifications marked as read"
    }

@app.post("/api/notifications/broadcast")
async def send_broadcast(request: Request):
    """Send broadcast notification (admin only)"""
    try:
        # Extract user from Authorization header
        auth_header = request.headers.get("Authorization", "")
        user_id = None
        if auth_header.startswith("Bearer mock_access_token_"):
            user_id = auth_header.replace("Bearer mock_access_token_", "")
        
        print(f"🔐 Broadcast Auth Header: {auth_header[:50]}...")
        print(f"🔐 Extracted user_id: {user_id}")
        print(f"🔐 User in database: {user_id in user_database if user_id else False}")
        
        # Check if user is admin
        if not user_id or user_id not in user_database:
            print(f"❌ User not found in database")
            return {
                "success": False,
                "error": "User not found"
            }
        
        user_role = user_database[user_id].get("role")
        print(f"🔐 User role: {user_role}")
        
        if user_role != "admin":
            print(f"❌ User is not admin")
            return {
                "success": False,
                "error": "Only admins can send broadcasts"
            }
        
        body = await request.json()
        title = body.get("title")
        message = body.get("message")
        target_roles = body.get("target_roles")  # Optional: ["attendee", "organizer", "admin"]
        
        print(f"📢 Broadcasting: title={title}, message={message}, target_roles={target_roles}")
        
        # Create broadcast notification for all users or specific roles
        recipients = 0
        for uid, user_data in user_database.items():
            # Check if user matches target roles
            if target_roles and user_data.get("role") not in target_roles:
                continue
            
            # Create notification for user
            if uid not in notifications_database:
                notifications_database[uid] = []
            
            notification = {
                "id": f"notif_{uid}_{int(time.time() * 1000)}",
                "type": "broadcast",
                "title": title,
                "message": message,
                "data": {"target_roles": target_roles},
                "read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            notifications_database[uid].append(notification)
            recipients += 1
        
        print(f"📢 Broadcast sent to {recipients} users")
        
        return {
            "success": True,
            "message": f"Broadcast sent to {recipients} users",
            "recipients": recipients
        }
    except Exception as e:
        print(f"❌ Error sending broadcast: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/notifications/ticket-sale")
async def notify_ticket_sale(request: Request):
    """Notify organizer about ticket sale"""
    try:
        body = await request.json()
        event_id = body.get("event_id")
        organizer_id = body.get("organizer_id")
        ticket_count = body.get("ticket_count", 1)
        amount = body.get("amount", 0.0)
        
        # Get event details
        event = events_database.get(event_id, {})
        event_title = event.get("title", "Event")
        
        # Create notification for organizer
        if organizer_id not in notifications_database:
            notifications_database[organizer_id] = []
        
        notification = {
            "id": f"notif_{organizer_id}_{int(time.time() * 1000)}",
            "type": "ticket_sale",
            "title": f"Ticket Sale - {event_title}",
            "message": f"{ticket_count} ticket(s) sold for ₦{amount:,.2f}",
            "data": {
                "event_id": event_id,
                "ticket_count": ticket_count,
                "amount": amount
            },
            "read": False,
            "created_at": datetime.utcnow().isoformat()
        }
        notifications_database[organizer_id].append(notification)
        
        print(f"🎫 Ticket sale notification sent to organizer {organizer_id}")
        
        return {
            "success": True,
            "message": "Ticket sale notification sent"
        }
    except Exception as e:
        print(f"❌ Error notifying ticket sale: {e}")
        return {
            "success": False,
            "error": str(e)
        }

@app.post("/api/notifications/event-update")
async def notify_event_update(request: Request):
    """Notify users about event updates"""
    try:
        body = await request.json()
        event_id = body.get("event_id")
        update_type = body.get("update_type", "update")
        message = body.get("message", "Event has been updated")
        
        # Get event details
        event = events_database.get(event_id, {})
        event_title = event.get("title", "Event")
        
        # Get all users who have tickets for this event
        event_attendees = set()
        for ticket in tickets_database:
            if ticket.get("event_id") == event_id:
                event_attendees.add(ticket.get("user_id"))
        
        # Create notification for each attendee
        recipients = 0
        for user_id in event_attendees:
            if user_id not in notifications_database:
                notifications_database[user_id] = []
            
            notification = {
                "id": f"notif_{user_id}_{int(time.time() * 1000)}",
                "type": f"event_{update_type}",
                "title": f"Event Update - {event_title}",
                "message": message,
                "data": {
                    "event_id": event_id,
                    "update_type": update_type
                },
                "read": False,
                "created_at": datetime.utcnow().isoformat()
            }
            notifications_database[user_id].append(notification)
            recipients += 1
        
        print(f"🎉 Event update notification sent to {recipients} attendees")
        
        return {
            "success": True,
            "message": f"Event update notification sent to {recipients} users",
            "recipients": recipients
        }
    except Exception as e:
        print(f"❌ Error notifying event update: {e}")
        return {
            "success": False,
            "error": str(e)
        }

# Include membership router
from routers.membership import router as membership_router
app.include_router(membership_router)

# Include secret events router
from routers.secret_events import router as secret_events_router
app.include_router(secret_events_router)

# Include anonymous chat router
from routers.anonymous_chat import router as anonymous_chat_router
app.include_router(anonymous_chat_router)

# Include WebSocket router
from routers.websocket import router as websocket_router
app.include_router(websocket_router)

# Include analytics router
from routers.analytics import router as analytics_router
app.include_router(analytics_router)

# Include enhanced wallet router
from routers.wallet import router as wallet_router
app.include_router(wallet_router)

# Include wallet WebSocket router
from routers.wallet_websocket import router as wallet_websocket_router
app.include_router(wallet_websocket_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)