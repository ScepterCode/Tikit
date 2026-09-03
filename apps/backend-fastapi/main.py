"""
Grooovy FastAPI Backend - Main Application
High-performance event management API with Supabase integration
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import os
import time
import logging
from typing import Dict, Any

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

ENVIRONMENT = os.getenv("ENVIRONMENT", "production").lower()

# Error tracking must be initialised before the app is constructed so the
# Starlette/FastAPI integrations attach. No-op unless SENTRY_DSN is set.
from observability import init_sentry, capture_exception

init_sentry()

# Import routers
from routers import auth, events, tickets, payments, notifications, analytics, wallet, admin_dashboard, membership, secret_events, anonymous_chat
# from routers import admin  # Temporarily disabled - missing admin_schemas.py
# from routers import realtime  # Temporarily disabled - missing get_current_user_websocket
from services.supabase_client import get_supabase_client
from middleware.rate_limiter import RateLimitMiddleware
from middleware.security import SecurityMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting Grooovy FastAPI Backend...")
    
    # Verify the database is reachable. In production this is fatal: booting
    # "successfully" with no database lets a broken deploy take traffic.
    try:
        supabase = get_supabase_client()
        if not supabase:
            raise RuntimeError("Supabase client not configured (check SUPABASE_URL / SUPABASE_SERVICE_KEY)")
        supabase.table('users').select('id').limit(1).execute()
        logger.info("✅ Supabase connection successful")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
        if ENVIRONMENT == "production":
            raise
        logger.warning("Continuing without a database - development only")

    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Grooovy FastAPI Backend...")

# Create FastAPI app
app = FastAPI(
    title="Grooovy API",
    description="High-performance event management platform with real-time features",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

def _csv_env(name: str) -> list:
    """Parse a comma-separated env var into a list, dropping blanks."""
    return [item.strip() for item in os.getenv(name, "").split(",") if item.strip()]


# Starlette runs middleware in reverse order of registration, so the list below
# executes bottom-up: TrustedHost -> CORS -> RateLimit -> Security -> routers.
# CORS sits outside the limiter so that 429 responses still carry CORS headers.

# Security headers + request size limit. (CSRF enforcement inside this
# middleware is opt-in via ENABLE_CSRF and off by default - this API is
# bearer-token authenticated and sets no cookies, so CSRF does not apply.)
app.add_middleware(SecurityMiddleware)

# IP-based rate limiting on login/registration/OTP endpoints.
app.add_middleware(RateLimitMiddleware)

# CORS middleware
_default_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://grooovy.vercel.app",
    "https://grooovy.netlify.app",
]
_frontend_url = os.getenv("FRONTEND_URL", "").strip()
_cors_origins = _csv_env("CORS_ORIGINS") or (
    _default_origins + ([_frontend_url] if _frontend_url else [])
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-CSRF-Token", "X-Session-ID"],
    expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining", "Retry-After"],
)

# Trusted host middleware. Set ALLOWED_HOSTS in production; "*" only remains
# the default so local development and health probes keep working.
_allowed_hosts = _csv_env("ALLOWED_HOSTS") or ["*"]
if _allowed_hosts == ["*"] and ENVIRONMENT == "production":
    logger.warning(
        "ALLOWED_HOSTS is unset - accepting any Host header. Set it to your "
        "API domain to protect against Host-header injection."
    )
app.add_middleware(TrustedHostMiddleware, allowed_hosts=_allowed_hosts)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "timestamp": time.time()
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    # This handler swallows the exception, so report it explicitly - otherwise
    # Sentry's ASGI integration never sees it.
    capture_exception(exc)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred",
                "timestamp": time.time()
            }
        }
    )

# Health check endpoint
@app.get("/health")
async def health_check() -> Dict[str, Any]:
    """System health check"""
    health_status = {
        "status": "ok",
        "message": "Grooovy FastAPI is running",
        "version": "2.0.0",
        "timestamp": time.time(),
        "services": {
            "supabase": "unknown",
            "redis": "unknown"
        }
    }
    
    # Check Supabase
    try:
        supabase = get_supabase_client()
        supabase.table('users').select('id').limit(1).execute()
        health_status["services"]["supabase"] = "connected"
    except Exception as e:
        health_status["services"]["supabase"] = f"error: {str(e)}"
        health_status["status"] = "degraded"
    
    # Check Redis (if configured)
    try:
        from services.cache_service import redis_client
        if redis_client:
            await redis_client.ping()
            health_status["services"]["redis"] = "connected"
        else:
            health_status["services"]["redis"] = "not_configured"
    except Exception as e:
        health_status["services"]["redis"] = f"error: {str(e)}"
    
    status_code = 200 if health_status["status"] == "ok" else 503
    return JSONResponse(content=health_status, status_code=status_code)

# Root endpoint
@app.get("/")
async def root():
    """API root endpoint"""
    return {
        "message": "Welcome to Grooovy API v2.0",
        "docs": "/docs",
        "health": "/health",
        "version": "2.0.0"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(wallet.router, prefix="/api/wallet", tags=["Wallet"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(membership.router, tags=["Membership"])  # Has its own prefix
app.include_router(admin_dashboard.router, prefix="/api", tags=["Admin Dashboard"])
app.include_router(secret_events.router, tags=["Secret Events"])  # Has its own prefix
app.include_router(anonymous_chat.router, tags=["Anonymous Chat"])  # Has its own prefix

# Import and register users router
from routers import users
app.include_router(users.router, tags=["Users"])

# app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])  # Temporarily disabled
# app.include_router(realtime.router, prefix="/api/realtime", tags=["Real-time"])  # Temporarily disabled

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )
# Deployment trigger: 2026-01-16T21:55:51.025Z
