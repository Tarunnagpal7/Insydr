"""
Agent Execution Schemas
=======================
Pydantic models for the agent execution pipeline.
Used by the runtime, context builder, and policies.
"""

from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ─── Enums ───

class AgentType(str, Enum):
    SALES_ASSISTANT = "sales_assistant"
    CUSTOMER_SUPPORT = "customer_support"
    HR_ASSISTANT = "hr_assistant"
    TECHNICAL_SUPPORT = "technical_support"
    GENERAL_KNOWLEDGE = "general_knowledge"
    CUSTOM = "custom"


class MessageRole(str, Enum):
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ExecutionStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    RATE_LIMITED = "rate_limited"


# ─── Input / Output Models ───

class ChatMessage(BaseModel):
    """A single message in the conversation."""
    role: MessageRole
    content: str
    timestamp: Optional[str] = None


class ExecutionRequest(BaseModel):
    """Input to the agent runtime."""
    question: str
    workspace_id: UUID
    agent_id: UUID
    conversation_id: Optional[UUID] = None
    session_id: Optional[str] = None
    # Agent configuration (resolved by context builder)
    agent_type: AgentType = AgentType.CUSTOM
    agent_name: str = "Assistant"
    behavior_settings: Dict[str, Any] = Field(default_factory=dict)
    custom_prompt: str = ""
    response_config: Dict[str, Any] = Field(default_factory=dict)
    conversation_rules: Dict[str, Any] = Field(default_factory=dict)
    document_ids: Optional[List[str]] = None
    # Conversation history for context
    history: List[ChatMessage] = Field(default_factory=list)


class ExecutionResult(BaseModel):
    """Output from the agent runtime."""
    status: ExecutionStatus
    response: str
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    confidence: float = 0.0
    response_time_ms: int = 0
    is_fallback: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)


# ─── Policy Models ───

class SafetyCheckResult(BaseModel):
    """Result of a safety policy check on user input."""
    is_safe: bool = True
    reason: Optional[str] = None
    sanitized_input: Optional[str] = None
    blocked_terms: List[str] = Field(default_factory=list)


class GroundingCheckResult(BaseModel):
    """Result of a grounding policy check on the LLM response."""
    is_grounded: bool = True
    confidence: float = 0.0
    reason: Optional[str] = None


class FallbackDecision(BaseModel):
    """Decision from the fallback policy."""
    should_fallback: bool = False
    fallback_message: Optional[str] = None
    reason: Optional[str] = None
