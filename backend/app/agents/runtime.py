"""
Agent Execution Runtime
========================
Orchestrates the full agent execution pipeline:

  1. Safety check on user input
  2. RAG retrieval + LLM generation
  3. Grounding check on the response
  4. Fallback decision
  5. Result assembly

This module ties together the RAG pipeline (app.rag.graph),
policies (safety, grounding, fallback), and the prompt builder
into a single execution flow.
"""

from __future__ import annotations

import logging
import time
from typing import AsyncIterator, Dict, Any, Optional
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.schemas import (
    ExecutionRequest,
    ExecutionResult,
    ExecutionStatus,
)
from app.agents.policies.safety import check_input_safety
from app.agents.policies.grounding import check_grounding
from app.agents.policies.fallback import evaluate_fallback, DEFAULT_FALLBACK_MESSAGE
from app.rag.graph import RAGGraph

logger = logging.getLogger(__name__)


class AgentRuntime:
    """
    High-level agent execution runtime.

    Usage::

        runtime = AgentRuntime(db_session)
        result = await runtime.execute(request)
        # or for streaming:
        async for chunk in runtime.execute_stream(request):
            ...
    """

    def __init__(self, session: AsyncSession):
        self.session = session
        self.rag = RAGGraph(session)

    async def execute(self, request: ExecutionRequest) -> ExecutionResult:
        """
        Execute a full agent pipeline (non-streaming).

        Steps:
          1. Safety check on user input
          2. RAG process_message (retrieve + generate)
          3. Grounding check on the response
          4. Fallback evaluation
        """
        start_time = time.time()

        # ── 1. Safety Check ──
        blocked_terms = (request.conversation_rules or {}).get("blocked_words", [])
        safety_result = check_input_safety(
            request.question,
            blocked_terms=blocked_terms,
        )

        fallback_msg = self._get_fallback_message(request)

        if not safety_result.is_safe:
            # Input is unsafe — return fallback without calling LLM
            fallback = evaluate_fallback(
                safety_result=safety_result,
                custom_fallback_message=fallback_msg,
            )
            return ExecutionResult(
                status=ExecutionStatus.COMPLETED,
                response=fallback.fallback_message or fallback_msg,
                confidence=0.0,
                response_time_ms=self._elapsed_ms(start_time),
                is_fallback=True,
                metadata={"fallback_reason": fallback.reason},
            )

        # ── 2. RAG Execution ──
        llm_error = None
        response_text = ""
        try:
            response_text = await self.rag.process_message(
                question=request.question,
                workspace_id=request.workspace_id,
                agent_id=str(request.agent_id),
                conversation_id=request.conversation_id,
                document_ids=request.document_ids,
                agent_type=request.agent_type.value,
                behavior_settings=request.behavior_settings,
                custom_prompt=request.custom_prompt,
                agent_name=request.agent_name,
                response_config=request.response_config,
                conversation_rules=request.conversation_rules,
            )
        except Exception as e:
            logger.error(f"RAG execution failed: {e}")
            llm_error = str(e)

        # ── 3. Grounding Check ──
        # For non-streaming, we don't have direct access to context chunks
        # and avg_similarity from the RAG graph.  We use a secondary retrieval
        # to compute confidence (same pattern as widget.py).
        grounding_result = None
        confidence = 0.0
        if not llm_error and response_text:
            try:
                from app.rag.retriever import Retriever
                retriever = Retriever(self.session)
                _, _, avg_sim = await retriever.retrieve_with_sources(
                    request.question, request.workspace_id
                )
                confidence = round(avg_sim, 4)

                threshold = float(
                    (request.response_config or {}).get("confidence_threshold", 0.15)
                )
                grounding_result = check_grounding(
                    response=response_text,
                    context_chunks=[],  # simplified — we rely on avg_sim
                    avg_similarity=avg_sim,
                    confidence_threshold=threshold,
                )
            except Exception as e:
                logger.warning(f"Grounding check failed: {e}")

        # ── 4. Fallback Decision ──
        fallback = evaluate_fallback(
            safety_result=safety_result,
            grounding_result=grounding_result,
            llm_error=llm_error,
            custom_fallback_message=fallback_msg,
        )

        if fallback.should_fallback:
            return ExecutionResult(
                status=ExecutionStatus.COMPLETED,
                response=fallback.fallback_message or fallback_msg,
                confidence=confidence,
                response_time_ms=self._elapsed_ms(start_time),
                is_fallback=True,
                metadata={"fallback_reason": fallback.reason},
            )

        return ExecutionResult(
            status=ExecutionStatus.COMPLETED,
            response=response_text,
            confidence=confidence,
            response_time_ms=self._elapsed_ms(start_time),
            is_fallback=False,
        )

    async def execute_stream(
        self, request: ExecutionRequest
    ) -> AsyncIterator[Dict[str, Any]]:
        """
        Execute the agent pipeline with streaming output.

        Yields dicts with:
          - {"token": "..."}     — streamed text chunks
          - {"sources": [...]}   — source citations after response
          - {"done": True, "confidence": ..., "is_fallback": ..., "full_response": ...}
        """
        start_time = time.time()

        # ── 1. Safety Check ──
        blocked_terms = (request.conversation_rules or {}).get("blocked_words", [])
        safety_result = check_input_safety(
            request.question,
            blocked_terms=blocked_terms,
        )

        fallback_msg = self._get_fallback_message(request)

        if not safety_result.is_safe:
            fallback = evaluate_fallback(
                safety_result=safety_result,
                custom_fallback_message=fallback_msg,
            )
            msg = fallback.fallback_message or fallback_msg
            yield {"token": msg}
            yield {
                "done": True,
                "full_response": msg,
                "confidence": 0.0,
                "is_fallback": True,
            }
            return

        # ── 2. RAG Streaming ──
        full_response = ""
        retrieval_confidence = 0.0
        sources = []

        try:
            async for chunk in self.rag.process_message_stream(
                question=request.question,
                workspace_id=request.workspace_id,
                agent_id=str(request.agent_id),
                conversation_id=request.conversation_id,
                document_ids=request.document_ids,
                agent_type=request.agent_type.value,
                behavior_settings=request.behavior_settings,
                custom_prompt=request.custom_prompt,
                agent_name=request.agent_name,
                response_config=request.response_config,
                conversation_rules=request.conversation_rules,
            ):
                if "token" in chunk:
                    yield {"token": chunk["token"]}
                elif "sources" in chunk:
                    sources = chunk["sources"]
                    yield {"sources": sources}
                elif "done" in chunk:
                    full_response = chunk.get("full_response", "")
                    retrieval_confidence = chunk.get("confidence", 0.0)

        except Exception as e:
            logger.error(f"Streaming RAG error: {e}")
            yield {"token": fallback_msg}
            yield {
                "done": True,
                "full_response": fallback_msg,
                "confidence": 0.0,
                "is_fallback": True,
            }
            return

        yield {
            "done": True,
            "full_response": full_response,
            "confidence": retrieval_confidence,
            "is_fallback": False,
        }

    # ─── Helpers ───

    def _get_fallback_message(self, request: ExecutionRequest) -> str:
        """Get the agent's custom fallback message, or the default."""
        rc = request.response_config or {}
        return rc.get("fallback_message", DEFAULT_FALLBACK_MESSAGE)

    @staticmethod
    def _elapsed_ms(start: float) -> int:
        return int((time.time() - start) * 1000)
