"""
Cache Service
Redis-based caching with fallback to memory cache
"""

import json
import pickle
import logging
from typing import Any, Optional, Dict, List
from datetime import datetime, timedelta
import redis.asyncio as redis
import os

logger = logging.getLogger(__name__)

class CacheService:
    """Advanced caching service with Redis backend and memory fallback"""
    
    def __init__(self):
        self.redis_client = None
        self.memory_cache: Dict[str, Dict[str, Any]] = {}
        self.memory_cache_ttl: Dict[str, datetime] = {}
        self.redis_url = os.getenv("REDIS_URL")
        self.default_ttl = 3600  # 1 hour
        
    async def get_redis_client(self):
        """Get or create Redis client"""
        if not self.redis_client and self.redis_url:
            try:
                self.redis_client = redis.from_url(self.redis_url)
                await self.redis_client.ping()
                logger.info("✅ Redis cache connected")
            except Exception as e:
                logger.warning(f"Redis connection failed, using memory cache: {e}")
                self.redis_client = None
        return self.redis_client
    
    def _clean_memory_cache(self):
        """Clean expired entries from memory cache"""
        current_time = datetime.utcnow()
        expired_keys = [
            key for key, expiry in self.memory_cache_ttl.items()
            if expiry < current_time
        ]
        
        for key in expired_keys:
            self.memory_cache.pop(key, None)
            self.memory_cache_ttl.pop(key, None)
    
    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                # Try Redis first
                try:
                    value = await redis_client.get(key)
                    if value:
                        return json.loads(value)
                except Exception as e:
                    logger.error(f"Redis get error: {e}")
            
            # Fallback to memory cache
            self._clean_memory_cache()
            
            if key in self.memory_cache:
                if key in self.memory_cache_ttl and self.memory_cache_ttl[key] > datetime.utcnow():
                    return self.memory_cache[key]["value"]
                else:
                    # Expired
                    self.memory_cache.pop(key, None)
                    self.memory_cache_ttl.pop(key, None)
            
            return None
            
        except Exception as e:
            logger.error(f"Cache get error: {e}")
            return None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        """Set value in cache"""
        try:
            if ttl is None:
                ttl = self.default_ttl
            
            redis_client = await self.get_redis_client()
            
            if redis_client:
                # Try Redis first
                try:
                    await redis_client.setex(key, ttl, json.dumps(value, default=str))
                    return True
                except Exception as e:
                    logger.error(f"Redis set error: {e}")
            
            # Fallback to memory cache
            self.memory_cache[key] = {"value": value}
            self.memory_cache_ttl[key] = datetime.utcnow() + timedelta(seconds=ttl)
            
            # Clean memory cache if it gets too large
            if len(self.memory_cache) > 1000:
                self._clean_memory_cache()
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    await redis_client.delete(key)
                except Exception as e:
                    logger.error(f"Redis delete error: {e}")
            
            # Also remove from memory cache
            self.memory_cache.pop(key, None)
            self.memory_cache_ttl.pop(key, None)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache delete error: {e}")
            return False
    
    async def exists(self, key: str) -> bool:
        """Check if key exists in cache"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    return await redis_client.exists(key) > 0
                except Exception as e:
                    logger.error(f"Redis exists error: {e}")
            
            # Check memory cache
            self._clean_memory_cache()
            return key in self.memory_cache and key in self.memory_cache_ttl
            
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
            return False
    
    async def increment(self, key: str, amount: int = 1) -> Optional[int]:
        """Increment a numeric value in cache"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    return await redis_client.incrby(key, amount)
                except Exception as e:
                    logger.error(f"Redis increment error: {e}")
            
            # Memory cache fallback
            current_value = await self.get(key) or 0
            new_value = int(current_value) + amount
            await self.set(key, new_value)
            return new_value
            
        except Exception as e:
            logger.error(f"Cache increment error: {e}")
            return None
    
    async def get_many(self, keys: List[str]) -> Dict[str, Any]:
        """Get multiple values from cache"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    values = await redis_client.mget(keys)
                    result = {}
                    for i, key in enumerate(keys):
                        if values[i]:
                            result[key] = json.loads(values[i])
                    return result
                except Exception as e:
                    logger.error(f"Redis mget error: {e}")
            
            # Memory cache fallback
            result = {}
            for key in keys:
                value = await self.get(key)
                if value is not None:
                    result[key] = value
            
            return result
            
        except Exception as e:
            logger.error(f"Cache get_many error: {e}")
            return {}
    
    async def set_many(self, mapping: Dict[str, Any], ttl: int = None) -> bool:
        """Set multiple values in cache"""
        try:
            if ttl is None:
                ttl = self.default_ttl
            
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    # Use pipeline for efficiency
                    pipe = redis_client.pipeline()
                    for key, value in mapping.items():
                        pipe.setex(key, ttl, json.dumps(value, default=str))
                    await pipe.execute()
                    return True
                except Exception as e:
                    logger.error(f"Redis mset error: {e}")
            
            # Memory cache fallback
            for key, value in mapping.items():
                await self.set(key, value, ttl)
            
            return True
            
        except Exception as e:
            logger.error(f"Cache set_many error: {e}")
            return False
    
    async def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching a pattern"""
        try:
            redis_client = await self.get_redis_client()
            
            if redis_client:
                try:
                    keys = await redis_client.keys(pattern)
                    if keys:
                        await redis_client.delete(*keys)
                    return len(keys)
                except Exception as e:
                    logger.error(f"Redis clear pattern error: {e}")
            
            # Memory cache fallback
            import fnmatch
            matching_keys = [
                key for key in self.memory_cache.keys()
                if fnmatch.fnmatch(key, pattern)
            ]
            
            for key in matching_keys:
                self.memory_cache.pop(key, None)
                self.memory_cache_ttl.pop(key, None)
            
            return len(matching_keys)
            
        except Exception as e:
            logger.error(f"Cache clear pattern error: {e}")
            return 0
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        try:
            stats = {
                "memory_cache_size": len(self.memory_cache),
                "redis_connected": self.redis_client is not None
            }
            
            redis_client = await self.get_redis_client()
            if redis_client:
                try:
                    info = await redis_client.info()
                    stats.update({
                        "redis_used_memory": info.get("used_memory_human", "unknown"),
                        "redis_connected_clients": info.get("connected_clients", 0),
                        "redis_total_commands": info.get("total_commands_processed", 0)
                    })
                except Exception as e:
                    logger.error(f"Redis stats error: {e}")
            
            return stats
            
        except Exception as e:
            logger.error(f"Cache stats error: {e}")
            return {"error": str(e)}

# Global cache service instance
cache_service = CacheService()

# Convenience functions
async def get_cache(key: str) -> Optional[Any]:
    """Get value from cache"""
    return await cache_service.get(key)

async def set_cache(key: str, value: Any, ttl: int = None) -> bool:
    """Set value in cache"""
    return await cache_service.set(key, value, ttl)

async def delete_cache(key: str) -> bool:
    """Delete value from cache"""
    return await cache_service.delete(key)

async def clear_cache_pattern(pattern: str) -> int:
    """Clear all keys matching pattern"""
    return await cache_service.clear_pattern(pattern)

# Cache decorators
def cache_result(ttl: int = 3600, key_prefix: str = ""):
    """Decorator to cache function results"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # Generate cache key
            import hashlib
            key_data = f"{key_prefix}{func.__name__}{str(args)}{str(sorted(kwargs.items()))}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()
            
            # Try to get from cache
            cached_result = await get_cache(cache_key)
            if cached_result is not None:
                return cached_result
            
            # Execute function and cache result
            result = await func(*args, **kwargs)
            await set_cache(cache_key, result, ttl)
            return result
        
        return wrapper
    return decorator

# Initialize Redis client on startup
redis_client = None

async def init_redis():
    """Initialize Redis client"""
    global redis_client
    redis_url = os.getenv("REDIS_URL")
    
    if redis_url:
        try:
            redis_client = redis.from_url(redis_url)
            await redis_client.ping()
            logger.info("✅ Redis initialized successfully")
        except Exception as e:
            logger.warning(f"Redis initialization failed: {e}")
            redis_client = None
    else:
        logger.info("Redis URL not configured, using memory cache only")