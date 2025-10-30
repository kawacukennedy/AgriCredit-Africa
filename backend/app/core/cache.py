from redis import Redis
from typing import Any, Optional
import json
import pickle
from .config import settings

class Cache:
    def __init__(self):
        self.redis_client = Redis.from_url(settings.REDIS_URL, decode_responses=True)

    async def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        try:
            value = self.redis_client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception:
            return None

    async def set(self, key: str, value: Any, expire: int = 3600) -> bool:
        """Set value in cache with expiration"""
        try:
            return self.redis_client.setex(key, expire, json.dumps(value))
        except Exception:
            return False

    async def delete(self, key: str) -> bool:
        """Delete value from cache"""
        try:
            return bool(self.redis_client.delete(key))
        except Exception:
            return False

    async def get_sensor_data(self, device_id: str, hours: int = 24) -> Optional[dict]:
        """Get cached sensor data"""
        key = f"sensor_data:{device_id}:{hours}"
        return await self.get(key)

    async def set_sensor_data(self, device_id: str, hours: int, data: dict) -> bool:
        """Cache sensor data for 15 minutes"""
        key = f"sensor_data:{device_id}:{hours}"
        return await self.set(key, data, expire=900)  # 15 minutes

    async def get_credit_score(self, user_id: int, features_hash: str) -> Optional[dict]:
        """Get cached credit score"""
        key = f"credit_score:{user_id}:{features_hash}"
        return await self.get(key)

    async def set_credit_score(self, user_id: int, features_hash: str, score_data: dict) -> bool:
        """Cache credit score for 1 hour"""
        key = f"credit_score:{user_id}:{features_hash}"
        return await self.set(key, score_data, expire=3600)  # 1 hour

    async def get_yield_prediction(self, user_id: int, features_hash: str) -> Optional[dict]:
        """Get cached yield prediction"""
        key = f"yield_prediction:{user_id}:{features_hash}"
        return await self.get(key)

    async def set_yield_prediction(self, user_id: int, features_hash: str, prediction_data: dict) -> bool:
        """Cache yield prediction for 2 hours"""
        key = f"yield_prediction:{user_id}:{features_hash}"
        return await self.set(key, prediction_data, expire=7200)  # 2 hours

    async def invalidate_user_cache(self, user_id: int) -> None:
        """Invalidate all cache entries for a user"""
        try:
            # This is a simplified implementation
            # In production, you'd want to use Redis SCAN or maintain a set of user keys
            pattern = f"*:user:{user_id}:*"
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
        except Exception:
            pass

    # Oracle data caching methods
    async def set_oracle_price(self, key: str, price: float) -> bool:
        """Cache oracle price data"""
        cache_key = f"oracle_price:{key}"
        return await self.set(cache_key, price, expire=300)  # 5 minutes

    async def get_oracle_price(self, key: str) -> Optional[float]:
        """Get cached oracle price data"""
        cache_key = f"oracle_price:{key}"
        return await self.get(cache_key)

    async def set_weather_data(self, key: str, data: Any) -> bool:
        """Cache weather data"""
        cache_key = f"weather:{key}"
        return await self.set(cache_key, data, expire=1800)  # 30 minutes

    async def get_weather_data(self, key: str) -> Optional[Any]:
        """Get cached weather data"""
        cache_key = f"weather:{key}"
        return await self.get(cache_key)

    async def set_crop_yield_data(self, key: str, data: Any) -> bool:
        """Cache crop yield data"""
        cache_key = f"crop_yield:{key}"
        return await self.set(cache_key, data, expire=3600)  # 1 hour

    async def get_crop_yield_data(self, key: str) -> Optional[Any]:
        """Get cached crop yield data"""
        cache_key = f"crop_yield:{key}"
        return await self.get(cache_key)

# Global cache instance
cache = Cache()

# Dependency for FastAPI
def get_cache():
    return cache