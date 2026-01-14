"""
Security Middleware
CSRF protection, security headers, and request validation
"""

import secrets
import time
from typing import Dict, Optional
from fastapi import Request, Response, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """Security middleware with CSRF protection and security headers"""
    
    def __init__(self, app):
        super().__init__(app)
        self.csrf_tokens: Dict[str, Dict[str, any]] = {}
        self.csrf_token_expiry = 3600  # 1 hour
    
    def generate_csrf_token(self) -> str:
        """Generate a secure CSRF token"""
        return secrets.token_urlsafe(32)
    
    def create_csrf_token(self, session_id: str) -> str:
        """Create and store CSRF token"""
        token = self.generate_csrf_token()
        self.csrf_tokens[session_id] = {
            "token": token,
            "expires_at": time.time() + self.csrf_token_expiry
        }
        return token
    
    def validate_csrf_token(self, session_id: str, token: str) -> bool:
        """Validate CSRF token"""
        if session_id not in self.csrf_tokens:
            return False
        
        stored_data = self.csrf_tokens[session_id]
        
        # Check expiry
        if stored_data["expires_at"] < time.time():
            del self.csrf_tokens[session_id]
            return False
        
        return stored_data["token"] == token
    
    def cleanup_expired_tokens(self):
        """Remove expired CSRF tokens"""
        current_time = time.time()
        expired_sessions = [
            session_id for session_id, data in self.csrf_tokens.items()
            if data["expires_at"] < current_time
        ]
        
        for session_id in expired_sessions:
            del self.csrf_tokens[session_id]
    
    def add_security_headers(self, response: Response):
        """Add security headers to response"""
        response.headers.update({
            # Prevent XSS attacks
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            
            # HTTPS enforcement
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            
            # Content Security Policy
            "Content-Security-Policy": (
                "default-src 'self'; "
                "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
                "style-src 'self' 'unsafe-inline'; "
                "img-src 'self' data: https:; "
                "connect-src 'self' https:; "
                "font-src 'self' https:; "
                "object-src 'none'; "
                "media-src 'self'; "
                "frame-src 'none';"
            ),
            
            # Referrer Policy
            "Referrer-Policy": "strict-origin-when-cross-origin",
            
            # Permissions Policy
            "Permissions-Policy": (
                "camera=(), microphone=(), geolocation=(), "
                "payment=(), usb=(), magnetometer=(), gyroscope=()"
            )
        })
    
    async def dispatch(self, request: Request, call_next):
        """Process request with security checks"""
        # Cleanup expired tokens periodically
        if len(self.csrf_tokens) > 100:  # Arbitrary threshold
            self.cleanup_expired_tokens()
        
        # Handle CSRF token generation
        if request.url.path == "/api/csrf-token" and request.method == "GET":
            session_id = request.headers.get("x-session-id") or secrets.token_urlsafe(16)
            token = self.create_csrf_token(session_id)
            
            return Response(
                content=f'{{"token": "{token}", "session_id": "{session_id}"}}',
                media_type="application/json",
                headers={"X-Session-ID": session_id}
            )
        
        # Skip CSRF validation for safe methods and specific paths
        safe_methods = ["GET", "HEAD", "OPTIONS"]
        skip_csrf_paths = ["/health", "/docs", "/redoc", "/openapi.json", "/api/webhooks"]
        
        if (request.method not in safe_methods and 
            not any(request.url.path.startswith(path) for path in skip_csrf_paths)):
            
            # CSRF validation for state-changing operations
            csrf_token = request.headers.get("x-csrf-token")
            session_id = request.headers.get("x-session-id")
            
            # Skip CSRF in development mode
            if not (request.headers.get("x-development-mode") == "true"):
                if not csrf_token or not session_id:
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "code": "CSRF_TOKEN_MISSING",
                            "message": "CSRF token required for this operation"
                        }
                    )
                
                if not self.validate_csrf_token(session_id, csrf_token):
                    raise HTTPException(
                        status_code=403,
                        detail={
                            "code": "INVALID_CSRF_TOKEN",
                            "message": "Invalid or expired CSRF token"
                        }
                    )
        
        # Validate request size (prevent large payload attacks)
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(
                status_code=413,
                detail={
                    "code": "PAYLOAD_TOO_LARGE",
                    "message": "Request payload too large"
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self.add_security_headers(response)
        
        return response

class RequestValidationMiddleware(BaseHTTPMiddleware):
    """Additional request validation middleware"""
    
    def __init__(self, app):
        super().__init__(app)
        self.blocked_user_agents = [
            "bot", "crawler", "spider", "scraper"
        ]
    
    async def dispatch(self, request: Request, call_next):
        """Validate incoming requests"""
        # Block suspicious user agents
        user_agent = request.headers.get("user-agent", "").lower()
        if any(blocked in user_agent for blocked in self.blocked_user_agents):
            # Allow legitimate bots but log them
            if not any(legitimate in user_agent for legitimate in ["googlebot", "bingbot"]):
                logger.warning(f"Blocked suspicious user agent: {user_agent}")
                raise HTTPException(
                    status_code=403,
                    detail="Access denied"
                )
        
        # Validate request headers
        if request.method == "POST":
            content_type = request.headers.get("content-type", "")
            if not content_type.startswith(("application/json", "multipart/form-data")):
                raise HTTPException(
                    status_code=400,
                    detail="Invalid content type"
                )
        
        return await call_next(request)