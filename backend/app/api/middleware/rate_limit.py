from fastapi import Request, HTTPException, status
from typing import Callable, Any
from app.core.rate_limit import RateLimiter

async def get_client_ip(request: Request) -> str:
    """Extract client IP from request, handling proxies."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"


class RateLimitDependency:
    """
    FastAPI Dependency to enforce rate limits on specific routes.
    """
    def __init__(self, limit: int, window_seconds: int, scope: str):
        self.limit = limit
        self.window_seconds = window_seconds
        self.scope = scope

    async def __call__(self, request: Request):
        # Determine the key identifier based on scope
        if self.scope == "auth":
            # IP based for auth to prevent brute force
            identifier = await get_client_ip(request)
            key = f"rl:auth:{identifier}"
        elif self.scope == "widget":
            # IP based for widget
            identifier = await get_client_ip(request)
            key = f"rl:widget:{identifier}"
        elif self.scope == "api":
            # V11 FIX: API Key only from header (never from query params — URLs are logged)
            api_key = request.headers.get("X-API-Key")
            identifier = api_key if api_key else await get_client_ip(request)
            key = f"rl:api:{identifier}"
        else:
            identifier = await get_client_ip(request)
            key = f"rl:global:{identifier}"

        is_allowed, remaining = await RateLimiter.check_rate_limit(
            key=key, 
            limit=self.limit, 
            window_seconds=self.window_seconds
        )

        request.state.rate_limit_remaining = remaining
        request.state.rate_limit_limit = self.limit

        if not is_allowed:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "X-RateLimit-Limit": str(self.limit),
                    "X-RateLimit-Remaining": "0",
                    "Retry-After": str(self.window_seconds)
                }
            )
        
        return True


def rate_limit(limit: int, window_seconds: int, scope: str = "global"):
    """
    Helper function to use RateLimitDependency easily in route decorators.
    Usage: @router.get("/endpoint", dependencies=[Depends(rate_limit(10, 60, "auth"))])
    """
    return RateLimitDependency(limit=limit, window_seconds=window_seconds, scope=scope)
