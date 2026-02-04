from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.db.models.agent import Agent
from app.db.models.agent_knowledge_collection import AgentKnowledgeCollection

class AgentRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, agent: Agent) -> Agent:
        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)
        return agent

    async def get_by_id(self, agent_id: UUID) -> Optional[Agent]:
        stmt = select(Agent).where(Agent.id == agent_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_all_by_workspace(self, workspace_id: UUID) -> List[Agent]:
        stmt = select(Agent).where(Agent.workspace_id == workspace_id).order_by(Agent.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, agent: Agent) -> Agent:
        self.session.add(agent)
        await self.session.commit()
        await self.session.refresh(agent)
        return agent

    async def delete(self, agent: Agent):
        await self.session.delete(agent)
        await self.session.commit()

    async def add_knowledge_collection(self, link: AgentKnowledgeCollection):
        self.session.add(link)
        await self.session.commit()
