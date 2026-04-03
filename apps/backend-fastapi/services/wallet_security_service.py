"""
Wallet Security Service
Handles transaction security, fraud detection, and authentication
"""
import hashlib
import secrets
import time
import re
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json

class WalletSecurityService:
    def __init__(self):
        # In-memory storage for security data (replace with database in production)
        self.transaction_pins = {}  # user_id -> hashed_pin
        self.failed_attempts = {}   # user_id -> {count, last_attempt}
        self.transaction_history = {}  # user_id -> [transactions]
        self.blocked_users = set()
        self.otp_codes = {}  # user_id -> {code, expires_at, attempts}
        
        # Security configuration
        self.MAX_FAILED_ATTEMPTS = 3
        self.LOCKOUT_DURATION = 300  # 5 minutes
        self.OTP_EXPIRY = 300  # 5 minutes
        self.MAX_OTP_ATTEMPTS = 3
        
        # Transaction limits
        self.DAILY_LIMITS = {
            "basic": {"withdrawal": 50000, "transfer": 100000, "spray": 25000},
            "verified": {"withdrawal": 500000, "transfer": 1000000, "spray": 100000},
            "premium": {"withdrawal": 2000000, "transfer": 5000000, "spray": 500000}
        }
        
        # Fraud detection thresholds
        self.FRAUD_THRESHOLDS = {
            "velocity_limit": 5,  # Max transactions per minute
            "amount_spike": 10,   # 10x average transaction amount
            "unusual_time": True, # Transactions outside normal hours
            "location_change": True  # Rapid location changes
        }

    def hash_pin(self, pin: str) -> str:
        """Hash transaction PIN securely"""
        salt = secrets.token_hex(16)
        pin_hash = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt.encode(), 100000)
        return f"{salt}:{pin_hash.hex()}"

    def verify_pin(self, user_id: str, pin: str) -> bool:
        """Verify transaction PIN"""
        if user_id not in self.transaction_pins:
            return False
        
        stored_hash = self.transaction_pins[user_id]
        salt, pin_hash = stored_hash.split(':')
        
        computed_hash = hashlib.pbkdf2_hmac('sha256', pin.encode(), salt.encode(), 100000)
        return secrets.compare_digest(pin_hash, computed_hash.hex())

    def set_transaction_pin(self, user_id: str, pin: str) -> Dict[str, Any]:
        """Set or update transaction PIN"""
        # Validate PIN format
        if not re.match(r'^\d{4,6}$', pin):
            return {
                "success": False,
                "error": "PIN must be 4-6 digits"
            }
        
        # Hash and store PIN
        self.transaction_pins[user_id] = self.hash_pin(pin)
        
        return {
            "success": True,
            "message": "Transaction PIN set successfully"
        }

    def validate_transaction_security(self, user_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Comprehensive transaction security validation"""
        
        # Check if user is blocked
        if user_id in self.blocked_users:
            return {
                "success": False,
                "error": "Account temporarily blocked due to suspicious activity",
                "requires_verification": True
            }
        
        # Check failed attempts
        if self._is_user_locked_out(user_id):
            return {
                "success": False,
                "error": "Account locked due to multiple failed attempts. Try again later.",
                "lockout_remaining": self._get_lockout_remaining(user_id)
            }
        
        # Fraud detection
        fraud_check = self._detect_fraud(user_id, transaction_data)
        if not fraud_check["safe"]:
            return {
                "success": False,
                "error": "Transaction flagged for security review",
                "fraud_reasons": fraud_check["reasons"],
                "requires_verification": True
            }
        
        # Check transaction limits
        limit_check = self._check_transaction_limits(user_id, transaction_data)
        if not limit_check["within_limits"]:
            return {
                "success": False,
                "error": f"Transaction exceeds {limit_check['limit_type']} limit",
                "current_limit": limit_check["limit"],
                "requires_upgrade": True
            }
        
        return {
            "success": True,
            "security_level": self._get_security_level(transaction_data),
            "requires_otp": transaction_data.get("amount", 0) > 10000
        }

    async def generate_otp(self, user_id: str, purpose: str = "transaction") -> Dict[str, Any]:
        """Generate OTP for transaction verification and send via email"""
        otp_code = f"{secrets.randbelow(900000) + 100000:06d}"  # 6-digit OTP
        expires_at = time.time() + self.OTP_EXPIRY
        
        self.otp_codes[user_id] = {
            "code": otp_code,
            "purpose": purpose,
            "expires_at": expires_at,
            "attempts": 0,
            "created_at": time.time()
        }
        
        # Get user email from database and send OTP
        email_sent = False
        try:
            from services.supabase_client import get_supabase_client
            supabase = get_supabase_client()
            
            # Get user email
            user_result = supabase.table('users').select('email, first_name, last_name').eq('id', user_id).execute()
            
            if user_result.data and user_result.data[0].get('email'):
                user_email = user_result.data[0]['email']
                
                # Send OTP via email
                from services.email_service import email_service
                email_result = await email_service.send_otp_email(
                    email=user_email,
                    otp_code=otp_code,
                    purpose=purpose,
                    expires_in=self.OTP_EXPIRY
                )
                email_sent = email_result.get("success", False)
                
                if not email_sent:
                    import logging
                    logging.error(f"Failed to send OTP email to {user_email}")
            else:
                import logging
                logging.warning(f"No email found for user {user_id}")
                
        except Exception as e:
            import logging
            logging.error(f"Failed to send OTP email: {e}")
        
        return {
            "success": True,
            "expires_in": self.OTP_EXPIRY,
            "message": f"OTP sent to your registered email for {purpose} verification" if email_sent else f"OTP generated for {purpose} verification. Please check your email.",
            "email_sent": email_sent
            # ✅ SECURITY FIX: OTP code NOT returned in response
        }

    def verify_otp(self, user_id: str, otp_code: str) -> Dict[str, Any]:
        """Verify OTP code"""
        if user_id not in self.otp_codes:
            return {
                "success": False,
                "error": "No OTP found. Please request a new one."
            }
        
        otp_data = self.otp_codes[user_id]
        
        # Check expiry
        if time.time() > otp_data["expires_at"]:
            del self.otp_codes[user_id]
            return {
                "success": False,
                "error": "OTP has expired. Please request a new one."
            }
        
        # Check attempts
        if otp_data["attempts"] >= self.MAX_OTP_ATTEMPTS:
            del self.otp_codes[user_id]
            return {
                "success": False,
                "error": "Too many failed attempts. Please request a new OTP."
            }
        
        # Verify code
        if otp_code != otp_data["code"]:
            self.otp_codes[user_id]["attempts"] += 1
            return {
                "success": False,
                "error": "Invalid OTP code",
                "attempts_remaining": self.MAX_OTP_ATTEMPTS - self.otp_codes[user_id]["attempts"]
            }
        
        # Success - clean up
        del self.otp_codes[user_id]
        return {
            "success": True,
            "message": "OTP verified successfully"
        }

    def record_failed_attempt(self, user_id: str, attempt_type: str = "pin"):
        """Record failed authentication attempt"""
        current_time = time.time()
        
        if user_id not in self.failed_attempts:
            self.failed_attempts[user_id] = {"count": 0, "last_attempt": 0}
        
        self.failed_attempts[user_id]["count"] += 1
        self.failed_attempts[user_id]["last_attempt"] = current_time
        
        # Block user if too many attempts
        if self.failed_attempts[user_id]["count"] >= self.MAX_FAILED_ATTEMPTS:
            self.blocked_users.add(user_id)

    def _is_user_locked_out(self, user_id: str) -> bool:
        """Check if user is locked out due to failed attempts"""
        if user_id not in self.failed_attempts:
            return False
        
        attempts_data = self.failed_attempts[user_id]
        if attempts_data["count"] < self.MAX_FAILED_ATTEMPTS:
            return False
        
        # Check if lockout period has expired
        lockout_expires = attempts_data["last_attempt"] + self.LOCKOUT_DURATION
        if time.time() > lockout_expires:
            # Reset failed attempts
            del self.failed_attempts[user_id]
            self.blocked_users.discard(user_id)
            return False
        
        return True

    def _get_lockout_remaining(self, user_id: str) -> int:
        """Get remaining lockout time in seconds"""
        if user_id not in self.failed_attempts:
            return 0
        
        attempts_data = self.failed_attempts[user_id]
        lockout_expires = attempts_data["last_attempt"] + self.LOCKOUT_DURATION
        remaining = max(0, int(lockout_expires - time.time()))
        return remaining

    def _detect_fraud(self, user_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Advanced fraud detection"""
        reasons = []
        
        # Initialize user transaction history if not exists
        if user_id not in self.transaction_history:
            self.transaction_history[user_id] = []
        
        user_transactions = self.transaction_history[user_id]
        current_time = time.time()
        amount = transaction_data.get("amount", 0)
        
        # Velocity check - too many transactions in short time
        recent_transactions = [t for t in user_transactions if current_time - t["timestamp"] < 60]
        if len(recent_transactions) >= self.FRAUD_THRESHOLDS["velocity_limit"]:
            reasons.append("High transaction velocity")
        
        # Amount spike detection
        if len(user_transactions) > 0:
            avg_amount = sum(t["amount"] for t in user_transactions[-10:]) / min(len(user_transactions), 10)
            if amount > avg_amount * self.FRAUD_THRESHOLDS["amount_spike"]:
                reasons.append("Unusual transaction amount")
        
        # Unusual time detection (outside 6 AM - 11 PM)
        current_hour = datetime.now().hour
        if current_hour < 6 or current_hour > 23:
            reasons.append("Unusual transaction time")
        
        # Record this transaction for future analysis
        user_transactions.append({
            "amount": amount,
            "timestamp": current_time,
            "type": transaction_data.get("type", "unknown")
        })
        
        # Keep only last 100 transactions
        if len(user_transactions) > 100:
            self.transaction_history[user_id] = user_transactions[-100:]
        
        return {
            "safe": len(reasons) == 0,
            "reasons": reasons,
            "risk_score": len(reasons) * 25  # 0-100 scale
        }

    def _check_transaction_limits(self, user_id: str, transaction_data: Dict[str, Any]) -> Dict[str, Any]:
        """Check if transaction is within user limits"""
        user_tier = transaction_data.get("user_tier", "basic")
        transaction_type = transaction_data.get("type", "transfer")
        amount = transaction_data.get("amount", 0)
        
        if user_tier not in self.DAILY_LIMITS:
            user_tier = "basic"
        
        limits = self.DAILY_LIMITS[user_tier]
        
        if transaction_type in limits:
            limit = limits[transaction_type]
            if amount > limit:
                return {
                    "within_limits": False,
                    "limit_type": f"daily {transaction_type}",
                    "limit": limit,
                    "amount": amount
                }
        
        return {
            "within_limits": True
        }

    def _get_security_level(self, transaction_data: Dict[str, Any]) -> str:
        """Determine required security level for transaction"""
        amount = transaction_data.get("amount", 0)
        
        if amount > 100000:
            return "high"
        elif amount > 10000:
            return "medium"
        else:
            return "low"

    def get_security_status(self, user_id: str) -> Dict[str, Any]:
        """Get user's security status and recommendations"""
        has_pin = user_id in self.transaction_pins
        is_locked = self._is_user_locked_out(user_id)
        failed_attempts = self.failed_attempts.get(user_id, {}).get("count", 0)
        
        recommendations = []
        if not has_pin:
            recommendations.append("Set up a transaction PIN for enhanced security")
        
        if failed_attempts > 0:
            recommendations.append("Review recent login attempts for suspicious activity")
        
        return {
            "has_transaction_pin": has_pin,
            "is_locked_out": is_locked,
            "failed_attempts": failed_attempts,
            "lockout_remaining": self._get_lockout_remaining(user_id) if is_locked else 0,
            "security_recommendations": recommendations,
            "last_security_update": time.time()
        }

# Global instance
wallet_security_service = WalletSecurityService()