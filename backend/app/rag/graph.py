from typing import Annotated, TypedDict, List, Optional, Dict, Any
from uuid import UUID

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from app.services.llm_service import LLMService
from app.rag.retriever import Retriever
from app.core.agent_templates import build_system_prompt

# Define State
class GraphState(TypedDict):
    messages: List[BaseMessage]
    context: List[str]
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

async def retrieve_node(state: GraphState, retriever: Retriever):
    """
    Retrieve relevant documents based on the question.
    """
    try:
        question = state["question"]
        workspace_id = state["workspace_id"]
        agent_id = state.get("agent_id")
        
        document_ids = None

        if "document_ids" in state:
            document_ids = state["document_ids"]

        docs = await retriever.retrieve(question, workspace_id, document_ids=document_ids)
        return {"context": docs}
    except Exception as e:
        print(f"Error in retrieve_node: {e}")
        import traceback
        traceback.print_exc()
        raise e

async def generate_node(state: GraphState, llm_service: LLMService):
    """
    Generate answer using RAG with dynamic system prompt based on agent config.
    """
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
        initial_state = {
            "messages": [HumanMessage(content=question)],
            "question": question,
            "workspace_id": workspace_id,
            "agent_id": agent_id,
            "conversation_id": conversation_id,
            "document_ids": document_ids,
            "context": [],
            # Agent behavior
            "agent_type": agent_type,
            "behavior_settings": behavior_settings or {},
            "custom_prompt": custom_prompt,
            "agent_name": agent_name,
            # Response config and guardrails
            "response_config": response_config or {},
            "conversation_rules": conversation_rules or {},
        }
        
        result = await self.workflow.ainvoke(initial_state)
        
        if not result.get("context"):
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
