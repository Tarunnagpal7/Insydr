from uuid import UUID
from typing import List, Optional, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.agent import Agent
from app.db.repositories.agent_repo import AgentRepository

class AgentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.agent_repo = AgentRepository(session)

    async def create_agent(self, 
                           workspace_id: UUID, 
                           name: str, 
                           description: Optional[str] = None,
                           agent_type: str = "custom",
                           configuration: Optional[Dict] = None,
                           behavior_settings: Optional[Dict] = None,
                           document_ids: Optional[List[UUID]] = None,
                           allowed_domains: Optional[List[str]] = None) -> Agent:
        agent = Agent(
            workspace_id=workspace_id,
            name=name,
            description=description,
            agent_type=agent_type,
            status="active",
            version="1.0.0",
            configuration=configuration or {},
            behavior_settings=behavior_settings or {},
            response_config={},
            conversation_rules={},
            allowed_domains=allowed_domains or []
        )
        created_agent = await self.agent_repo.create(agent)
        
        # Link documents (using collection_id linkage)
        # Note: Our current schema uses AgentKnowledgeCollection which links agent_id to collection_id.
        # Documents also belong to a collection_id.
        # If we want to link individual docs, we might need a direct link table or assign docs to a collection per agent.
        # For simplicity in this iteration: We assume 'document_ids' are passed. 
        # But we need a way to link agent -> document.
        # Let's check schema: AgentKnowledgeCollection links agent -> collection.
        # Document has collection_id. 
        # If we assume 1 Agent = 1 Collection (or many), we can create a collection for this agent.
        
        if document_ids:
             # Create a collection for this agent? Or link existing collection?
             # User selects existing docs. Those docs might differ in collection_id.
             # This suggests we need a direct Document-Agent link or a Collection that groups them.
             # For now, let's create a *new* collection for this agent "Agent Knowledge" and assign it?
             # BUT documents can't easily be moved if they belong to "General Workspace" collection.
             
             # ALTERNATIVE: Just store document_ids in 'configuration' JSON for now if we don't change schema.
             # This is easiest for MVP without changing DB schema heavily.
             
             if not created_agent.configuration:
                 created_agent.configuration = {}
             
             created_agent.configuration["knowledge_sources"] = [str(d) for d in document_ids]
             await self.agent_repo.update(created_agent)

             # Trigger processing for any docs that need it
             # We need KnowledgeService for this. Dependency injection inside method?
             # Or we can just import it (circular?) or use a helper.
             # Better: Use the same pattern as "link_agent_to_collection" or pass service.
             # For now, let's just do it here carefully.
             from app.services.knowledge_service import KnowledgeService
             # We need to instantiate it, but it needs a session. We have self.session.
             # This is a bit "service calling service", which is fine.
             ks = KnowledgeService(self.session)
             
             for doc_id in document_ids:
                 try:
                     await ks.process_existing_document(doc_id)
                 except Exception as e:
                     print(f"Failed to process doc {doc_id} for agent: {e}")
                     # Log but don't fail agent creation? 
                     # Maybe we should fail to warn user.
                     # For now, print error.
                     raise e

        return created_agent

    async def get_agents(self, workspace_id: UUID) -> List[Agent]:
        return await self.agent_repo.get_all_by_workspace(workspace_id)

    async def get_agent(self, agent_id: UUID) -> Optional[Agent]:
        return await self.agent_repo.get_by_id(agent_id)

    async def update_agent(self, agent_id: UUID, **kwargs) -> Agent:
        agent = await self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise ValueError("Agent not found")
        
        for key, value in kwargs.items():
            if hasattr(agent, key):
                setattr(agent, key, value)
        
        return await self.agent_repo.update(agent)

    async def link_agent_to_collection(self, agent_id: UUID, collection_id: UUID):
        from app.db.models.agent_knowledge_collection import AgentKnowledgeCollection
        link = AgentKnowledgeCollection(
            agent_id=agent_id,
            collection_id=collection_id
        )
        await self.agent_repo.add_knowledge_collection(link)
