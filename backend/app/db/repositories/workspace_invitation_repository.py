from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.models.workspace_invitation import WorkspaceInvitation
from typing import Optional
from uuid import UUID

class WorkspaceInvitationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        self.db.add(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)
        return invitation

    async def get_by_token(self, token: str) -> Optional[WorkspaceInvitation]:
        result = await self.db.execute(select(WorkspaceInvitation).where(WorkspaceInvitation.token == token))
        return result.scalar_one_or_none()

    async def get_pending_by_workspace(self, workspace_id: UUID) -> list[WorkspaceInvitation]:
        result = await self.db.execute(
            select(WorkspaceInvitation).where(
                WorkspaceInvitation.workspace_id == workspace_id,
                WorkspaceInvitation.status == "PENDING"
            )
        )
        return result.scalars().all()

    async def get_by_email_and_workspace(self, email: str, workspace_id: UUID) -> Optional[WorkspaceInvitation]:
        result = await self.db.execute(
            select(WorkspaceInvitation).where(
                WorkspaceInvitation.workspace_id == workspace_id,
                WorkspaceInvitation.email == email,
                WorkspaceInvitation.status == "PENDING"
            )
        )
        return result.scalar_one_or_none()

    async def update(self, invitation: WorkspaceInvitation) -> WorkspaceInvitation:
        await self.db.commit()
        await self.db.refresh(invitation)
        return invitation
