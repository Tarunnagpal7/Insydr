from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from app.api import deps
from app.api.schemas.agent import AgentCreate, AgentResponse, ChatRequest, ChatResponse
from app.services.agent_service import AgentService
from app.db.models.user import User
from app.rag.graph import RAGGraph
from app.rag.retriever import Retriever

router = APIRouter()

@router.post("/", response_model=AgentResponse)
async def create_agent(
    agent_in: AgentCreate,
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Create a new agent in a workspace.
    """
    # Verify workspace access (TODO: strict permission check)
    try:
        return await service.create_agent(
            workspace_id=workspace_id,
            name=agent_in.name,
            description=agent_in.description,
            agent_type=agent_in.agent_type,
            configuration=agent_in.configuration,
            behavior_settings=agent_in.behavior_settings,
            document_ids=agent_in.document_ids
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to create agent: {str(e)}")

@router.get("/", response_model=List[AgentResponse])
async def list_agents(
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    List all agents in a workspace.
    """
    return await service.get_agents(workspace_id)

@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
):
    """
    Get a specific agent.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent

@router.post("/{agent_id}/chat", response_model=ChatResponse)
async def chat_agent(
    agent_id: UUID,
    chat_request: ChatRequest,
    current_user: User = Depends(deps.get_current_user),
    service: AgentService = Depends(deps.get_agent_service),
    db_session = Depends(deps.get_db),
):
    """
    Chat with an agent.
    """
    agent = await service.get_agent(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
        
    # Initialize RAG Graph
    rag = RAGGraph(db_session)
    
    # Extract document IDs from agent configuration
    document_ids = None
    if agent.configuration and "knowledge_sources" in agent.configuration:
        document_ids = agent.configuration["knowledge_sources"]
    
    # Process
    try:
        response = await rag.process_message(
            question=chat_request.message, 
            workspace_id=agent.workspace_id,
            agent_id=str(agent.id),
            document_ids=document_ids
        )
        return {"response": response}
    except Exception as e:
        print(f"Chat error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
