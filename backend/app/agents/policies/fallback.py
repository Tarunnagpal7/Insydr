"""
Fallback Policy
===============
Determines when and how the agent should fall back to a default response
instead of using the LLM output.

Triggers:
  • Empty or failed retrieval
  • Low confidence score
  • Safety or grounding policy failures
  • LLM errors
"""

from __future__ import annotations

import logging
from typing import Optional

from app.agents.schemas import (
    FallbackDecision,
    GroundingCheckResult,
    SafetyCheckResult,
)

logger = logging.getLogger(__name__)

DEFAULT_FALLBACK_MESSAGE = (
    "I'm sorry, I don't have enough information to answer that accurately. "
    "Could you try rephrasing your question or ask about something else?"
)


def evaluate_fallback(
    *,
    safety_result: Optional[SafetyCheckResult] = None,
    grounding_result: Optional[GroundingCheckResult] = None,
    llm_error: Optional[str] = None,
    custom_fallback_message: Optional[str] = None,
) -> FallbackDecision:
    """
    Decide whether the agent should use a fallback response.

    Priority order (first match wins):
      1. Safety violation  → blocked
      2. LLM error         → fallback
      3. Grounding failure  → fallback
      4. Everything OK      → no fallback

    Args:
        safety_result:          Result from the safety policy.
        grounding_result:       Result from the grounding policy.
        llm_error:              Error string from LLM execution.
        custom_fallback_message: Agent's custom fallback message (from DB).

    Returns:
        FallbackDecision
    """
    fallback_msg = custom_fallback_message or DEFAULT_FALLBACK_MESSAGE

    # 1. Safety check failed
    if safety_result and not safety_result.is_safe:
        reason = safety_result.reason or "Safety check failed"
        logger.info(f"Fallback triggered: {reason}")
        return FallbackDecision(
            should_fallback=True,
            fallback_message=_safety_fallback_message(safety_result),
            reason=reason,
        )

    # 2. LLM errored
    if llm_error:
        logger.error(f"Fallback triggered by LLM error: {llm_error}")
        return FallbackDecision(
            should_fallback=True,
            fallback_message=fallback_msg,
            reason=f"LLM error: {llm_error}",
        )

    # 3. Response is not grounded
    if grounding_result and not grounding_result.is_grounded:
        reason = grounding_result.reason or "Response not grounded in context"
        logger.info(f"Fallback triggered: {reason}")
        return FallbackDecision(
            should_fallback=True,
            fallback_message=fallback_msg,
            reason=reason,
        )

    # 4. All good
    return FallbackDecision(should_fallback=False)


def _safety_fallback_message(result: SafetyCheckResult) -> str:
    """Build a user-friendly message for safety violations."""
    if result.blocked_terms:
        return (
            "I'm unable to assist with that particular topic. "
            "Could you please ask about something else?"
        )
    if "too long" in (result.reason or "").lower():
        return (
            "Your message is a bit too long for me to process. "
            "Could you shorten it and try again?"
        )
    if "injection" in (result.reason or "").lower():
        return "I can only help with questions about our knowledge base."
    return DEFAULT_FALLBACK_MESSAGE
