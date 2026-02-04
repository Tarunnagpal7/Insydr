from typing import Annotated, TypedDict, List, Optional
from uuid import UUID

from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from langgraph.graph import StateGraph, END
from app.services.llm_service import LLMService
from app.rag.retriever import Retriever

# Define State
class GraphState(TypedDict):
    messages: List[BaseMessage]
    context: List[str]
    question: str
    workspace_id: UUID
    agent_id: Optional[str]
    document_ids: Optional[List[str]]

async def retrieve_node(state: GraphState, retriever: Retriever):
    """
    Retrieve relevant documents based on the question.
    """
    question = state["question"]
    workspace_id = state["workspace_id"]
    agent_id = state.get("agent_id")
    
    document_ids = None
    # Assuming we can fetch agent config here or it is passed in state.
    # Current state definition in graph.py doesn't have agent_config.
    # Ideally, we should fetch the agent here or pass the config in the state.
    # To keep it simple, let's assume we fetch the agent, or better, pass the 'document_ids' in state.
    # Let's update state to include optional document_ids or agent_configuration.
    
    if "document_ids" in state:
        document_ids = state["document_ids"]

    docs = await retriever.retrieve(question, workspace_id, document_ids=document_ids)
    return {"context": docs}

async def generate_node(state: GraphState, llm_service: LLMService):
    """
    Generate answer using RAG.
    """
    question = state["question"]
    context = state["context"]
    
    # Construct prompt
    context_str = "\n\n".join(context)
    prompt = f"""
    You are a helpful assistant. Use the following context to answer the user's question.
    If the answer is not in the context, say you don't know.
    
    Context:
    {context_str}
    
    Question:
    {question}
    
    Answer:
    """
    
    response = await llm_service.generate(prompt)
    return {"messages": [AIMessage(content=response)]}

class RAGGraph:
    def __init__(self, session):
        self.retriever = Retriever(session)
        self.llm_service = LLMService()
        self.workflow = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(GraphState)
        
        # Add Nodes
        workflow.add_node("retrieve", lambda state: retrieve_node(state, self.retriever))
        workflow.add_node("generate", lambda state: generate_node(state, self.llm_service))
        
        # Add Edges
        workflow.set_entry_point("retrieve")
        workflow.add_edge("retrieve", "generate")
        workflow.add_edge("generate", END)
        
        return workflow.compile()

    async def process_message(self, question: str, workspace_id: UUID, agent_id: Optional[str] = None, document_ids: Optional[List[str]] = None):
        initial_state = {
            "messages": [HumanMessage(content=question)],
            "question": question,
            "workspace_id": workspace_id,
            "agent_id": agent_id,
            "document_ids": document_ids,
            "context": []
        }
        
        result = await self.workflow.ainvoke(initial_state)
        return result["messages"][-1].content
