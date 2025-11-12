import json
import redis.asyncio as redis
from typing import Any, Optional, Dict
from .config import settings

class CacheService:
    def __init__(self):
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get(self, key: str) -> Optional[str]:
        """Get value from cache"""
        return await self.redis.get(key)

    async def set(self, key: str, value: str, expire: int = 3600) -> bool:
        """Set value in cache with expiration"""
        return await self.redis.set(key, value, ex=expire)

    async def delete(self, key: str) -> int:
        """Delete key from cache"""
        return await self.redis.delete(key)

    async def exists(self, key: str) -> bool:
        """Check if key exists"""
        return await self.redis.exists(key)

    # Specialized methods for AgriCredit
    async def get_credit_score(self, user_id: int, features_hash: str) -> Optional[Dict]:
        """Get cached credit score"""
        key = f"credit_score:{user_id}:{features_hash}"
        data = await self.get(key)
        return json.loads(data) if data else None

    async def set_credit_score(self, user_id: int, features_hash: str, data: Dict, expire: int = 3600):
        """Cache credit score"""
        key = f"credit_score:{user_id}:{features_hash}"
        await self.set(key, json.dumps(data), expire)

    async def get_yield_prediction(self, user_id: int, features_hash: str) -> Optional[Dict]:
        """Get cached yield prediction"""
        key = f"yield_prediction:{user_id}:{features_hash}"
        data = await self.get(key)
        return json.loads(data) if data else None

    async def set_yield_prediction(self, user_id: int, features_hash: str, data: Dict, expire: int = 3600):
        """Cache yield prediction"""
        key = f"yield_prediction:{user_id}:{features_hash}"
        await self.set(key, json.dumps(data), expire)

    async def get_sensor_data(self, device_id: str, hours: int) -> Optional[Dict]:
        """Get cached sensor data"""
        key = f"sensor_data:{device_id}:{hours}"
        data = await self.get(key)
        return json.loads(data) if data else None

    async def set_sensor_data(self, device_id: str, hours: int, data: Dict, expire: int = 1800):
        """Cache sensor data"""
        key = f"sensor_data:{device_id}:{hours}"
        await self.set(key, json.dumps(data), expire)

    async def get_sensor_insights(self, device_id: str, days: int) -> Optional[Dict]:
        """Get cached sensor insights"""
        key = f"sensor_insights:{device_id}:{days}"
        data = await self.get(key)
        return json.loads(data) if data else None

    async def set_sensor_insights(self, device_id: str, days: int, data: Dict, expire: int = 3600):
        """Cache sensor insights"""
        key = f"sensor_insights:{device_id}:{days}"
        await self.set(key, json.dumps(data), expire)

    async def invalidate_user_cache(self, user_id: int):
        """Invalidate all cache entries for a user"""
        # This would require pattern matching, simplified for now
        pass

# Global cache instance
cache_service = CacheService()

# Dependency for FastAPI
async def get_cache():
    return cache_service