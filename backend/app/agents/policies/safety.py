"""
Safety Policy
=============
Input sanitization and content safety checks for agent execution.

Protects against:
  • Prompt injection attempts
  • Excessive input length
  • Blocked / sensitive terms
"""

from __future__ import annotations

import re
import logging
from typing import List, Optional

from app.agents.schemas import SafetyCheckResult

logger = logging.getLogger(__name__)

# Maximum input length (characters)
MAX_INPUT_LENGTH = 4096

# Patterns that indicate prompt injection attempts
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)",
    r"disregard\s+(all\s+)?(previous|prior|above)",
    r"you\s+are\s+now\s+(?:a|an)\s+(?:new|different)",
    r"new\s+instructions?\s*:",
    r"system\s*:\s*",
    r"<\s*/?(?:system|prompt|instruction)",
    r"forget\s+(?:everything|all|your)",
    r"override\s+(?:your|all|previous)",
]

# Compile patterns for performance
_COMPILED_PATTERNS = [
    re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS
]


def check_input_safety(
    text: str,
    blocked_terms: Optional[List[str]] = None,
    max_length: int = MAX_INPUT_LENGTH,
) -> SafetyCheckResult:
    """
    Run safety checks on user input before sending to the LLM.

    Checks:
      1. Input length
      2. Prompt injection patterns
      3. Custom blocked terms (from agent conversation_rules)

    Returns:
        SafetyCheckResult with is_safe=False if any check fails.
    """
    if not text or not text.strip():
        return SafetyCheckResult(
            is_safe=False,
            reason="Empty input",
        )

    # 1. Length check
    if len(text) > max_length:
        return SafetyCheckResult(
            is_safe=False,
            reason=f"Input too long ({len(text)} chars, max {max_length})",
            sanitized_input=text[:max_length],
        )

    # 2. Prompt injection check
    for pattern in _COMPILED_PATTERNS:
        if pattern.search(text):
            logger.warning(f"Prompt injection attempt detected: {pattern.pattern}")
            return SafetyCheckResult(
                is_safe=False,
                reason="Potential prompt injection detected",
            )

    # 3. Blocked terms
    found_blocked: List[str] = []
    if blocked_terms:
        text_lower = text.lower()
        for term in blocked_terms:
            if term.lower() in text_lower:
                found_blocked.append(term)

    if found_blocked:
        return SafetyCheckResult(
            is_safe=False,
            reason="Input contains blocked terms",
            blocked_terms=found_blocked,
        )

    return SafetyCheckResult(is_safe=True, sanitized_input=text.strip())


def sanitize_input(text: str, max_length: int = MAX_INPUT_LENGTH) -> str:
    """
    Basic sanitization: trim whitespace and enforce length limit.
    Does NOT block — just cleans the input.
    """
    text = text.strip()
    if len(text) > max_length:
        text = text[:max_length]
    return text
