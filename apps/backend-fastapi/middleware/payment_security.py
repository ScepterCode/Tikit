"""
Payment Security Middleware
Implements security measures for payment processing
"""

from fastapi import HTTPException, Request
from typing import Dict, Any
import time
import hashlib
import hmac
import os
import logging

logger = logging.getLogger(__name__)

class PaymentSecurityMiddleware:
    def __init__(self):
        self.rate_limits = {}
        self.max_requests_per_minute = 10
        self.max_payment_amount = 1000000  # ₦10,000 in kobo
        self.min_payment_amount = 10000    # ₦100 in kobo
    
    def validate_payment_amount(self, amount: int) -> bool:
        """Validate payment amount is within acceptable limits"""
        return self.min_payment_amount <= amount <= self.max_payment_amount
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user has exceeded payment rate limit"""
        current_time = time.time()
        minute_ago = current_time - 60
        
        if user_id not in self.rate_limits:
            self.rate_limits[user_id] = []
        
        # Remove old requests
        self.rate_limits[user_id] = [
            req_time for req_time in self.rate_limits[user_id] 
            if req_time > minute_ago
        ]
        
        # Check if limit exceeded
        if len(self.rate_limits[user_id]) >= self.max_requests_per_minute:
            return False
        
        # Add current request
        self.rate_limits[user_id].append(current_time)
        return True
    
    def validate_payment_request(self, request_data: Dict[str, Any], user_id: str) -> Dict[str, Any]:
        """Validate payment request for security"""
        try:
            # Check rate limit
            if not self.check_rate_limit(user_id):
                raise HTTPException(
                    status_code=429,
                    detail={
                        "success": False,
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": "Too many payment requests. Please wait before trying again."
                        }
                    }
                )
            
            # Validate amount
            amount = request_data.get('amount', 0)
            if not self.validate_payment_amount(amount):
                raise HTTPException(
                    status_code=400,
                    detail={
                        "success": False,
                        "error": {
                            "code": "INVALID_AMOUNT",
                            "message": f"Payment amount must be between ₦{self.min_payment_amount/100:,.2f} and ₦{self.max_payment_amount/100:,.2f}"
                        }
                    }
                )
            
            # Validate required fields
            required_fields = ['amount', 'event_id', 'reference']
            for field in required_fields:
                if field not in request_data or not request_data[field]:
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "success": False,
                            "error": {
                                "code": "MISSING_REQUIRED_FIELD",
                                "message": f"Required field '{field}' is missing or empty"
                            }
                        }
                    )
            
            return {"success": True, "message": "Payment request validated"}
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Payment validation error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "success": False,
                    "error": {
                        "code": "VALIDATION_ERROR",
                        "message": "Payment validation failed"
                    }
                }
            )
    
    def sanitize_payment_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitize payment data to prevent injection attacks"""
        sanitized = {}
        
        # Define allowed fields and their types
        allowed_fields = {
            'amount': int,
            'reference': str,
            'event_id': str,
            'customer_email': str,
            'customer_name': str,
            'customer_phone': str,
            'redirect_url': str
        }
        
        for field, expected_type in allowed_fields.items():
            if field in data:
                try:
                    sanitized[field] = expected_type(data[field])
                except (ValueError, TypeError):
                    logger.warning(f"Invalid type for field {field}: {type(data[field])}")
                    continue
        
        return sanitized
    
    def log_payment_attempt(self, user_id: str, amount: int, method: str, success: bool):
        """Log payment attempt for monitoring"""
        logger.info(f"Payment attempt - User: {user_id}, Amount: ₦{amount/100:.2f}, Method: {method}, Success: {success}")

# Global security middleware instance
payment_security = PaymentSecurityMiddleware()