import time
import logging
from typing import Tuple

from app.core.redis_client import RedisClient

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Redis-based Sliding Window Rate Limiter.
    """

    @classmethod
    async def check_rate_limit(cls, key: str, limit: int, window_seconds: int) -> Tuple[bool, int]:
        """
        Check if the request is within the rate limit.
        Uses a sorted set to maintain a sliding window of request timestamps.

        Returns:
            Tuple[bool, int]: (is_allowed, remaining_requests)
        """
        client = await RedisClient.get_client()
        if not client:
            # If Redis is unavailable, fail open to prevent blocking legitimate traffic
            return True, limit

        now = time.time()
        window_start = now - window_seconds
        
        try:
            # Redis transaction logic
            # 1. Remove timestamps older than the window
            # 2. Add current timestamp
            # 3. Count remaining timestamps in the window
            # 4. Set expiration on the key
            pipeline = client.pipeline()
            pipeline.zremrangebyscore(key, 0, window_start)
            pipeline.zcard(key)
            pipeline.zadd(key, {str(now): now})
            pipeline.expire(key, window_seconds)
            
            results = await pipeline.execute()
            
            # The count is returned by zcard
            current_count = results[1]
            
            is_allowed = current_count < limit
            remaining = max(0, limit - current_count - 1) if is_allowed else 0
            
            # If not allowed, we shouldn't have added the timestamp, remove it to prevent penalizing further
            if not is_allowed:
                await client.zrem(key, str(now))
                
            return is_allowed, remaining
            
        except Exception as e:
            logger.error(f"Rate limiting error for key {key}: {e}")
            # Fail open
            return True, limit

