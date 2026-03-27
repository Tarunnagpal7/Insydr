"""
API Key Security Utilities
==========================
Provides hashing, validation, generation, and rotation functions
for API keys at the security layer (distinct from the service layer).

Uses SHA-256 for key hashing and the `secrets` module for generation.
"""

import hashlib
import secrets
import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

logger = logging.getLogger(__name__)

# Key format: sk_live_<random_43_chars>  (total ~51 chars)
KEY_PREFIX_FORMAT = "sk_live_"
KEY_RANDOM_BYTES = 32  # 32 bytes → 43 URL-safe base64 chars
KEY_DISPLAY_PREFIX_LEN = 12  # "sk_live_XXXX" shown to users


def generate_api_key() -> Tuple[str, str, str]:
    """
    Generate a new API key.

    Returns:
        (full_key, key_hash, key_prefix)
        - full_key:   The raw key shown to the user ONCE (e.g. sk_live_abc123...)
        - key_hash:   SHA-256 hex digest for storage (never store the raw key)
        - key_prefix: First 12 chars for display in dashboards
    """
    raw = secrets.token_urlsafe(KEY_RANDOM_BYTES)
    full_key = f"{KEY_PREFIX_FORMAT}{raw}"
    key_hash = hash_api_key(full_key)
    key_prefix = full_key[:KEY_DISPLAY_PREFIX_LEN]
    return full_key, key_hash, key_prefix


def hash_api_key(full_key: str) -> str:
    """
    Hash an API key using SHA-256.

    This is a one-way hash — the raw key cannot be recovered.
    Used for storage and lookup.
    """
    return hashlib.sha256(full_key.encode("utf-8")).hexdigest()


def verify_api_key(full_key: str, stored_hash: str) -> bool:
    """
    Verify that a raw API key matches a stored hash.

    Uses constant-time comparison to prevent timing attacks.
    """
    computed = hash_api_key(full_key)
    return secrets.compare_digest(computed, stored_hash)


def is_key_expired(expires_at: Optional[datetime]) -> bool:
    """
    Check if an API key has passed its expiration timestamp.

    Returns False if expires_at is None (key never expires).
    """
    if expires_at is None:
        return False
    now = datetime.now(timezone.utc)
    # Handle naive datetimes (legacy data)
    if expires_at.tzinfo is None:
        from datetime import timezone as tz
        expires_at = expires_at.replace(tzinfo=tz.utc)
    return now >= expires_at


def rotate_api_key() -> Tuple[str, str, str]:
    """
    Generate a fresh key for rotation.

    Rotation flow (handled by the service layer):
      1. Generate new key  →  this function
      2. Store new hash, update prefix
      3. Optionally keep old key valid for a grace period
      4. Deactivate old key

    Returns:
        Same tuple as generate_api_key().
    """
    return generate_api_key()


def mask_key(full_key: str) -> str:
    """
    Mask an API key for safe logging / display.

    Example: sk_live_Ab3x...z9Qw
    """
    if len(full_key) <= KEY_DISPLAY_PREFIX_LEN + 4:
        return full_key[:4] + "..." + full_key[-4:]
    return full_key[:KEY_DISPLAY_PREFIX_LEN] + "..." + full_key[-4:]


def validate_key_format(key: str) -> bool:
    """
    Check that a key string looks like a valid Insydr API key.

    Validates prefix and minimum length only — does NOT check the database.
    """
    if not key or not isinstance(key, str):
        return False
    if not key.startswith(KEY_PREFIX_FORMAT):
        return False
    # sk_live_ (8 chars) + at least 32 chars of random
    if len(key) < 40:
        return False
    return True
