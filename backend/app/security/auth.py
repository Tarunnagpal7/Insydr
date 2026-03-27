from datetime import datetime, timedelta, timezone
from typing import Optional
import secrets
import logging

import jwt
from passlib.context import CryptContext
from app.core.config import settings

logger = logging.getLogger(__name__)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a stored password against one provided by user."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRATION_HOURS)
    
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT access token."""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None


def generate_otp() -> str:
    """Generate a cryptographically secure 6-digit OTP code."""
    # V2 FIX: Use secrets module instead of random for crypto-safe OTP
    return str(100000 + secrets.randbelow(900000))


# ─── V7: JWT Token Blacklisting ───

async def blacklist_token(token: str) -> bool:
    """
    Add a JWT token to the Redis blacklist.
    The entry expires when the token itself would expire, so Redis auto-cleans.
    """
    from app.core.redis_client import RedisClient
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"verify_exp": False},  # decode even if expired
        )
        exp = payload.get("exp")
        if exp:
            ttl = max(int(exp - datetime.now(timezone.utc).timestamp()), 1)
        else:
            ttl = settings.JWT_EXPIRATION_HOURS * 3600

        client = await RedisClient.get_client()
        if client:
            await client.set(f"bl:jwt:{token}", "1", ex=ttl)
            return True
    except Exception as e:
        logger.error(f"Failed to blacklist token: {e}")
    return False


async def is_token_blacklisted(token: str) -> bool:
    """Check if a JWT token has been blacklisted (e.g. after logout)."""
    from app.core.redis_client import RedisClient
    try:
        client = await RedisClient.get_client()
        if client:
            result = await client.get(f"bl:jwt:{token}")
            return result is not None
    except Exception as e:
        logger.error(f"Failed to check token blacklist: {e}")
    # Fail-open: if Redis is down, don't block legitimate requests
    return False
