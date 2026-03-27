"""
Base Prompt Builder
===================
Constructs the system prompt for an agent based on its type, tone,
response style, and custom configuration.

This is a thin wrapper around app.core.agent_templates.build_system_prompt,
providing the agents engine with a consistent interface and adding
history-aware prompt construction.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from app.core.agent_templates import build_system_prompt, AGENT_TYPES
from app.agents.schemas import ChatMessage, MessageRole

logger = logging.getLogger(__name__)


def build_prompt(
    *,
    question: str,
    context_chunks: List[str],
    agent_type: str = "custom",
    agent_name: str = "Assistant",
    behavior_settings: Optional[Dict[str, Any]] = None,
    custom_prompt: str = "",
    response_config: Optional[Dict[str, Any]] = None,
    conversation_rules: Optional[Dict[str, Any]] = None,
    history: Optional[List[ChatMessage]] = None,
) -> tuple[str, float]:
    """
    Build the full prompt for the LLM, including system instructions,
    context, conversation history, and the current question.

    Returns:
        (prompt_str, temperature)
    """
    behavior = behavior_settings or {}
    tone = behavior.get("tone", "friendly")
    response_style = behavior.get("response_style", "conversational")
    temperature = behavior.get("temperature", 0.5)

    # Clamp temperature
    try:
        temperature = float(temperature)
        temperature = max(0.0, min(1.0, temperature))
    except (ValueError, TypeError):
        temperature = 0.5

    # Build system prompt via the template engine
    system_prompt = build_system_prompt(
        agent_type=agent_type,
        tone=tone,
        response_style=response_style,
        custom_prompt=custom_prompt,
        response_config=response_config or {},
        conversation_rules=conversation_rules or {},
    )

    # Context section
    if context_chunks:
        context_str = "\n\n".join(context_chunks)
    else:
        context_str = (
            "No specific knowledge base context available. "
            "Note: the user's question might be out of scope."
        )

    # History section
    history_str = _format_history(history, agent_name) if history else ""

    prompt = f"""{system_prompt}

YOUR NAME: {agent_name}

─── KNOWLEDGE BASE CONTEXT ───
The following information is from the company's knowledge base. Use it to answer accurately.
If the answer is NOT in the context, do not make up facts. Address the user politely.

{context_str}

─── CONVERSATION ───
{history_str}User: {question}

{agent_name}:"""

    return prompt, temperature


def _format_history(
    history: List[ChatMessage],
    agent_name: str,
    max_turns: int = 10,
) -> str:
    """Format recent conversation history into the prompt."""
    if not history:
        return ""

    # Keep only the most recent turns to avoid token bloat
    recent = history[-max_turns * 2:]
    lines = []
    for msg in recent:
        if msg.role == MessageRole.USER:
            lines.append(f"User: {msg.content}")
        elif msg.role == MessageRole.ASSISTANT:
            lines.append(f"{agent_name}: {msg.content}")
    
    if lines:
        return "\n".join(lines) + "\n"
    return ""
