import logging
import json
from datetime import datetime
from typing import Any, Dict

from redis.asyncio import Redis, ConnectionPool
from app.core.config import settings

logger = logging.getLogger(__name__)

class RedisClient:
    _pool: ConnectionPool | None = None
    _redis: Redis | None = None

    @classmethod
    async def get_client(cls) -> Redis:
        if cls._redis is None:
            await cls.init()
        return cls._redis  # type: ignore

    @classmethod
    async def init(cls) -> None:
        """Initialize Redis connection pool"""
        if cls._pool is None:
            try:
                # Use decode_responses=False to handle raw bytes (better for msgpack/pickle if needed)
                # But true is better for simple JSON strings and rate limiting text
                cls._pool = ConnectionPool.from_url(
                    settings.REDIS_URL,
                    max_connections=50,
                    decode_responses=True 
                )
                cls._redis = Redis(connection_pool=cls._pool)
                # Test connection
                await cls._redis.ping()
                logger.info("Successfully connected to Redis")
            except Exception as e:
                logger.error(f"Failed to connect to Redis at {settings.REDIS_URL}: {e}")
                # We do not raise here so the app can start gracefully even if Redis is down
                # (Rate limiting / caching will gracefully bypass or fail)

    @classmethod
    async def close(cls) -> None:
        """Close Redis connection pool"""
        if cls._redis is not None:
            await cls._redis.aclose()
            logger.info("Redis connection closed")
            cls._redis = None
            cls._pool = None

    @classmethod
    async def get_json(cls, key: str) -> Dict[str, Any] | None:
        client = await cls.get_client()
        try:
            val = await client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error(f"Redis get_json error for {key}: {e}")
        return None

    @classmethod
    async def set_json(cls, key: str, value: Dict[str, Any] | list, expire: int = None) -> bool:
        client = await cls.get_client()
        try:
            await client.set(key, json.dumps(value), ex=expire)
            return True
        except Exception as e:
            logger.error(f"Redis set_json error for {key}: {e}")
            return False

# Dependency injection helper
async def get_redis() -> Redis:
    return await RedisClient.get_client()
