"""
Health check router
"""
from fastapi import APIRouter
from database import supabase_client
from datetime import datetime

router = APIRouter()

@router.get("/health")
async def health_check():
    """
    Health check endpoint
    """
    health = {
        "status": "ok",
        "message": "Tikit FastAPI Backend is running",
        "supabase": "disconnected",
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # Check Supabase connection
    try:
        supabase_healthy = await supabase_client.health_check()
        health["supabase"] = "connected" if supabase_healthy else "disconnected"
    except Exception as e:
        health["supabase"] = "disconnected"
        print(f"Supabase health check failed: {e}")
    
    status_code = 200 if health["supabase"] == "connected" else 503
    
    return health