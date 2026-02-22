from uuid import UUID
from typing import List, Optional, Dict
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.agent import Agent
from app.db.models.workspace import Workspace
from app.db.repositories.agent_repo import AgentRepository
from app.services import cloudinary_service


# Plan-based agent limits (matches PricingCards.tsx tiers)
PLAN_AGENT_LIMITS: Dict[str, int] = {
    "FREE": 1,
    "PRO": 5,
    "BUSINESS": -1,  # -1 = unlimited
}


class AgentService:
    def __init__(self, session: AsyncSession):
        self.session = session
        self.agent_repo = AgentRepository(session)

    async def get_agent_count(self, workspace_id: UUID) -> int:
        """Get the current number of agents in a workspace."""
        stmt = select(func.count(Agent.id)).where(Agent.workspace_id == workspace_id)
        result = await self.session.execute(stmt)
        return result.scalar() or 0

    async def get_agent_limit(self, workspace_id: UUID) -> int:
        """Get the agent limit for a workspace based on its subscription tier."""
        stmt = select(Workspace).where(Workspace.id == workspace_id)
        result = await self.session.execute(stmt)
        workspace = result.scalar_one_or_none()
        
        if not workspace:
            return 0
        
        tier = (workspace.subscription_tier or "FREE").upper()
        return PLAN_AGENT_LIMITS.get(tier, 1)

    async def check_agent_limit(self, workspace_id: UUID) -> dict:
        """
        Check if workspace can create more agents.
        Returns dict with: can_create, current_count, max_allowed, tier
        """
        count = await self.get_agent_count(workspace_id)
        limit = await self.get_agent_limit(workspace_id)
        
        # Get workspace tier
        stmt = select(Workspace.subscription_tier).where(Workspace.id == workspace_id)
        result = await self.session.execute(stmt)
        tier = result.scalar() or "FREE"
        
        can_create = (limit == -1) or (count < limit)
        
        return {
            "can_create": can_create,
            "current_count": count,
            "max_allowed": limit,  # -1 means unlimited
            "tier": tier.upper()
        }

    async def create_agent(self, 
                           workspace_id: UUID, 
                           name: str, 
                           description: Optional[str] = None,
                           agent_type: str = "custom",
                           configuration: Optional[Dict] = None,
                           behavior_settings: Optional[Dict] = None,
                           document_ids: Optional[List[UUID]] = None,
                           allowed_domains: Optional[List[str]] = None) -> Agent:
        
        from app.core.agent_templates import get_agent_type_info
        
        # ── Plan-based limit check ──
        limit_info = await self.check_agent_limit(workspace_id)
        if not limit_info["can_create"]:
            max_str = "unlimited" if limit_info["max_allowed"] == -1 else str(limit_info["max_allowed"])
            raise ValueError(
                f"Agent limit reached. Your {limit_info['tier']} plan allows {max_str} agent(s). "
                f"You currently have {limit_info['current_count']}. Upgrade your plan to create more agents."
            )
        
        # ── Auto-apply template defaults ──
        template_info = get_agent_type_info(agent_type)
        
        # If no behavior_settings provided, use template defaults
        if not behavior_settings:
            behavior_settings = template_info.get("default_behavior", {
                "tone": "friendly",
                "response_style": "conversational",
                "temperature": 0.5,
            })
        
        # Set greeting from template if not custom
        greeting = template_info.get("suggested_greeting", "Hello! How can I help you today?")
        
        agent = Agent(
            workspace_id=workspace_id,
            name=name,
            description=description,
            agent_type=agent_type,
            status="active",
            is_active=True,
            version="1.0.0",
            configuration=configuration or {},
            behavior_settings=behavior_settings,
            response_config={},
            conversation_rules={},
            allowed_domains=allowed_domains or [],
            greeting_message=greeting,
        )
        created_agent = await self.agent_repo.create(agent)
        
        if document_ids:
             if not created_agent.configuration:
                 created_agent.configuration = {}
             
             created_agent.configuration["knowledge_sources"] = [str(d) for d in document_ids]
             await self.agent_repo.update(created_agent)

             from app.services.knowledge_service import KnowledgeService
             ks = KnowledgeService(self.session)
             
             for doc_id in document_ids:
                 try:
                     await ks.process_existing_document(doc_id)
                 except Exception as e:
                     print(f"Failed to process doc {doc_id} for agent: {e}")
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
        
        from sqlalchemy.orm.attributes import flag_modified

        # Only update fields that are explicitly provided and not None
        for key, value in kwargs.items():
            if value is not None and hasattr(agent, key):
                setattr(agent, key, value)
                # Ensure SQLAlchemy tracks changes to JSON fields
                if key in ['configuration', 'behavior_settings', 'response_config', 'conversation_rules', 'allowed_domains']:
                    flag_modified(agent, key)
        
        # Update timestamp
        from datetime import datetime
        agent.updated_at = datetime.utcnow()
        
        return await self.agent_repo.update(agent)

    async def update_avatar(self, agent_id: UUID, file_path: str) -> Agent:
        """
        Upload a new avatar for an agent.
        Deletes the old avatar from Cloudinary before uploading the new one.
        """
        agent = await self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise ValueError("Agent not found")
        
        # 1. Delete old avatar from Cloudinary if it exists
        if agent.avatar_public_id:
            try:
                await cloudinary_service.delete_file_async(
                    agent.avatar_public_id, 
                    resource_type="image"
                )
                print(f"[AVATAR] Deleted old avatar: {agent.avatar_public_id}")
            except Exception as e:
                print(f"[AVATAR] Warning: Failed to delete old avatar {agent.avatar_public_id}: {e}")
                # Continue with upload even if delete fails
        
        # 2. Upload new avatar
        public_id = f"agent-{agent_id}-avatar"
        result = await cloudinary_service.upload_avatar(file_path, public_id=public_id)
        
        # 3. Update agent record
        agent.avatar_url = result.get("secure_url") or result.get("url")
        agent.avatar_public_id = result.get("public_id")
        
        from datetime import datetime
        agent.updated_at = datetime.utcnow()
        
        return await self.agent_repo.update(agent)

    async def delete_avatar(self, agent_id: UUID) -> Agent:
        """Remove an agent's avatar and delete it from Cloudinary."""
        agent = await self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise ValueError("Agent not found")
        
        if agent.avatar_public_id:
            try:
                await cloudinary_service.delete_file_async(
                    agent.avatar_public_id,
                    resource_type="image"
                )
                print(f"[AVATAR] Deleted avatar: {agent.avatar_public_id}")
            except Exception as e:
                print(f"[AVATAR] Warning: Failed to delete avatar {agent.avatar_public_id}: {e}")
        
        agent.avatar_url = None
        agent.avatar_public_id = None
        
        from datetime import datetime
        agent.updated_at = datetime.utcnow()
        
        return await self.agent_repo.update(agent)

    async def toggle_active(self, agent_id: UUID, is_active: bool) -> Agent:
        """Toggle agent visibility on widget (active/inactive)."""
        agent = await self.agent_repo.get_by_id(agent_id)
        if not agent:
            raise ValueError("Agent not found")
        
        agent.is_active = is_active
        agent.status = "active" if is_active else "inactive"
        
        from datetime import datetime
        agent.updated_at = datetime.utcnow()
        
        return await self.agent_repo.update(agent)

    async def link_agent_to_collection(self, agent_id: UUID, collection_id: UUID):
        from app.db.models.agent_knowledge_collection import AgentKnowledgeCollection
        link = AgentKnowledgeCollection(
            agent_id=agent_id,
            collection_id=collection_id
        )
        await self.agent_repo.add_knowledge_collection(link)
