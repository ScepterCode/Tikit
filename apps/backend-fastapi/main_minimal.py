"""
Minimal FastAPI Backend for Quick Startup
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Grooovy API",
    description="Event management platform",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Grooovy API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Server is running"}

# Import and include routers with error handling
try:
    from routers.payments import router as payments_router
    app.include_router(payments_router, prefix="/api/payments", tags=["payments"])
    logger.info("✅ Payments router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load payments router: {e}")

try:
    from routers.events import router as events_router
    app.include_router(events_router, prefix="/api", tags=["events"])
    logger.info("✅ Events router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load events router: {e}")

try:
    from routers.auth import router as auth_router
    app.include_router(auth_router, prefix="/api/auth", tags=["auth"])
    logger.info("✅ Auth router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load auth router: {e}")

try:
    from routers.tickets import router as tickets_router
    app.include_router(tickets_router, prefix="/api/tickets", tags=["tickets"])
    logger.info("✅ Tickets router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load tickets router: {e}")

try:
    from routers.notifications import router as notifications_router
    app.include_router(notifications_router, prefix="/api", tags=["notifications"])
    logger.info("✅ Notifications router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load notifications router: {e}")

try:
    from routers.admin_dashboard import router as admin_router
    app.include_router(admin_router, prefix="/api", tags=["admin"])
    logger.info("✅ Admin router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load admin router: {e}")

try:
    from routers.membership import router as membership_router
    app.include_router(membership_router, tags=["membership"])
    logger.info("✅ Membership router loaded")
except Exception as e:
    logger.error(f"❌ Failed to load membership router: {e}")

# Add simple CSRF token endpoint
@app.get("/api/csrf-token")
async def get_csrf_token():
    """Get CSRF token - simplified for development"""
    return {"csrf_token": "dev-csrf-token", "message": "CSRF protection disabled in development"}

logger.info("🚀 Grooovy FastAPI Backend started successfully!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)