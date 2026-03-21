import json
import hashlib
import time
from typing import Dict, Any, List

from app.core.redis_client import RedisClient
import logging

logger = logging.getLogger(__name__)

class ErrorAlertService:
    """
    Tracks and aggregates critical errors using Redis.
    Deduplicates identical stack traces within a time window.
    """
    
    _ERROR_SET_KEY = "alerts:error_hashes"
    
    @classmethod
    async def track_error(cls, exc_cls: str, message: str, stack_trace: str, context: Dict[str, Any] = None) -> None:
        client = await RedisClient.get_client()
        if not client:
            return
            
        # Deduplication hash based on the exception class and top of stack trace
        # (Assuming the stack trace has meaningful lines)
        trace_summary = "\n".join(stack_trace.split("\n")[-5:]) if stack_trace else message
        raw_signature = f"{exc_cls}:{trace_summary}"
        error_hash = hashlib.md5(raw_signature.encode()).hexdigest()
        
        detail_key = f"alerts:details:{error_hash}"
        
        # Check if error already tracked
        exists = await client.exists(detail_key)
        
        now = int(time.time())
        
        if exists:
            # Increment occurrence count and update last_seen
            await client.hincrby(detail_key, "count", 1)
            await client.hset(detail_key, "last_seen", now)
        else:
            # First time seeing this error
            error_data = {
                "hash": error_hash,
                "type": exc_cls,
                "message": message,
                "stack_trace": stack_trace,
                "first_seen": now,
                "last_seen": now,
                "count": 1,
                "status": "unresolved",
                "context": json.dumps(context or {})
            }
            await client.hset(detail_key, mapping=error_data) # type: ignore
            # Keep error available for 7 days
            await client.expire(detail_key, 86400 * 7)
            # Add to the set of known active errors
            await client.sadd(cls._ERROR_SET_KEY, error_hash)
            
            logger.info(f"New critical alert tracked: {exc_cls} - {message}")

    @classmethod
    async def get_active_alerts(cls) -> List[Dict[str, Any]]:
        client = await RedisClient.get_client()
        if not client:
            return []
            
        error_hashes = await client.smembers(cls._ERROR_SET_KEY)
        alerts = []
        
        for e_hash in error_hashes:
            # e_hash will be string if decode_responses=True
            detail_key = f"alerts:details:{e_hash}"
            alert_data = await client.hgetall(detail_key)
            
            if not alert_data:
                # Expired or deleted
                await client.srem(cls._ERROR_SET_KEY, e_hash)
                continue
                
            # Parse types
            try:
                alert_data["count"] = int(alert_data.get("count", 1))
                alert_data["first_seen"] = int(alert_data.get("first_seen", 0))
                alert_data["last_seen"] = int(alert_data.get("last_seen", 0))
                alert_data["context"] = json.loads(alert_data.get("context", "{}"))
                alerts.append(alert_data)
            except Exception as e:
                logger.warning(f"Failed to parse alert {e_hash}: {e}")
                
        # Sort by most recent
        alerts.sort(key=lambda x: x["last_seen"], reverse=True)
        return alerts

    @classmethod
    async def resolve_alert(cls, error_hash: str) -> bool:
        """Mark an alert as resolved and remove it from active tracking."""
        client = await RedisClient.get_client()
        if not client:
            return False
            
        detail_key = f"alerts:details:{error_hash}"
        exists = await client.exists(detail_key)
        
        if exists:
            # Just remove it completely so it starts fresh if it happens again
            await client.delete(detail_key)
            await client.srem(cls._ERROR_SET_KEY, error_hash)
            return True
            
        return False
