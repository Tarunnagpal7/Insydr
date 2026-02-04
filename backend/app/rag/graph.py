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
        # Wrapper functions to handle async calls properly if needed, but LangGraph supports async nodes.
        # The issue "Expected dict, got <coroutine...>" suggests the lambda is returning a coroutine but LangGraph might be expecting the node function to be awaited or defined differently if using lambdas.
        # It's better to pass the partial function or just the function and inject dependencies differently,
        # OR define the node functions as just taking 'state' and accessing dependencies from self if possible,
        # OR defining them as sync wrappers that return the coroutine (but LangGraph handles async def).

        # The lambda `lambda state: retrieve_node(state, self.retriever)` returns a coroutine object when called.
        # If LangGraph executes this sync lambda, it gets a coroutine back and might not await it if it expects a dict immediately.
        # Let's wrap them in async functions or use functools.partial.
        
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
