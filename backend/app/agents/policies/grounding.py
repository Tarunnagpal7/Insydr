"""
Grounding Policy
================
Checks that the LLM response is grounded in the retrieved context.

A grounded response is one whose key claims can be traced back to the
knowledge-base chunks that were retrieved.  Ungrounded responses may
indicate hallucination.
"""

from __future__ import annotations

import logging
from typing import List

from app.agents.schemas import GroundingCheckResult

logger = logging.getLogger(__name__)

# Default confidence threshold — below this, the response is considered ungrounded
DEFAULT_CONFIDENCE_THRESHOLD = 0.15

# Phrases that typically indicate the LLM is guessing / doesn't know
LOW_CONFIDENCE_PHRASES = [
    "i don't have",
    "i'm not sure",
    "i cannot find",
    "i don't know",
    "no information available",
    "not in my knowledge",
    "i couldn't find",
    "outside my knowledge",
    "i do not have",
    "unable to find",
]


def check_grounding(
    response: str,
    context_chunks: List[str],
    avg_similarity: float,
    confidence_threshold: float = DEFAULT_CONFIDENCE_THRESHOLD,
) -> GroundingCheckResult:
    """
    Evaluate whether the LLM response is grounded in the retrieved context.

    Strategy:
      1. Check retrieval confidence (avg_similarity from vector search)
      2. Check if context was empty
      3. Check for low-confidence phrases in the response

    Args:
        response:             The LLM-generated text.
        context_chunks:       Retrieved knowledge-base chunks.
        avg_similarity:       Average cosine similarity from retrieval.
        confidence_threshold: Minimum similarity to consider grounded.

    Returns:
        GroundingCheckResult
    """
    # No context at all → not grounded
    if not context_chunks:
        return GroundingCheckResult(
            is_grounded=False,
            confidence=0.0,
            reason="No context chunks were retrieved",
        )

    # Low retrieval confidence
    if avg_similarity < confidence_threshold:
        return GroundingCheckResult(
            is_grounded=False,
            confidence=avg_similarity,
            reason=f"Retrieval confidence ({avg_similarity:.3f}) below threshold ({confidence_threshold})",
        )

    # Check for low-confidence phrases in the response
    response_lower = response.lower()
    for phrase in LOW_CONFIDENCE_PHRASES:
        if phrase in response_lower:
            return GroundingCheckResult(
                is_grounded=False,
                confidence=avg_similarity,
                reason=f"Response contains low-confidence phrase: '{phrase}'",
            )

    return GroundingCheckResult(
        is_grounded=True,
        confidence=avg_similarity,
    )


def compute_grounding_score(
    response: str,
    context_chunks: List[str],
) -> float:
    """
    Heuristic overlap score: what fraction of the response's key terms
    appear in the retrieved context.

    Returns a float in [0.0, 1.0].
    """
    if not response or not context_chunks:
        return 0.0

    # Build a set of significant words from the context
    context_text = " ".join(context_chunks).lower()
    context_words = set(context_text.split())

    # Get significant words from the response (4+ chars to skip stop words)
    response_words = [w.lower() for w in response.split() if len(w) >= 4]
    if not response_words:
        return 0.0

    overlap = sum(1 for w in response_words if w in context_words)
    return min(1.0, overlap / len(response_words))
