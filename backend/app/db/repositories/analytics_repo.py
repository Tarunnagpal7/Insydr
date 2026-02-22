from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID
from datetime import datetime
from app.db.models.unanswered_question import UnansweredQuestion

class AnalyticsRepository:
    def __init__(self, session: AsyncSession):
        self.session = session
        
    async def track_unanswered_question(
        self, 
        workspace_id: UUID, 
        question: str, 
        agent_id: UUID | None = None,
        conversation_id: UUID | None = None
    ) -> UnansweredQuestion:
        # Check if question already exists for this workspace
        stmt = select(UnansweredQuestion).where(
            UnansweredQuestion.workspace_id == workspace_id,
            UnansweredQuestion.question == question,
            UnansweredQuestion.status == "unresolved"
        )
        result = await self.session.execute(stmt)
        existing = result.scalar_one_or_none()
        
        if existing:
            existing.occurrence_count += 1
            existing.last_seen_at = datetime.utcnow()
            await self.session.commit()
            return existing
            
        # Create new entry
        new_q = UnansweredQuestion(
            workspace_id=workspace_id,
            agent_id=agent_id or workspace_id, # Fallback if None
            conversation_id=conversation_id or workspace_id, # Fallback
            question=question,
            occurrence_count=1,
            status="unresolved",
        )
        self.session.add(new_q)
        await self.session.commit()
        await self.session.refresh(new_q)
        return new_q