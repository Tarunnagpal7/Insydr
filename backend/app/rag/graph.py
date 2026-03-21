from typing import Annotated, TypedDict, List, Optional, Dict, Any
from uuid import UUID

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from app.services.llm_service import LLMService
from app.rag.retriever import Retriever
from app.core.agent_templates import build_system_prompt

# Define State
# Confidence threshold: below this, a query is considered "unanswered"
LOW_CONFIDENCE_THRESHOLD = 0.15

class GraphState(TypedDict):
    messages: List[BaseMessage]
    context: List[str]
    sources: List[Dict[str, Any]]  # Source citation metadata
    question: str
    workspace_id: UUID
    agent_id: Optional[str]
    conversation_id: Optional[UUID]
    document_ids: Optional[List[str]]
    # Agent behavior config passed through state
    agent_type: Optional[str]
    behavior_settings: Optional[Dict[str, Any]]
    custom_prompt: Optional[str]
    agent_name: Optional[str]
    # Response config and conversation rules
    response_config: Optional[Dict[str, Any]]
    conversation_rules: Optional[Dict[str, Any]]
    # Retrieval quality metric
    avg_similarity: float

async def retrieve_node(state: GraphState, retriever: Retriever):
    """
    Retrieve relevant documents based on the question.
    Uses retrieve_with_sources to get citation metadata and avg similarity.
    """
    try:
        question = state["question"]
        workspace_id = state["workspace_id"]
        agent_id = state.get("agent_id")
        
        document_ids = None

        if "document_ids" in state:
            document_ids = state["document_ids"]

        context, sources, avg_similarity = await retriever.retrieve_with_sources(
            question, workspace_id, document_ids=document_ids
        )
        return {"context": context, "sources": sources, "avg_similarity": avg_similarity}
    except Exception as e:
        print(f"Error in retrieve_node: {e}")
        import traceback
        traceback.print_exc()
        raise e


def _build_rag_prompt(state: GraphState) -> tuple:
    """Build the RAG prompt from state. Returns (prompt_str, temperature)."""
    question = state["question"]
    context = state["context"]
    
    # ── Extract agent behavior config ──
    agent_type = state.get("agent_type", "custom") or "custom"
    behavior = state.get("behavior_settings") or {}
    custom_prompt = state.get("custom_prompt", "") or ""
    agent_name = state.get("agent_name", "Assistant") or "Assistant"
    response_config = state.get("response_config") or {}
    conversation_rules = state.get("conversation_rules") or {}
    
    tone = behavior.get("tone", "friendly")
    response_style = behavior.get("response_style", "conversational")
    temperature = behavior.get("temperature", 0.5)
    
    # Ensure temperature is a valid float
    try:
        temperature = float(temperature)
        temperature = max(0.0, min(1.0, temperature))
    except (ValueError, TypeError):
        temperature = 0.5
    
    # ── Build system prompt ──
    system_prompt = build_system_prompt(
        agent_type=agent_type,
        tone=tone,
        response_style=response_style,
        custom_prompt=custom_prompt,
        response_config=response_config,
        conversation_rules=conversation_rules,
    )
    
    # ── Construct the full prompt with context ──
    context_str = "\n\n".join(context) if context else "No specific knowledge base context available. Note: the user's question might be out of scope."
    
    prompt = f"""{system_prompt}

YOUR NAME: {agent_name}

─── KNOWLEDGE BASE CONTEXT ───
The following information is from the company's knowledge base. Use it to answer accurately.
If the answer is NOT in the context, do not make up facts. Address the user politely.

{context_str}

─── CONVERSATION ───
User: {question}

{agent_name}:"""
    
    return prompt, temperature


async def generate_node(state: GraphState, llm_service: LLMService):
    """
    Generate answer using RAG with dynamic system prompt based on agent config.
    """
    prompt, temperature = _build_rag_prompt(state)
    response = await llm_service.generate(prompt, temperature=temperature)
    return {"messages": [AIMessage(content=response)]}


class RAGGraph:
    def __init__(self, session):
        self.session = session
        self.retriever = Retriever(session)
        self.llm_service = LLMService()
        self.workflow = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(GraphState)
        
        async def call_retrieve(state):
            return await retrieve_node(state, self.retriever)
            
        async def call_generate(state):
            return await generate_node(state, self.llm_service)

        workflow.add_node("retrieve", call_retrieve)
        workflow.add_node("generate", call_generate)
        
        # Add Edges
        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)
        
        return workflow.compile()

    def _build_initial_state(
        self,
        question: str,
        workspace_id: UUID,
        agent_id: Optional[str] = None,
        conversation_id: Optional[UUID] = None,
        document_ids: Optional[List[str]] = None,
        agent_type: str = "custom",
        behavior_settings: Optional[Dict[str, Any]] = None,
        custom_prompt: str = "",
        agent_name: str = "Assistant",
        response_config: Optional[Dict[str, Any]] = None,
        conversation_rules: Optional[Dict[str, Any]] = None,
    ) -> GraphState:
        return {
            "messages": [HumanMessage(content=question)],
            "question": question,
            "workspace_id": workspace_id,
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "document_ids": document_ids,
            "context": [],
            "sources": [],
            # Agent behavior
            "agent_type": agent_type,
            "behavior_settings": behavior_settings or {},
            "custom_prompt": custom_prompt,
            "agent_name": agent_name,
            # Response config and guardrails
            "response_config": response_config or {},
            "conversation_rules": conversation_rules or {},
            # Retrieval quality metric
            "avg_similarity": 0.0,
        }

    async def process_message(
        self, 
        question: str, 
        workspace_id: UUID, 
        agent_id: Optional[str] = None, 
        conversation_id: Optional[UUID] = None,
        document_ids: Optional[List[str]] = None,
        agent_type: str = "custom",
        behavior_settings: Optional[Dict[str, Any]] = None,
        custom_prompt: str = "",
        agent_name: str = "Assistant",
        response_config: Optional[Dict[str, Any]] = None,
        conversation_rules: Optional[Dict[str, Any]] = None,
    ):
        initial_state = self._build_initial_state(
            question=question,
            workspace_id=workspace_id,
            agent_id=agent_id,
            conversation_id=conversation_id,
            document_ids=document_ids,
            agent_type=agent_type,
            behavior_settings=behavior_settings,
            custom_prompt=custom_prompt,
            agent_name=agent_name,
            response_config=response_config,
            conversation_rules=conversation_rules,
        )
        
        result = await self.workflow.ainvoke(initial_state)
        
        avg_sim = result.get("avg_similarity", 0.0)
        is_low_confidence = not result.get("context") or avg_sim < LOW_CONFIDENCE_THRESHOLD
        
        if is_low_confidence:
            try:
                from app.db.repositories.analytics_repo import AnalyticsRepository
                analytics_repo = AnalyticsRepository(self.session)
                agent_uuid = UUID(agent_id) if agent_id else None
                await analytics_repo.track_unanswered_question(
                    workspace_id=workspace_id,
                    question=question,
                    agent_id=agent_uuid,
                    conversation_id=conversation_id
                )
            except Exception as e:
                print(f"Failed to track unanswered question: {e}")
                
        return result["messages"][-1].content

    async def process_message_stream(
        self,
        question: str,
        workspace_id: UUID,
        agent_id: Optional[str] = None,
        conversation_id: Optional[UUID] = None,
        document_ids: Optional[List[str]] = None,
        agent_type: str = "custom",
        behavior_settings: Optional[Dict[str, Any]] = None,
        custom_prompt: str = "",
        agent_name: str = "Assistant",
        response_config: Optional[Dict[str, Any]] = None,
        conversation_rules: Optional[Dict[str, Any]] = None,
    ):
        """
        Stream the LLM response token-by-token.
        
        1. Runs retrieval (non-streamed — fast)
        2. Builds prompt
        3. Streams generation via LLM
        
        Yields: dict with either {"token": "..."} or {"sources": [...]} or {"done": True}
        """
        initial_state = self._build_initial_state(
            question=question,
            workspace_id=workspace_id,
            agent_id=agent_id,
            conversation_id=conversation_id,
            document_ids=document_ids,
            agent_type=agent_type,
            behavior_settings=behavior_settings,
            custom_prompt=custom_prompt,
            agent_name=agent_name,
            response_config=response_config,
            conversation_rules=conversation_rules,
        )

        # Step 1: Retrieve (non-streaming)
        retrieve_result = await retrieve_node(initial_state, self.retriever)
        initial_state["context"] = retrieve_result["context"]
        initial_state["sources"] = retrieve_result.get("sources", [])
        avg_similarity = retrieve_result.get("avg_similarity", 0.0)
        initial_state["avg_similarity"] = avg_similarity

        # Track unanswered if no context OR low confidence
        is_low_confidence = not initial_state["context"] or avg_similarity < LOW_CONFIDENCE_THRESHOLD
        if is_low_confidence:
            try:
                from app.db.repositories.analytics_repo import AnalyticsRepository
                analytics_repo = AnalyticsRepository(self.session)
                agent_uuid = UUID(agent_id) if agent_id else None
                await analytics_repo.track_unanswered_question(
                    workspace_id=workspace_id,
                    question=question,
                    agent_id=agent_uuid,
                    conversation_id=conversation_id,
                )
            except Exception as e:
                print(f"Failed to track unanswered question: {e}")

        # Step 2: Build prompt
        prompt, temperature = _build_rag_prompt(initial_state)

        # Step 3: Stream generation
        full_response = ""
        async for token in self.llm_service.generate_stream(prompt, temperature=temperature):
            full_response += token
            yield {"token": token}

        # Step 4: Yield sources
        if initial_state["sources"]:
            yield {"sources": initial_state["sources"]}

        # Step 5: Signal done with full response, including real confidence
        yield {"done": True, "full_response": full_response, "confidence": avg_similarity}

