"""
Wallet Rate Limiting Module
Advanced rate limiting with multiple strategies and protection mechanisms
"""
import time
import threading
from typing import Dict, Any, Optional, List
from collections import defaultdict, deque
from enum import Enum
import hashlib

class RateLimitType(Enum):
    PER_USER = "per_user"
    PER_IP = "per_ip"
    PER_OPERATION = "per_operation"
    GLOBAL = "global"

class RateLimitStrategy(Enum):
    FIXED_WINDOW = "fixed_window"
    SLIDING_WINDOW = "sliding_window"
    TOKEN_BUCKET = "token_bucket"
    EXPONENTIAL_BACKOFF = "exponential_backoff"

class WalletRateLimitingModule:
    """Advanced rate limiting for wallet operations"""
    
    def __init__(self):
        # Rate limiting storage
        self.user_requests = defaultdict(lambda: deque(maxlen=1000))
        self.ip_requests = defaultdict(lambda: deque(maxlen=1000))
        self.operation_requests = defaultdict(lambda: deque(maxlen=1000))
        self.global_requests = deque(maxlen=10000)
        
        # Token buckets for different operations
        self.token_buckets = defaultdict(lambda: {"tokens": 0, "last_refill": time.time()})
        
        # Exponential backoff tracking
        self.failed_attempts = defaultdict(lambda: {"count": 0, "last_attempt": 0, "backoff_until": 0})
        
        # Rate limit configurations
        self.rate_limits = {
            # Per-user limits (more permissive for better performance)
            "user_general": {"requests": 500, "window": 60, "strategy": RateLimitStrategy.SLIDING_WINDOW},
            "user_pin_attempts": {"requests": 5, "window": 300, "strategy": RateLimitStrategy.EXPONENTIAL_BACKOFF},
            "user_otp_requests": {"requests": 10, "window": 300, "strategy": RateLimitStrategy.FIXED_WINDOW},
            "user_transfers": {"requests": 100, "window": 60, "strategy": RateLimitStrategy.TOKEN_BUCKET},
            "user_withdrawals": {"requests": 20, "window": 300, "strategy": RateLimitStrategy.FIXED_WINDOW},
            
            # Per-IP limits (more permissive for load testing)
            "ip_general": {"requests": 5000, "window": 60, "strategy": RateLimitStrategy.SLIDING_WINDOW},
            "ip_login_attempts": {"requests": 50, "window": 300, "strategy": RateLimitStrategy.EXPONENTIAL_BACKOFF},
            
            # Per-operation limits (optimized for performance)
            "balance_check": {"requests": 1000, "window": 60, "strategy": RateLimitStrategy.SLIDING_WINDOW},
            "transaction_create": {"requests": 200, "window": 60, "strategy": RateLimitStrategy.TOKEN_BUCKET},
            "analytics_request": {"requests": 50, "window": 60, "strategy": RateLimitStrategy.FIXED_WINDOW},
            "deposit": {"requests": 200, "window": 60, "strategy": RateLimitStrategy.TOKEN_BUCKET},
            "withdrawal": {"requests": 50, "window": 60, "strategy": RateLimitStrategy.TOKEN_BUCKET},
            "transfer": {"requests": 200, "window": 60, "strategy": RateLimitStrategy.TOKEN_BUCKET},
            
            # Global limits (increased for better throughput)
            "global_operations": {"requests": 50000, "window": 60, "strategy": RateLimitStrategy.SLIDING_WINDOW}
        }
        
        # Thread safety
        self.lock = threading.RLock()
        
        # Blocked entities
        self.blocked_users = set()
        self.blocked_ips = set()
        self.temporary_blocks = {}  # entity -> unblock_time
        
    def check_rate_limit(self, identifier: str, operation: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Check if request is within rate limits"""
        with self.lock:
            current_time = time.time()
            
            # Check if entity is blocked
            if self._is_blocked(identifier, ip_address, current_time):
                return {
                    "allowed": False,
                    "reason": "Entity is temporarily blocked",
                    "retry_after": self._get_retry_after(identifier, ip_address)
                }
            
            # Check multiple rate limit types
            checks = [
                self._check_user_limit(identifier, operation, current_time),
                self._check_ip_limit(ip_address, operation, current_time) if ip_address else {"allowed": True},
                self._check_operation_limit(operation, current_time),
                self._check_global_limit(current_time)
            ]
            
            # If any check fails, deny the request
            for check in checks:
                if not check["allowed"]:
                    return check
            
            # All checks passed, record the request
            self._record_request(identifier, operation, ip_address, current_time)
            
            return {"allowed": True}
    
    def record_failed_attempt(self, identifier: str, operation: str, ip_address: Optional[str] = None):
        """Record a failed attempt for exponential backoff"""
        with self.lock:
            current_time = time.time()
            
            # Record failed attempt for user
            user_key = f"user:{identifier}:{operation}"
            self.failed_attempts[user_key]["count"] += 1
            self.failed_attempts[user_key]["last_attempt"] = current_time
            
            # Calculate exponential backoff
            backoff_seconds = min(300, 2 ** self.failed_attempts[user_key]["count"])  # Max 5 minutes
            self.failed_attempts[user_key]["backoff_until"] = current_time + backoff_seconds
            
            # Record for IP if provided
            if ip_address:
                ip_key = f"ip:{ip_address}:{operation}"
                self.failed_attempts[ip_key]["count"] += 1
                self.failed_attempts[ip_key]["last_attempt"] = current_time
                self.failed_attempts[ip_key]["backoff_until"] = current_time + backoff_seconds
            
            # Auto-block after too many failures
            if self.failed_attempts[user_key]["count"] >= 10:
                self._block_entity(identifier, "user", 3600)  # Block for 1 hour
            
            if ip_address and self.failed_attempts.get(f"ip:{ip_address}:{operation}", {}).get("count", 0) >= 20:
                self._block_entity(ip_address, "ip", 1800)  # Block IP for 30 minutes
    
    def reset_failed_attempts(self, identifier: str, operation: str):
        """Reset failed attempts after successful operation"""
        with self.lock:
            user_key = f"user:{identifier}:{operation}"
            if user_key in self.failed_attempts:
                self.failed_attempts[user_key] = {"count": 0, "last_attempt": 0, "backoff_until": 0}
    
    def _check_user_limit(self, user_id: str, operation: str, current_time: float) -> Dict[str, Any]:
        """Check user-specific rate limits"""
        # Check general user limit
        general_result = self._check_limit(
            self.user_requests[user_id],
            self.rate_limits["user_general"],
            current_time
        )
        
        if not general_result["allowed"]:
            return general_result
        
        # Check operation-specific user limits
        operation_limits = {
            "pin_verify": "user_pin_attempts",
            "otp_request": "user_otp_requests",
            "transfer": "user_transfers",
            "withdrawal": "user_withdrawals"
        }
        
        if operation in operation_limits:
            limit_key = operation_limits[operation]
            operation_requests = self.user_requests[f"{user_id}:{operation}"]
            
            return self._check_limit(
                operation_requests,
                self.rate_limits[limit_key],
                current_time
            )
        
        return {"allowed": True}
    
    def _check_ip_limit(self, ip_address: str, operation: str, current_time: float) -> Dict[str, Any]:
        """Check IP-specific rate limits"""
        # Check general IP limit
        general_result = self._check_limit(
            self.ip_requests[ip_address],
            self.rate_limits["ip_general"],
            current_time
        )
        
        if not general_result["allowed"]:
            return general_result
        
        # Check login attempts from IP
        if operation in ["login", "pin_verify"]:
            login_requests = self.ip_requests[f"{ip_address}:login"]
            return self._check_limit(
                login_requests,
                self.rate_limits["ip_login_attempts"],
                current_time
            )
        
        return {"allowed": True}
    
    def _check_operation_limit(self, operation: str, current_time: float) -> Dict[str, Any]:
        """Check operation-specific rate limits"""
        if operation in self.rate_limits:
            return self._check_limit(
                self.operation_requests[operation],
                self.rate_limits[operation],
                current_time
            )
        
        return {"allowed": True}
    
    def _check_global_limit(self, current_time: float) -> Dict[str, Any]:
        """Check global rate limits"""
        return self._check_limit(
            self.global_requests,
            self.rate_limits["global_operations"],
            current_time
        )
    
    def _check_limit(self, request_queue: deque, limit_config: Dict[str, Any], current_time: float) -> Dict[str, Any]:
        """Check a specific rate limit"""
        strategy = limit_config["strategy"]
        
        if strategy == RateLimitStrategy.SLIDING_WINDOW:
            return self._check_sliding_window(request_queue, limit_config, current_time)
        elif strategy == RateLimitStrategy.FIXED_WINDOW:
            return self._check_fixed_window(request_queue, limit_config, current_time)
        elif strategy == RateLimitStrategy.TOKEN_BUCKET:
            return self._check_token_bucket(request_queue, limit_config, current_time)
        elif strategy == RateLimitStrategy.EXPONENTIAL_BACKOFF:
            return self._check_exponential_backoff(request_queue, limit_config, current_time)
        
        return {"allowed": True}
    
    def _check_sliding_window(self, request_queue: deque, limit_config: Dict[str, Any], current_time: float) -> Dict[str, Any]:
        """Check sliding window rate limit"""
        window_size = limit_config["window"]
        max_requests = limit_config["requests"]
        
        # Remove old requests outside the window
        while request_queue and current_time - request_queue[0] > window_size:
            request_queue.popleft()
        
        if len(request_queue) >= max_requests:
            oldest_request = request_queue[0] if request_queue else current_time
            retry_after = window_size - (current_time - oldest_request)
            
            return {
                "allowed": False,
                "reason": f"Rate limit exceeded: {len(request_queue)}/{max_requests} requests in {window_size}s",
                "retry_after": max(0, retry_after)
            }
        
        return {"allowed": True}
    
    def _check_fixed_window(self, request_queue: deque, limit_config: Dict[str, Any], current_time: float) -> Dict[str, Any]:
        """Check fixed window rate limit"""
        window_size = limit_config["window"]
        max_requests = limit_config["requests"]
        
        # Calculate current window start
        window_start = int(current_time // window_size) * window_size
        
        # Count requests in current window
        current_window_requests = sum(1 for req_time in request_queue if req_time >= window_start)
        
        if current_window_requests >= max_requests:
            retry_after = window_start + window_size - current_time
            
            return {
                "allowed": False,
                "reason": f"Fixed window rate limit exceeded: {current_window_requests}/{max_requests}",
                "retry_after": retry_after
            }
        
        return {"allowed": True}
    
    def _check_token_bucket(self, request_queue: deque, limit_config: Dict[str, Any], current_time: float) -> Dict[str, Any]:
        """Check token bucket rate limit"""
        bucket_key = id(request_queue)  # Use queue ID as bucket key
        bucket = self.token_buckets[bucket_key]
        
        max_tokens = limit_config["requests"]
        refill_rate = max_tokens / limit_config["window"]  # tokens per second
        
        # Refill tokens
        time_passed = current_time - bucket["last_refill"]
        tokens_to_add = time_passed * refill_rate
        bucket["tokens"] = min(max_tokens, bucket["tokens"] + tokens_to_add)
        bucket["last_refill"] = current_time
        
        if bucket["tokens"] < 1:
            retry_after = (1 - bucket["tokens"]) / refill_rate
            
            return {
                "allowed": False,
                "reason": "Token bucket empty",
                "retry_after": retry_after
            }
        
        bucket["tokens"] -= 1
        return {"allowed": True}
    
    def _check_exponential_backoff(self, request_queue: deque, limit_config: Dict[str, Any], current_time: float) -> Dict[str, Any]:
        """Check exponential backoff rate limit"""
        # This is handled in record_failed_attempt and _is_blocked
        return {"allowed": True}
    
    def _record_request(self, identifier: str, operation: str, ip_address: Optional[str], current_time: float):
        """Record a successful request"""
        # Record for user
        self.user_requests[identifier].append(current_time)
        if operation:
            self.user_requests[f"{identifier}:{operation}"].append(current_time)
        
        # Record for IP
        if ip_address:
            self.ip_requests[ip_address].append(current_time)
            if operation in ["login", "pin_verify"]:
                self.ip_requests[f"{ip_address}:login"].append(current_time)
        
        # Record for operation
        if operation:
            self.operation_requests[operation].append(current_time)
        
        # Record globally
        self.global_requests.append(current_time)
    
    def _is_blocked(self, identifier: str, ip_address: Optional[str], current_time: float) -> bool:
        """Check if entity is blocked"""
        # Check permanent blocks
        if identifier in self.blocked_users:
            return True
        
        if ip_address and ip_address in self.blocked_ips:
            return True
        
        # Check temporary blocks
        user_block_key = f"user:{identifier}"
        if user_block_key in self.temporary_blocks:
            if current_time < self.temporary_blocks[user_block_key]:
                return True
            else:
                del self.temporary_blocks[user_block_key]
        
        if ip_address:
            ip_block_key = f"ip:{ip_address}"
            if ip_block_key in self.temporary_blocks:
                if current_time < self.temporary_blocks[ip_block_key]:
                    return True
                else:
                    del self.temporary_blocks[ip_block_key]
        
        # Check exponential backoff
        for key, attempt_data in self.failed_attempts.items():
            if (identifier in key or (ip_address and ip_address in key)) and current_time < attempt_data["backoff_until"]:
                return True
        
        return False
    
    def _get_retry_after(self, identifier: str, ip_address: Optional[str]) -> float:
        """Get retry after time for blocked entity"""
        current_time = time.time()
        retry_times = []
        
        # Check temporary blocks
        user_block_key = f"user:{identifier}"
        if user_block_key in self.temporary_blocks:
            retry_times.append(self.temporary_blocks[user_block_key] - current_time)
        
        if ip_address:
            ip_block_key = f"ip:{ip_address}"
            if ip_block_key in self.temporary_blocks:
                retry_times.append(self.temporary_blocks[ip_block_key] - current_time)
        
        # Check exponential backoff
        for key, attempt_data in self.failed_attempts.items():
            if (identifier in key or (ip_address and ip_address in key)) and current_time < attempt_data["backoff_until"]:
                retry_times.append(attempt_data["backoff_until"] - current_time)
        
        return max(retry_times) if retry_times else 0
    
    def _block_entity(self, entity: str, entity_type: str, duration: int):
        """Block an entity temporarily"""
        block_key = f"{entity_type}:{entity}"
        self.temporary_blocks[block_key] = time.time() + duration
    
    def block_user_permanently(self, user_id: str):
        """Permanently block a user"""
        self.blocked_users.add(user_id)
    
    def block_ip_permanently(self, ip_address: str):
        """Permanently block an IP"""
        self.blocked_ips.add(ip_address)
    
    def unblock_user(self, user_id: str):
        """Unblock a user"""
        self.blocked_users.discard(user_id)
        # Remove temporary blocks
        keys_to_remove = [key for key in self.temporary_blocks.keys() if f"user:{user_id}" in key]
        for key in keys_to_remove:
            del self.temporary_blocks[key]
    
    def unblock_ip(self, ip_address: str):
        """Unblock an IP"""
        self.blocked_ips.discard(ip_address)
        # Remove temporary blocks
        keys_to_remove = [key for key in self.temporary_blocks.keys() if f"ip:{ip_address}" in key]
        for key in keys_to_remove:
            del self.temporary_blocks[key]
    
    def get_rate_limit_status(self, identifier: str, ip_address: Optional[str] = None) -> Dict[str, Any]:
        """Get current rate limit status for an entity"""
        current_time = time.time()
        
        status = {
            "user_id": identifier,
            "ip_address": ip_address,
            "is_blocked": self._is_blocked(identifier, ip_address, current_time),
            "retry_after": self._get_retry_after(identifier, ip_address),
            "request_counts": {},
            "failed_attempts": {}
        }
        
        # Get request counts
        status["request_counts"]["user_general"] = len(self.user_requests[identifier])
        if ip_address:
            status["request_counts"]["ip_general"] = len(self.ip_requests[ip_address])
        
        # Get failed attempts
        for key, attempt_data in self.failed_attempts.items():
            if identifier in key or (ip_address and ip_address in key):
                status["failed_attempts"][key] = {
                    "count": attempt_data["count"],
                    "backoff_until": attempt_data["backoff_until"]
                }
        
        return status
    
    def cleanup_expired_data(self):
        """Clean up expired rate limiting data"""
        current_time = time.time()
        
        with self.lock:
            # Clean up old requests (older than 1 hour)
            cutoff_time = current_time - 3600
            
            for user_id in list(self.user_requests.keys()):
                queue = self.user_requests[user_id]
                while queue and queue[0] < cutoff_time:
                    queue.popleft()
                if not queue:
                    del self.user_requests[user_id]
            
            for ip in list(self.ip_requests.keys()):
                queue = self.ip_requests[ip]
                while queue and queue[0] < cutoff_time:
                    queue.popleft()
                if not queue:
                    del self.ip_requests[ip]
            
            # Clean up expired temporary blocks
            expired_blocks = [key for key, unblock_time in self.temporary_blocks.items() if current_time > unblock_time]
            for key in expired_blocks:
                del self.temporary_blocks[key]
            
            # Clean up old failed attempts
            expired_attempts = [key for key, data in self.failed_attempts.items() if current_time - data["last_attempt"] > 3600]
            for key in expired_attempts:
                del self.failed_attempts[key]
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get rate limiting statistics"""
        return {
            "active_users": len(self.user_requests),
            "active_ips": len(self.ip_requests),
            "blocked_users": len(self.blocked_users),
            "blocked_ips": len(self.blocked_ips),
            "temporary_blocks": len(self.temporary_blocks),
            "failed_attempts": len(self.failed_attempts),
            "token_buckets": len(self.token_buckets),
            "global_requests_last_minute": len([req for req in self.global_requests if time.time() - req < 60])
        }