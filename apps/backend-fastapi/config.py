"""
Configuration settings for the FastAPI application
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY", "")
    supabase_anon_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    
    # JWT
    jwt_secret: str = os.getenv("SECRET_KEY", os.getenv("JWT_SECRET", "your-secret-key-change-in-production"))
    jwt_refresh_secret: str = os.getenv("JWT_REFRESH_SECRET", "your-refresh-secret-key")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 24 * 60  # 24 hours
    refresh_token_expire_days: int = 30
    
    # Redis
    redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # Africa's Talking
    africastalking_username: str = os.getenv("AFRICASTALKING_USERNAME", "")
    africastalking_api_key: str = os.getenv("AFRICASTALKING_API_KEY", "")
    
    # Environment
    environment: str = os.getenv("ENVIRONMENT", os.getenv("NODE_ENV", "development"))
    
    # Frontend URL
    frontend_url: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Allow extra fields

# Global settings instance
settings = Settings()