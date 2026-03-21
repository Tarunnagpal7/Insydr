import json
import hashlib
from functools import wraps
from typing import Any, Callable, TypeVar, cast
import logging

from fastapi import Request, Response
from pydantic import BaseModel

from app.core.redis_client import RedisClient

logger = logging.getLogger(__name__)

T = TypeVar("T")

def generate_cache_key(prefix: str, *args, **kwargs) -> str:
    """Generate a consistent cache key based on a prefix and arguments."""
    raw = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    hashed = hashlib.sha256(raw.encode()).hexdigest()
    return f"{prefix}:{hashed}"

def cache_response(ttl_seconds: int = 3600, key_prefix: str = "cache:response"):
    """
    FastAPI endpoint decorator to cache JSON responses.
    Ignores Request, Response, and DB session objects from the cache key.
    """
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Try to get the request object to skip caching if method is not GET/POST
            request: Request | None = kwargs.get("request")
            if request and request.method not in ["GET", "POST"]:
                return await func(*args, **kwargs)

            # Build a cache key from serializable kwargs
            cacheable_kwargs = {}
            for k, v in kwargs.items():
                if k in ["request", "response", "db", "background_tasks", "admin", "current_user"]:
                    continue
                # For pydantic models
                if isinstance(v, BaseModel):
                    cacheable_kwargs[k] = v.model_dump()
                else:
                    cacheable_kwargs[k] = v

            cache_key = generate_cache_key(f"{key_prefix}:{func.__name__}", **cacheable_kwargs)
            
            # Check Redis
            client = await RedisClient.get_client()
            if client:
                try:
                    cached_data = await client.get(cache_key)
                    if cached_data:
                        logger.debug(f"Cache hit: {cache_key}")
                        return json.loads(cached_data)
                except Exception as e:
                    logger.warning(f"Cache read error: {e}")

            # Execute actual function
            result = await func(*args, **kwargs)

            # Store in Redis
            if client:
                try:
                    # Convert response to dict if it's a Pydantic model
                    to_cache = result.model_dump() if isinstance(result, BaseModel) else result
                    # Only cache if it's serializable
                    json_data = json.dumps(to_cache)
                    await client.set(cache_key, json_data, ex=ttl_seconds)
                    logger.debug(f"Cache set: {cache_key}")
                except Exception as e:
                    logger.warning(f"Cache write error: {e}")

            return result
        return wrapper
    return decorator


async def get_embedding_cache(text: str) -> list[float] | None:
    """Retrieve embedding vector from cache if it exists."""
    client = await RedisClient.get_client()
    if not client:
        return None
    
    hashed = hashlib.sha256(text.encode()).hexdigest()
    key = f"cache:embedding:{hashed}"
    try:
        data = await client.get(key)
        if data:
            return json.loads(data)
    except Exception as e:
        logger.warning(f"Embedding cache read error: {e}")
    return None

async def set_embedding_cache(text: str, embedding: list[float], ttl: int = 86400 * 30) -> None:
    """Cache an embedding vector for 30 days."""
    client = await RedisClient.get_client()
    if not client:
        return
        
    hashed = hashlib.sha256(text.encode()).hexdigest()
    key = f"cache:embedding:{hashed}"
    try:
        await client.set(key, json.dumps(embedding), ex=ttl)
    except Exception as e:
        logger.warning(f"Embedding cache write error: {e}")
