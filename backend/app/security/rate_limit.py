"""
Security-Layer Rate Limiting
=============================
Provides security-focused rate limiting that goes beyond the middleware layer.

The middleware rate limiter (app.api.middleware.rate_limit) handles per-route
throttling.  This module adds:
  • Per-user burst protection (login / OTP brute force)
  • Per-API-key quotas (daily / monthly caps)
  • Adaptive penalties for repeated violations
  • IP-based lockout after sustained abuse

All limits use the shared Redis sliding-window from app.core.rate_limit.
"""

import logging
from typing import Tuple, Optional
from datetime import datetime, timezone

from app.core.rate_limit import RateLimiter
from app.core.redis_client import RedisClient

logger = logging.getLogger(__name__)

# ─── Default Limits ───

AUTH_LIMITS = {
    "login_attempts":     {"limit": 5,  "window": 300},    # 5 per 5 min
    "otp_attempts":       {"limit": 5,  "window": 300},    # 5 per 5 min
    "password_reset":     {"limit": 3,  "window": 3600},   # 3 per hour
    "signup":             {"limit": 10, "window": 3600},    # 10 per hour
}

API_KEY_LIMITS = {
    "per_minute":  60,
    "per_hour":    1000,
    "per_day":     10000,
}

# Lockout after N consecutive violations
LOCKOUT_THRESHOLD = 10        # violations before lockout
LOCKOUT_DURATION_SECONDS = 900  # 15-minute lockout


# ─── Auth Rate Limiting ───

async def check_auth_rate_limit(
    identifier: str,
    action: str,
) -> Tuple[bool, int]:
    """
    Check rate limit for an authentication action.

    Args:
        identifier: Email or IP of the user.
        action:     One of 'login_attempts', 'otp_attempts', 'password_reset', 'signup'.

    Returns:
        (is_allowed, remaining_requests)
    """
    cfg = AUTH_LIMITS.get(action)
    if not cfg:
        logger.warning(f"Unknown auth rate-limit action: {action}")
        return True, 99

    key = f"rl:sec:auth:{action}:{identifier}"
    return await RateLimiter.check_rate_limit(key, cfg["limit"], cfg["window"])


async def check_login_rate_limit(email: str, ip: str) -> Tuple[bool, int]:
    """
    Combined login rate limit: checks BOTH email AND IP.
    Both must be within limits for the request to be allowed.
    """
    email_ok, email_rem = await check_auth_rate_limit(email, "login_attempts")
    ip_ok, ip_rem = await check_auth_rate_limit(ip, "login_attempts")

    is_allowed = email_ok and ip_ok
    remaining = min(email_rem, ip_rem)
    return is_allowed, remaining


async def check_otp_rate_limit(email: str, ip: str) -> Tuple[bool, int]:
    """
    OTP verification rate limit: checks both email and IP.
    """
    email_ok, email_rem = await check_auth_rate_limit(email, "otp_attempts")
    ip_ok, ip_rem = await check_auth_rate_limit(ip, "otp_attempts")

    is_allowed = email_ok and ip_ok
    remaining = min(email_rem, ip_rem)
    return is_allowed, remaining


# ─── API Key Rate Limiting ───

async def check_api_key_rate_limit(
    api_key_id: str,
    window: str = "per_minute",
) -> Tuple[bool, int]:
    """
    Check rate limit for a specific API key.

    Args:
        api_key_id: UUID string of the API key record.
        window:     One of 'per_minute', 'per_hour', 'per_day'.

    Returns:
        (is_allowed, remaining_requests)
    """
    window_map = {
        "per_minute": 60,
        "per_hour":   3600,
        "per_day":    86400,
    }
    limit = API_KEY_LIMITS.get(window, 60)
    window_seconds = window_map.get(window, 60)

    key = f"rl:sec:apikey:{window}:{api_key_id}"
    return await RateLimiter.check_rate_limit(key, limit, window_seconds)


# ─── IP Lockout (Adaptive Penalty) ───

async def record_violation(ip: str) -> bool:
    """
    Record a rate-limit violation for an IP address.
    If violations exceed LOCKOUT_THRESHOLD, the IP is locked out.

    Returns:
        True if the IP is now locked out.
    """
    client = await RedisClient.get_client()
    if not client:
        return False

    violation_key = f"rl:sec:violations:{ip}"
    try:
        count = await client.incr(violation_key)
        if count == 1:
            await client.expire(violation_key, LOCKOUT_DURATION_SECONDS)

        if count >= LOCKOUT_THRESHOLD:
            lockout_key = f"rl:sec:lockout:{ip}"
            await client.set(lockout_key, "1", ex=LOCKOUT_DURATION_SECONDS)
            logger.warning(f"IP {ip} locked out after {count} violations")
            return True

        return False
    except Exception as e:
        logger.error(f"Failed to record violation for {ip}: {e}")
        return False


async def is_ip_locked_out(ip: str) -> bool:
    """
    Check if an IP address is currently locked out.
    """
    client = await RedisClient.get_client()
    if not client:
        return False  # fail open

    try:
        lockout_key = f"rl:sec:lockout:{ip}"
        result = await client.get(lockout_key)
        return result is not None
    except Exception as e:
        logger.error(f"Failed to check lockout for {ip}: {e}")
        return False


async def clear_violations(ip: str) -> None:
    """
    Clear violation history for an IP (e.g., after successful login).
    """
    client = await RedisClient.get_client()
    if not client:
        return

    try:
        await client.delete(f"rl:sec:violations:{ip}")
        await client.delete(f"rl:sec:lockout:{ip}")
    except Exception as e:
        logger.error(f"Failed to clear violations for {ip}: {e}")


# ─── Usage Tracking ───

async def get_api_key_usage(api_key_id: str) -> dict:
    """
    Get current usage counts for an API key across all windows.

    Returns:
        {"per_minute": N, "per_hour": N, "per_day": N}
    """
    client = await RedisClient.get_client()
    if not client:
        return {"per_minute": 0, "per_hour": 0, "per_day": 0}

    usage = {}
    for window in ("per_minute", "per_hour", "per_day"):
        key = f"rl:sec:apikey:{window}:{api_key_id}"
        try:
            count = await client.zcard(key)
            usage[window] = count or 0
        except Exception:
            usage[window] = 0

    return usage
