"""
Base Tool Interface
===================
Abstract base class for tools that agents can use.

Tools extend the agent's capabilities beyond RAG-based Q&A:
  • Web search
  • Calculator
  • API calls
  • Custom business logic

This module provides the interface; concrete implementations
are registered in the runtime and invoked when the LLM requests them.
"""

from __future__ import annotations

import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ToolParameter(BaseModel):
    """Schema for a single tool parameter."""
    name: str
    type: str = "string"
    description: str = ""
    required: bool = False
    default: Optional[Any] = None


class ToolDefinition(BaseModel):
    """Definition of a tool that an agent can invoke."""
    name: str
    description: str
    parameters: list[ToolParameter] = Field(default_factory=list)
    requires_confirmation: bool = False


class ToolResult(BaseModel):
    """Result returned by a tool execution."""
    success: bool = True
    output: str = ""
    data: Dict[str, Any] = Field(default_factory=dict)
    error: Optional[str] = None


class BaseTool(ABC):
    """
    Abstract base class for agent tools.

    Subclass this and implement execute() to create a new tool.

    Example::

        class CalculatorTool(BaseTool):
            @property
            def definition(self) -> ToolDefinition:
                return ToolDefinition(
                    name="calculator",
                    description="Evaluate a math expression",
                    parameters=[
                        ToolParameter(name="expression", type="string", required=True),
                    ],
                )

            async def execute(self, **kwargs) -> ToolResult:
                expr = kwargs.get("expression", "")
                try:
                    result = eval(expr)  # simplified — use a safe evaluator in production
                    return ToolResult(output=str(result))
                except Exception as e:
                    return ToolResult(success=False, error=str(e))
    """

    @property
    @abstractmethod
    def definition(self) -> ToolDefinition:
        """Return the tool's metadata for registration with the runtime."""
        ...

    @abstractmethod
    async def execute(self, **kwargs: Any) -> ToolResult:
        """
        Execute the tool with the given parameters.

        Returns:
            ToolResult with output on success, or error on failure.
        """
        ...

    @property
    def name(self) -> str:
        return self.definition.name


class ToolRegistry:
    """
    Registry of available tools for an agent runtime.

    Usage::

        registry = ToolRegistry()
        registry.register(CalculatorTool())
        result = await registry.invoke("calculator", expression="2+2")
    """

    def __init__(self):
        self._tools: Dict[str, BaseTool] = {}

    def register(self, tool: BaseTool) -> None:
        """Register a tool instance."""
        self._tools[tool.name] = tool
        logger.debug(f"Registered tool: {tool.name}")

    def get(self, name: str) -> Optional[BaseTool]:
        """Get a tool by name."""
        return self._tools.get(name)

    def list_definitions(self) -> list[ToolDefinition]:
        """List all registered tool definitions."""
        return [t.definition for t in self._tools.values()]

    async def invoke(self, name: str, **kwargs: Any) -> ToolResult:
        """
        Invoke a tool by name.

        Returns ToolResult.success=False if the tool is not found.
        """
        tool = self._tools.get(name)
        if not tool:
            return ToolResult(success=False, error=f"Unknown tool: {name}")

        try:
            return await tool.execute(**kwargs)
        except Exception as e:
            logger.error(f"Tool '{name}' failed: {e}")
            return ToolResult(success=False, error=str(e))
