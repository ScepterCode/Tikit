"""
Simple rate limiting middleware for critical operations
"""
import time
from typing import Dict, Optional, Tuple
from fastapi import HTTPException, Request
from functools import wraps

class SimpleRateLimiter:
    def __init__(self):
        # Store: {user_id: {operation: [(timestamp, count)]}}
        self.requests: Dict[str, Dict[str, list]] = {}
        
        # Rate limits: operation -> (max_requests, window_seconds)
        self.limits = {
            "create_event": (3, 60),  # 3 events per minute
            "purchase_ticket": (10, 60),  # 10 purchases per minute
            "wallet_transaction": (20, 60),  # 20 transactions per minute
            "withdrawal": (5, 300),  # 5 withdrawals per 5 minutes
            "payment": (10, 60),  # 10 payments per minute
        }
    
    def check_rate_limit(self, user_id: str, operation: str) -> Tuple[bool, str]:
        """
        Check if user has exceeded rate limit for operation
        Returns: (is_allowed, message)
        """
        if operation not in self.limits:
            return True, ""
        
        max_requests, window = self.limits[operation]
        current_time = time.time()
        cutoff_time = current_time - window
        
        # Initialize user tracking
        if user_id not in self.requests:
            self.requests[user_id] = {}
        if operation not in self.requests[user_id]:
            self.requests[user_id][operation] = []
        
        # Clean old requests
        self.requests[user_id][operation] = [
            req_time for req_time in self.requests[user_id][operation]
            if req_time > cutoff_time
        ]
        
        # Check limit
        request_count = len(self.requests[user_id][operation])
        
        if request_count >= max_requests:
            wait_time = int(self.requests[user_id][operation][0] + window - current_time)
            return False, f"Rate limit exceeded. Please wait {wait_time} seconds."
        
        # Add current request
        self.requests[user_id][operation].append(current_time)
        return True, ""
    
    def clear_user_limits(self, user_id: str):
        """Clear all rate limits for a user (for testing)"""
        if user_id in self.requests:
            del self.requests[user_id]

# Global rate limiter instance
rate_limiter = SimpleRateLimiter()

def rate_limit(operation: str):
    """Decorator to apply rate limiting to endpoints"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract request and user from args
            request = None
            for arg in args:
                if isinstance(arg, Request):
                    request = arg
                    break
            
            if not request:
                # If no request found, skip rate limiting
                return await func(*args, **kwargs)
            
            # Get user from request (assuming it's in request.state or similar)
            user_id = getattr(request.state, 'user_id', None)
            if not user_id:
                # Try to get from function kwargs
                user_id = kwargs.get('user_id')
            
            if user_id:
                is_allowed, message = rate_limiter.check_rate_limit(user_id, operation)
                if not is_allowed:
                    raise HTTPException(
                        status_code=429,
                        detail={
                            "error": "Rate limit exceeded",
                            "message": message,
                            "operation": operation
                        }
                    )
            
            return await func(*args, **kwargs)
        return wrapper
    return decorator


# ---------------------------------------------------------------------------
# ASGI middleware
# ---------------------------------------------------------------------------

import os
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse


class RateLimitMiddleware(BaseHTTPMiddleware):
    """IP-based rate limiting for unauthenticated, abuse-prone endpoints.

    The decorator above covers per-user business operations once a request is
    authenticated. This covers the endpoints an attacker hits *before* holding
    a valid token - login, registration, password reset and OTP issuance -
    where the only stable key is the client address.

    State is per-process and in memory: it resets on deploy and is not shared
    between instances. That is enough to blunt credential stuffing from a
    single source; a shared store (Redis) is the upgrade path.
    """

    # path prefix -> (max requests, window seconds)
    DEFAULT_RULES = {
        "/api/auth/login": (10, 60),
        "/api/auth/register": (5, 300),
        "/api/auth/forgot-password": (5, 300),
        "/api/auth/reset-password": (5, 300),
        "/api/auth/verify-email": (10, 60),
        "/api/wallet/security/generate-otp": (5, 300),
        "/api/wallet/security/verify-otp": (10, 300),
        "/api/wallet/security/verify-pin": (10, 300),
    }

    def __init__(self, app, rules: Optional[Dict[str, Tuple[int, int]]] = None):
        super().__init__(app)
        self.rules = rules if rules is not None else dict(self.DEFAULT_RULES)
        self.enabled = os.getenv("RATE_LIMIT_ENABLED", "true").lower() != "false"
        # key -> list[timestamp]
        self._hits: Dict[str, list] = {}

    def _client_key(self, request: Request) -> str:
        # Render/Netlify sit behind proxies, so prefer the forwarded chain.
        forwarded = request.headers.get("x-forwarded-for", "")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    def _rule_for(self, path: str) -> Optional[Tuple[str, int, int]]:
        for prefix, (limit, window) in self.rules.items():
            if path.startswith(prefix):
                return prefix, limit, window
        return None

    def _check(self, key: str, limit: int, window: int) -> Tuple[bool, int]:
        """Sliding window. Returns (allowed, retry_after_seconds)."""
        now = time.time()
        cutoff = now - window
        hits = [t for t in self._hits.get(key, []) if t > cutoff]

        if len(hits) >= limit:
            self._hits[key] = hits
            return False, max(1, int(hits[0] + window - now))

        hits.append(now)
        self._hits[key] = hits

        # Opportunistic cleanup so the dict cannot grow without bound.
        if len(self._hits) > 5000:
            self._hits = {
                k: v for k, v in self._hits.items() if v and v[-1] > now - 3600
            }
        return True, 0

    async def dispatch(self, request: Request, call_next):
        if not self.enabled or request.method == "OPTIONS":
            return await call_next(request)

        rule = self._rule_for(request.url.path)
        if not rule:
            return await call_next(request)

        prefix, limit, window = rule
        key = f"{self._client_key(request)}:{prefix}"
        allowed, retry_after = self._check(key, limit, window)

        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": f"Too many requests. Try again in {retry_after} seconds.",
                    },
                },
                headers={"Retry-After": str(retry_after)},
            )

        return await call_next(request)
