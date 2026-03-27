"""
Agent Engine
============
Public API for the agent execution engine.

Usage::

    from app.agents import AgentRuntime, build_execution_request
    from app.agents.schemas import ExecutionRequest

    runtime = AgentRuntime(db_session)
    result = await runtime.execute(request)
"""

from app.agents.runtime import AgentRuntime
from app.agents.context import build_execution_request
from app.agents.schemas import (
    AgentType,
    ExecutionRequest,
    ExecutionResult,
    ExecutionStatus,
)

__all__ = [
    "AgentRuntime",
    "build_execution_request",
    "AgentType",
    "ExecutionRequest",
    "ExecutionResult",
    "ExecutionStatus",
]
