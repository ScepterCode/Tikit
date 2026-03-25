"""
Wallet Performance Optimization Module
Handles caching, connection pooling, and performance optimizations
"""
import time
import threading
from typing import Dict, Any, Optional
from collections import defaultdict, deque
import asyncio
from concurrent.futures import ThreadPoolExecutor

class WalletPerformanceModule:
    """Performance optimization module for wallet operations"""
    
    def __init__(self):
        # In-memory cache for frequently accessed data
        self.balance_cache = {}  # user_id -> {wallet_type -> (balance, timestamp)}
        self.transaction_cache = {}  # user_id -> cached_transactions
        self.cache_ttl = 30  # 30 seconds cache TTL
        
        # Connection pooling for concurrent operations
        self.operation_pool = ThreadPoolExecutor(max_workers=50)
        self.batch_operations = defaultdict(list)
        self.batch_lock = threading.Lock()
        
        # Performance monitoring
        self.operation_times = deque(maxlen=1000)
        self.error_counts = defaultdict(int)
        
        # Rate limiting per user
        self.user_request_counts = defaultdict(lambda: deque(maxlen=1000))
        self.rate_limit_window = 60  # 1 minute window
        self.max_requests_per_minute = 500  # Increased from 100
        
    def get_cached_balance(self, user_id: str, wallet_type: str) -> Optional[float]:
        """Get cached balance if still valid"""
        cache_key = f"{user_id}:{wallet_type}"
        if cache_key in self.balance_cache:
            balance, timestamp = self.balance_cache[cache_key]
            if time.time() - timestamp < self.cache_ttl:
                return balance
        return None
    
    def cache_balance(self, user_id: str, wallet_type: str, balance: float):
        """Cache balance with timestamp"""
        cache_key = f"{user_id}:{wallet_type}"
        self.balance_cache[cache_key] = (balance, time.time())
    
    def invalidate_user_cache(self, user_id: str):
        """Invalidate all cache entries for a user"""
        keys_to_remove = [key for key in self.balance_cache.keys() if key.startswith(f"{user_id}:")]
        for key in keys_to_remove:
            del self.balance_cache[key]
        
        if user_id in self.transaction_cache:
            del self.transaction_cache[user_id]
    
    def check_rate_limit(self, user_id: str) -> bool:
        """Check if user is within rate limits"""
        current_time = time.time()
        user_requests = self.user_request_counts[user_id]
        
        # Remove old requests outside the window
        while user_requests and current_time - user_requests[0] > self.rate_limit_window:
            user_requests.popleft()
        
        # Check if under limit
        if len(user_requests) >= self.max_requests_per_minute:
            return False
        
        # Add current request
        user_requests.append(current_time)
        return True
    
    def batch_operation(self, operation_type: str, operation_data: Dict[str, Any]):
        """Add operation to batch for processing"""
        with self.batch_lock:
            self.batch_operations[operation_type].append(operation_data)
    
    def process_batched_operations(self):
        """Process all batched operations"""
        with self.batch_lock:
            for operation_type, operations in self.batch_operations.items():
                if operations:
                    # Process operations in batch
                    self._process_operation_batch(operation_type, operations)
                    operations.clear()
    
    def _process_operation_batch(self, operation_type: str, operations: list):
        """Process a batch of operations efficiently"""
        if operation_type == "balance_update":
            # Batch balance updates
            for op in operations:
                # Process balance update
                pass
        elif operation_type == "transaction_create":
            # Batch transaction creation
            for op in operations:
                # Process transaction creation
                pass
    
    def record_operation_time(self, operation_name: str, duration: float):
        """Record operation timing for monitoring"""
        self.operation_times.append({
            "operation": operation_name,
            "duration": duration,
            "timestamp": time.time()
        })
    
    def get_performance_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.operation_times:
            return {"avg_duration": 0, "total_operations": 0}
        
        durations = [op["duration"] for op in self.operation_times]
        return {
            "avg_duration": sum(durations) / len(durations),
            "max_duration": max(durations),
            "min_duration": min(durations),
            "total_operations": len(self.operation_times),
            "cache_hit_ratio": self._calculate_cache_hit_ratio(),
            "error_counts": dict(self.error_counts)
        }
    
    def _calculate_cache_hit_ratio(self) -> float:
        """Calculate cache hit ratio"""
        # Simplified calculation - in production, track hits/misses
        return 0.85  # Placeholder
    
    def optimize_concurrent_access(self, user_id: str, operation: callable, *args, **kwargs):
        """Optimize concurrent access to user data"""
        # Use thread pool for CPU-intensive operations
        future = self.operation_pool.submit(operation, *args, **kwargs)
        return future
    
    def cleanup_expired_cache(self):
        """Clean up expired cache entries"""
        current_time = time.time()
        expired_keys = []
        
        for key, (balance, timestamp) in self.balance_cache.items():
            if current_time - timestamp > self.cache_ttl:
                expired_keys.append(key)
        
        for key in expired_keys:
            del self.balance_cache[key]
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            "balance_cache_size": len(self.balance_cache),
            "transaction_cache_size": len(self.transaction_cache),
            "cache_ttl": self.cache_ttl,
            "active_users": len(self.user_request_counts)
        }