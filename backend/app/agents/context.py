"""
Agent Runtime Context Builder
==============================
Resolves an Agent DB record + request parameters into a fully
populated ExecutionRequest that the runtime can execute.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, List, Optional
from uuid import UUID

from app.agents.schemas import (
    AgentType,
    ChatMessage,
    ExecutionRequest,
    MessageRole,
)

if TYPE_CHECKING:
    from app.db.models.agent import Agent

logger = logging.getLogger(__name__)


def build_execution_request(
    *,
    question: str,
    agent: "Agent",
    conversation_id: Optional[UUID] = None,
    session_id: Optional[str] = None,
    history: Optional[List[dict]] = None,
) -> ExecutionRequest:
    """
    Build a fully-resolved ExecutionRequest from an Agent DB model
    and the incoming user question.

    Args:
        question:        The user's message.
        agent:           The Agent SQLAlchemy model instance.
        conversation_id: Current conversation UUID (if any).
        session_id:      Widget session ID (if any).
        history:         List of prior messages as dicts with 'role' and 'content'.

    Returns:
        ExecutionRequest ready for the runtime.
    """
    # Resolve agent type enum (graceful fallback to CUSTOM)
    try:
        agent_type = AgentType(agent.agent_type)
    except (ValueError, KeyError):
        agent_type = AgentType.CUSTOM

    # Extract document IDs from agent configuration
    document_ids: Optional[List[str]] = None
    config = agent.configuration or {}
    if "knowledge_sources" in config:
        document_ids = config["knowledge_sources"]

    # Extract custom prompt
    custom_prompt = config.get("custom_prompt", "")

    # Build conversation history
    chat_history: List[ChatMessage] = []
    if history:
        for msg in history:
            try:
                role = MessageRole(msg.get("role", "user"))
            except ValueError:
                role = MessageRole.USER
            chat_history.append(
                ChatMessage(role=role, content=msg.get("content", ""))
            )

    return ExecutionRequest(
        question=question,
        workspace_id=agent.workspace_id,
        agent_id=agent.id,
        conversation_id=conversation_id,
        session_id=session_id,
        agent_type=agent_type,
        agent_name=agent.name or "Assistant",
        behavior_settings=agent.behavior_settings or {},
        custom_prompt=custom_prompt,
        response_config=agent.response_config or {},
        conversation_rules=agent.conversation_rules or {},
        document_ids=document_ids,
        history=chat_history,
    )
