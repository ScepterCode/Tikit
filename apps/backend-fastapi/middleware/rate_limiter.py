"""
Rate Limiting Middleware
Advanced rate limiting with Redis backend and multiple strategies
"""

import time
import json
from typing import Dict, Optional, Callable
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import redis.asyncio as redis
import os
import logging
from functools import wraps

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Advanced rate limiting middleware with Redis backend"""
    
    def __init__(self, app, redis_url: str = None):
        super().__init__(app)
        self.redis_url = redis_url or os.getenv("REDIS_URL")
        self.redis_client = None
        self.memory_store = {}  # Fallback for when Redis is unavailable
        
        # Rate limit configurations
        self.rate_limits = {
            "/api/auth/login": {"requests": 5, "window": 300},  # 5 per 5 minutes
            "/api/auth/register": {"requests": 3, "window": 600},  # 3 per 10 minutes
            "/api/auth/send-otp": {"requests": 3, "window": 600},  # 3 per 10 minutes
            "/api/payments": {"requests": 10, "window": 60},  # 10 per minute
            "default": {"requests": 100, "window": 60}  # 100 per minute default
        }
    
    async def get_redis_client(self):
        """Get or create Redis client"""
        if not self.redis_client and self.redis_url:
            try:
                self.redis_client = redis.from_url(self.redis_url)
                await self.redis_client.ping()
                logger.info("✅ Redis connected for rate limiting")
            except Exception as e:
                logger.warning(f"Redis connection failed, using memory store: {e}")
                self.redis_client = None
        return self.redis_client
    
    def get_client_id(self, request: Request) -> str:
        """Get unique client identifier"""
        # Try to get user ID from JWT token
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            try:
                from middleware.auth import decode_jwt_token
                token = auth_header.split(" ")[1]
                payload = decode_jwt_token(token)
                return f"user:{payload.get('user_id')}"
            except:
                pass
        
        # Fallback to IP address
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"
        
        return f"ip:{request.client.host}"
    
    def get_rate_limit_config(self, path: str) -> Dict[str, int]:
        """Get rate limit configuration for path"""
        # Check for exact match
        if path in self.rate_limits:
            return self.rate_limits[path]
        
        # Check for prefix matches
        for pattern, config in self.rate_limits.items():
            if pattern != "default" and path.startswith(pattern):
                return config
        
        return self.rate_limits["default"]
    
    async def is_rate_limited(self, client_id: str, path: str) -> tuple[bool, Dict[str, int]]:
        """Check if client is rate limited"""
        config = self.get_rate_limit_config(path)
        key = f"rate_limit:{client_id}:{path}"
        current_time = int(time.time())
        window_start = current_time - config["window"]
        
        redis_client = await self.get_redis_client()
        
        if redis_client:
            # Use Redis for distributed rate limiting
            try:
                # Remove old entries
                await redis_client.zremrangebyscore(key, 0, window_start)
                
                # Count current requests
                current_requests = await redis_client.zcard(key)
                
                if current_requests >= config["requests"]:
                    # Get time until reset
                    oldest_request = await redis_client.zrange(key, 0, 0, withscores=True)
                    reset_time = int(oldest_request[0][1]) + config["window"] if oldest_request else current_time + config["window"]
                    
                    return True, {
                        "requests_remaining": 0,
                        "reset_time": reset_time,
                        "retry_after": reset_time - current_time
                    }
                
                # Add current request
                await redis_client.zadd(key, {str(current_time): current_time})
                await redis_client.expire(key, config["window"])
                
                return False, {
                    "requests_remaining": config["requests"] - current_requests - 1,
                    "reset_time": current_time + config["window"],
                    "retry_after": 0
                }
                
            except Exception as e:
                logger.error(f"Redis rate limiting error: {e}")
                # Fallback to memory store
        
        # Memory-based rate limiting (fallback)
        if key not in self.memory_store:
            self.memory_store[key] = []
        
        # Clean old entries
        self.memory_store[key] = [
            timestamp for timestamp in self.memory_store[key]
            if timestamp > window_start
        ]
        
        current_requests = len(self.memory_store[key])
        
        if current_requests >= config["requests"]:
            oldest_request = min(self.memory_store[key]) if self.memory_store[key] else current_time
            reset_time = oldest_request + config["window"]
            
            return True, {
                "requests_remaining": 0,
                "reset_time": reset_time,
                "retry_after": reset_time - current_time
            }
        
        # Add current request
        self.memory_store[key].append(current_time)
        
        return False, {
            "requests_remaining": config["requests"] - current_requests - 1,
            "reset_time": current_time + config["window"],
            "retry_after": 0
        }
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """Process request with rate limiting"""
        # Skip rate limiting for health checks and static files
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        client_id = self.get_client_id(request)
        path = request.url.path
        
        is_limited, info = await self.is_rate_limited(client_id, path)
        
        if is_limited:
            logger.warning(f"Rate limit exceeded for {client_id} on {path}")
            raise HTTPException(
                status_code=429,
                detail={
                    "code": "RATE_LIMIT_EXCEEDED",
                    "message": "Too many requests",
                    "retry_after": info["retry_after"],
                    "reset_time": info["reset_time"]
                },
                headers={
                    "X-Rate-Limit-Remaining": "0",
                    "X-Rate-Limit-Reset": str(info["reset_time"]),
                    "Retry-After": str(info["retry_after"])
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        response.headers["X-Rate-Limit-Remaining"] = str(info["requests_remaining"])
        response.headers["X-Rate-Limit-Reset"] = str(info["reset_time"])
        
        return response

# Decorator for additional rate limiting
def rate_limit(requests: int, window: int):
    """Decorator for endpoint-specific rate limiting"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # This would be implemented if needed for specific endpoints
            return await func(*args, **kwargs)
        return wrapper
    return decorator