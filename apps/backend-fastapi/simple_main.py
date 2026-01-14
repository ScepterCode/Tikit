"""
Simple FastAPI app for testing integration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI(
    title="Tikit API - Simple",
    description="Simple version for testing integration",
    version="2.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tikit.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"]
)

@app.get("/")
async def root():
    return {
        "message": "Welcome to Tikit API v2.0 - Simple",
        "status": "ok",
        "timestamp": time.time()
    }

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "message": "Tikit FastAPI is running",
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
async def register():
    return {
        "success": True,
        "message": "Registration endpoint working",
        "data": {
            "user": {
                "id": "test-user-id",
                "phoneNumber": "1234567890",
                "firstName": "Test",
                "lastName": "User",
                "role": "attendee"
            }
        }
    }

@app.post("/api/auth/login")
async def login():
    return {
        "success": True,
        "message": "Login endpoint working",
        "data": {
            "user": {
                "id": "test-user-id",
                "phoneNumber": "1234567890",
                "firstName": "Test",
                "lastName": "User",
                "role": "attendee"
            }
        }
    }

@app.get("/api/auth/me")
async def get_current_user():
    return {
        "success": True,
        "message": "Get current user endpoint working",
        "data": {
            "user": {
                "id": "test-user-id",
                "phoneNumber": "1234567890",
                "firstName": "Test",
                "lastName": "User",
                "role": "attendee"
            }
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