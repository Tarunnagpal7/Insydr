"""
Centralized plan limits and feature gate enforcement for Insydr.AI.

All plan-based limits are defined here. Services import and use these
to enforce usage caps based on workspace subscription_tier.
"""

from uuid import UUID
from datetime import datetime
from typing import Dict, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.workspace import Workspace
from app.db.models.agent import Agent
from app.db.models.document import Document
from app.db.models.document_chunk import DocumentChunk
from app.db.models.message import Message


# ═══════════════════════════════════════════════════
#  PLAN LIMITS — Single source of truth
# ═══════════════════════════════════════════════════

PLAN_LIMITS: Dict[str, Dict[str, Any]] = {
    "FREE": {
        "agents": 1,
        "messages_per_month": 100,
        "documents": 3,
        "web_pages": 10,
        "storage_mb": 10,
        "max_file_size_mb": 2,
        "workspaces": 1,
        # Feature flags
        "remove_branding": False,
        "custom_branding": False,
        "advanced_analytics": False,
        "lead_generation": False,
        "api_access": False,
        "webhooks": False,
        "multi_model": False,
        "rbac": False,
        "sso": False,
    },
    "STARTER": {
        "agents": 2,
        "messages_per_month": 2000,
        "documents": 25,
        "web_pages": 50,
        "storage_mb": 100,
        "max_file_size_mb": 5,
        "workspaces": 1,
        "remove_branding": True,
        "custom_branding": True,
        "advanced_analytics": False,
        "lead_generation": False,
        "api_access": False,
        "webhooks": False,
        "multi_model": False,
        "rbac": False,
        "sso": False,
    },
    "GROWTH": {
        "agents": 5,
        "messages_per_month": 10000,
        "documents": -1,  # unlimited (fair use)
        "web_pages": 500,
        "storage_mb": 500,
        "max_file_size_mb": 10,
        "workspaces": 3,
        "remove_branding": True,
        "custom_branding": True,
        "advanced_analytics": True,
        "lead_generation": True,
        "api_access": True,
        "webhooks": True,
        "multi_model": False,
        "rbac": False,
        "sso": False,
    },
    "PRO": {
        "agents": -1,  # unlimited
        "messages_per_month": 30000,
        "documents": -1,
        "web_pages": -1,
        "storage_mb": 2048,
        "max_file_size_mb": 10,
        "workspaces": 10,
        "remove_branding": True,
        "custom_branding": True,
        "advanced_analytics": True,
        "lead_generation": True,
        "api_access": True,
        "webhooks": True,
        "multi_model": True,
        "rbac": True,
        "sso": False,
    },
    "ENTERPRISE": {
        "agents": -1,
        "messages_per_month": -1,
        "documents": -1,
        "web_pages": -1,
        "storage_mb": -1,
        "max_file_size_mb": 50,
        "workspaces": -1,
        "remove_branding": True,
        "custom_branding": True,
        "advanced_analytics": True,
        "lead_generation": True,
        "api_access": True,
        "webhooks": True,
        "multi_model": True,
        "rbac": True,
        "sso": True,
    },
}

# Backward compat alias
PLAN_LIMITS["BUSINESS"] = PLAN_LIMITS["PRO"]


def get_limits(tier: str) -> Dict[str, Any]:
    """Get the limits dict for a subscription tier."""
    return PLAN_LIMITS.get(tier.upper(), PLAN_LIMITS["FREE"])


def get_tier_name(tier: str) -> str:
    """Get a display-friendly tier name."""
    names = {
        "FREE": "Free", "STARTER": "Starter", "GROWTH": "Growth",
        "PRO": "Pro", "ENTERPRISE": "Enterprise", "BUSINESS": "Pro",
    }
    return names.get(tier.upper(), "Free")


# ═══════════════════════════════════════════════════
#  LIMIT CHECK FUNCTIONS
# ═══════════════════════════════════════════════════

class PlanLimitExceeded(Exception):
    """Raised when a plan limit is exceeded."""
    def __init__(self, message: str, tier: str, limit_type: str):
        self.message = message
        self.tier = tier
        self.limit_type = limit_type
        super().__init__(self.message)


class FeatureNotAvailable(Exception):
    """Raised when a feature is not available on the current plan."""
    def __init__(self, message: str, tier: str, feature: str):
        self.message = message
        self.tier = tier
        self.feature = feature
        super().__init__(self.message)


async def get_workspace_tier(session: AsyncSession, workspace_id: UUID) -> str:
    """Get the subscription tier for a workspace."""
    stmt = select(Workspace.subscription_tier).where(Workspace.id == workspace_id)
    result = await session.execute(stmt)
    tier = result.scalar()
    return (tier or "FREE").upper()


async def check_agent_limit(session: AsyncSession, workspace_id: UUID):
    """Check if workspace can create another agent."""
    tier = await get_workspace_tier(session, workspace_id)
    limits = get_limits(tier)
    max_agents = limits["agents"]

    if max_agents == -1:
        return  # unlimited

    count = await session.execute(
        select(func.count(Agent.id)).where(Agent.workspace_id == workspace_id)
    )
    current = count.scalar() or 0

    if current >= max_agents:
        raise PlanLimitExceeded(
            f"Agent limit reached ({current}/{max_agents}). Upgrade from {get_tier_name(tier)} to add more agents.",
            tier, "agents"
        )


async def check_document_limit(session: AsyncSession, workspace_id: UUID):
    """Check if workspace can upload another document."""
    tier = await get_workspace_tier(session, workspace_id)
    limits = get_limits(tier)
    max_docs = limits["documents"]

    if max_docs == -1:
        return  # unlimited

    count = await session.execute(
        select(func.count(Document.id)).where(
            Document.workspace_id == workspace_id,
            Document.source_type != "web",
        )
    )
    current = count.scalar() or 0

    if current >= max_docs:
        raise PlanLimitExceeded(
            f"Document limit reached ({current}/{max_docs}). Upgrade from {get_tier_name(tier)} to add more documents.",
            tier, "documents"
        )


async def check_web_page_limit(session: AsyncSession, workspace_id: UUID, pages_to_add: int = 1):
    """Check if workspace can crawl more web pages."""
    tier = await get_workspace_tier(session, workspace_id)
    limits = get_limits(tier)
    max_pages = limits["web_pages"]

    if max_pages == -1:
        return max_pages  # unlimited, return -1 so crawler knows

    count = await session.execute(
        select(func.count(Document.id)).where(
            Document.workspace_id == workspace_id,
            Document.source_type == "web",
        )
    )
    current = count.scalar() or 0

    if current + pages_to_add > max_pages:
        remaining = max(0, max_pages - current)
        raise PlanLimitExceeded(
            f"Web page limit reached ({current}/{max_pages}). You can crawl {remaining} more pages. Upgrade from {get_tier_name(tier)} for more.",
            tier, "web_pages"
        )

    return max_pages - current  # Return remaining allowance


async def check_message_limit(session: AsyncSession, workspace_id: UUID):
    """Check if workspace has messages remaining this month."""
    tier = await get_workspace_tier(session, workspace_id)
    limits = get_limits(tier)
    max_msgs = limits["messages_per_month"]

    if max_msgs == -1:
        return  # unlimited

    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    count = await session.execute(
        select(func.count(Message.id)).where(
            Message.workspace_id == workspace_id,
            Message.created_at >= month_start,
        )
    )
    current = count.scalar() or 0

    if current >= max_msgs:
        raise PlanLimitExceeded(
            f"Monthly message limit reached ({current}/{max_msgs}). Upgrade from {get_tier_name(tier)} for more messages.",
            tier, "messages"
        )


async def check_storage_limit(session: AsyncSession, workspace_id: UUID, file_size_bytes: int = 0):
    """Check if workspace has storage remaining."""
    tier = await get_workspace_tier(session, workspace_id)
    limits = get_limits(tier)
    max_storage_mb = limits["storage_mb"]
    max_file_mb = limits["max_file_size_mb"]

    # Check individual file size
    file_size_mb = file_size_bytes / (1024 * 1024)
    if file_size_mb > max_file_mb:
        raise PlanLimitExceeded(
            f"File too large ({file_size_mb:.1f}MB). {get_tier_name(tier)} plan allows max {max_file_mb}MB per file.",
            tier, "file_size"
        )

    if max_storage_mb == -1:
        return  # unlimited storage

    # Estimate current storage (chunk count * ~2KB avg)
    chunk_count = await session.execute(
        select(func.count(DocumentChunk.id))
        .join(Document, DocumentChunk.document_id == Document.id)
        .where(Document.workspace_id == workspace_id)
    )
    chunks = chunk_count.scalar() or 0
    current_mb = (chunks * 2) / 1024

    if current_mb + file_size_mb > max_storage_mb:
        raise PlanLimitExceeded(
            f"Storage limit reached ({current_mb:.0f}MB / {max_storage_mb}MB). Upgrade from {get_tier_name(tier)} for more storage.",
            tier, "storage"
        )


async def check_workspace_limit(session: AsyncSession, user_id: UUID):
    """Check if user can create another workspace."""
    # Get all workspaces owned by this user
    from app.db.models.workspace import Workspace

    stmt = select(Workspace).where(Workspace.owner_id == user_id)
    result = await session.execute(stmt)
    workspaces = result.scalars().all()

    if not workspaces:
        return  # First workspace, always allowed

    # Use the highest tier among all owned workspaces
    highest_limit = 1
    highest_tier = "FREE"
    for ws in workspaces:
        tier = (ws.subscription_tier or "FREE").upper()
        limit = get_limits(tier)["workspaces"]
        if limit == -1:
            return  # unlimited
        if limit > highest_limit:
            highest_limit = limit
            highest_tier = tier

    if len(workspaces) >= highest_limit:
        raise PlanLimitExceeded(
            f"Workspace limit reached ({len(workspaces)}/{highest_limit}). Upgrade from {get_tier_name(highest_tier)} to create more workspaces.",
            highest_tier, "workspaces"
        )


def check_feature(tier: str, feature: str):
    """Check if a feature is available on the given tier."""
    limits = get_limits(tier)
    if not limits.get(feature, False):
        raise FeatureNotAvailable(
            f"'{feature.replace('_', ' ').title()}' is not available on the {get_tier_name(tier)} plan. Please upgrade.",
            tier, feature
        )
