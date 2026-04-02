"""
Simple rate limiting middleware for critical operations
"""
import time
from typing import Dict, Tuple
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
