"""
Tikit FastAPI Backend - Main Application
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

# Import routers
from routers import auth, events, tickets, payments, admin, notifications, analytics, realtime
from services.supabase_client import get_supabase_client
from middleware.rate_limiter import RateLimitMiddleware
from middleware.security import SecurityMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("🚀 Starting Tikit FastAPI Backend...")
    
    # Test Supabase connection
    try:
        supabase = get_supabase_client()
        # Test connection with a simple query
        result = supabase.table('users').select('id').limit(1).execute()
        logger.info("✅ Supabase connection successful")
    except Exception as e:
        logger.error(f"❌ Supabase connection failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Tikit FastAPI Backend...")

# Create FastAPI app
app = FastAPI(
    title="Tikit API",
    description="High-performance event management platform with real-time features",
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Security middleware
app.add_middleware(SecurityMiddleware)

# Rate limiting middleware
app.add_middleware(RateLimitMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://tikit.vercel.app",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Total-Count", "X-Rate-Limit-Remaining"]
)

# Trusted host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Configure properly for production
)

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
        "message": "Tikit FastAPI is running",
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
        "message": "Welcome to Tikit API v2.0",
        "docs": "/docs",
        "health": "/health",
        "version": "2.0.0"
    }

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(events.router, prefix="/api/events", tags=["Events"])
app.include_router(tickets.router, prefix="/api/tickets", tags=["Tickets"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payments"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(realtime.router, prefix="/api/realtime", tags=["Real-time"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("ENVIRONMENT") == "development"
    )