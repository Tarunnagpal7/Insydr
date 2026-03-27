"""
Shared Test Fixtures
====================
Provides reusable fixtures for all test files:
  - Test database sessions (using SQLite in-memory or test PostgreSQL)
  - Async HTTP client for API tests
  - Auth helpers (user creation, JWT generation)
  - Mock service factories

Run all tests:
    cd /Users/tarunnagpal/Documents/insydr/backend
    python -m pytest app/tests/ -v
"""

import os
import pytest
import pytest_asyncio
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4, UUID
from datetime import datetime, timedelta, timezone

# ─── App Imports ───

from app.core.config import settings
from app.security.auth import (
    create_access_token,
    hash_password,
    generate_otp,
)


# ─── Constants ───

TEST_USER_EMAIL = "test@insydr.ai"
TEST_USER_PASSWORD = "SecurePass123"
TEST_USER_ID = uuid4()
TEST_WORKSPACE_ID = uuid4()
TEST_AGENT_ID = uuid4()


# ─── Mock User ───

def make_mock_user(
    user_id: UUID = None,
    email: str = TEST_USER_EMAIL,
    email_verified: bool = True,
) -> MagicMock:
    """Create a mock User model instance."""
    user = MagicMock()
    user.id = user_id or TEST_USER_ID
    user.email = email
    user.full_name = "Test User"
    user.hashed_password = hash_password(TEST_USER_PASSWORD)
    user.email_verified = email_verified
    user.is_active = True
    user.created_at = datetime.now(timezone.utc)
    return user


# ─── Mock Workspace ───

def make_mock_workspace(
    workspace_id: UUID = None,
    owner_id: UUID = None,
    tier: str = "FREE",
) -> MagicMock:
    """Create a mock Workspace model instance."""
    ws = MagicMock()
    ws.id = workspace_id or TEST_WORKSPACE_ID
    ws.owner_id = owner_id or TEST_USER_ID
    ws.name = "Test Workspace"
    ws.subscription_tier = tier
    ws.created_at = datetime.now(timezone.utc)
    return ws


# ─── Mock Agent ───

def make_mock_agent(
    agent_id: UUID = None,
    workspace_id: UUID = None,
    agent_type: str = "custom",
) -> MagicMock:
    """Create a mock Agent model instance."""
    agent = MagicMock()
    agent.id = agent_id or TEST_AGENT_ID
    agent.workspace_id = workspace_id or TEST_WORKSPACE_ID
    agent.name = "Test Agent"
    agent.description = "A test agent"
    agent.agent_type = agent_type
    agent.status = "active"
    agent.is_active = True
    agent.version = "1.0.0"
    agent.configuration = {"knowledge_sources": []}
    agent.behavior_settings = {"tone": "friendly", "response_style": "conversational", "temperature": 0.5}
    agent.response_config = {}
    agent.conversation_rules = {}
    agent.allowed_domains = []
    agent.greeting_message = "Hello! How can I help?"
    agent.fallback_message = "I'm sorry, I couldn't help with that."
    agent.avatar_url = None
    agent.avatar_public_id = None
    agent.created_at = datetime.now(timezone.utc)
    agent.updated_at = datetime.now(timezone.utc)
    return agent


# ─── Auth Token Helpers ───

def make_auth_token(user_id: UUID = None, expired: bool = False) -> str:
    """Generate a JWT token for testing."""
    uid = user_id or TEST_USER_ID
    if expired:
        delta = timedelta(hours=-1)
    else:
        delta = timedelta(hours=24)
    return create_access_token({"sub": str(uid)}, expires_delta=delta)


def make_auth_headers(user_id: UUID = None) -> dict:
    """Generate Authorization headers for testing."""
    token = make_auth_token(user_id)
    return {"Authorization": f"Bearer {token}"}


# ─── Mock DB Session ───

@pytest.fixture
def mock_db():
    """Create a mock async database session."""
    session = AsyncMock()
    session.execute = AsyncMock()
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.close = AsyncMock()
    session.flush = AsyncMock()
    session.add = MagicMock()
    return session
