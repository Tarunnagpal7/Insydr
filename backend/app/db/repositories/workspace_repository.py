from typing import Optional, List
from uuid import UUID
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models.workspace import Workspace
from app.db.models.workspace_member import WorkspaceMember
from app.db.models.user import User
import re


class WorkspaceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def _generate_slug(self, name: str) -> str:
        """Generate URL-friendly slug from workspace name."""
        slug = name.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = slug.strip('-')
        return slug[:50]  # Limit slug length

    async def _ensure_unique_slug(self, base_slug: str, workspace_id: Optional[UUID] = None) -> str:
        """Ensure slug is unique by appending numbers if needed."""
        slug = base_slug
        counter = 1

        while True:
            query = select(Workspace).where(Workspace.slug == slug)
            if workspace_id:
                query = query.where(Workspace.id != workspace_id)
            
            result = await self.db.execute(query)
            existing = result.scalar_one_or_none()
            
            if not existing:
                return slug
            
            slug = f"{base_slug}-{counter}"
            counter += 1

    async def create(self, workspace: Workspace) -> Workspace:
        """Create a new workspace with unique slug."""
        base_slug = self._generate_slug(workspace.name)
        workspace.slug = await self._ensure_unique_slug(base_slug)
        
        self.db.add(workspace)
        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def get_by_id(self, workspace_id: UUID) -> Optional[Workspace]:
        """Get workspace by ID."""
        result = await self.db.execute(
            select(Workspace).where(Workspace.id == workspace_id)
        )
        return result.scalar_one_or_none()

    async def get_by_slug(self, slug: str) -> Optional[Workspace]:
        """Get workspace by slug."""
        result = await self.db.execute(
            select(Workspace).where(Workspace.slug == slug)
        )
        return result.scalar_one_or_none()

    async def get_user_workspaces(self, user_id: UUID) -> List[Workspace]:
        """Get all workspaces where user is owner or member."""
        # Use subquery approach to avoid DISTINCT with JSON columns
        from sqlalchemy import union_all
        
        # Workspaces where user is owner
        owned = select(Workspace.id).where(Workspace.owner_id == user_id)
        
        # Workspaces where user is member
        member_of = select(WorkspaceMember.workspace_id).where(WorkspaceMember.user_id == user_id)
        
        # Combine and get unique IDs
        all_workspace_ids = union_all(owned, member_of).subquery()
        
        # Get full workspace objects
        query = (
            select(Workspace)
            .where(Workspace.id.in_(select(all_workspace_ids)))
            .order_by(Workspace.created_at.desc())
        )
        
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update(self, workspace: Workspace) -> Workspace:
        """Update workspace."""
        if workspace.name:
            base_slug = self._generate_slug(workspace.name)
            workspace.slug = await self._ensure_unique_slug(base_slug, workspace.id)
        
        await self.db.commit()
        await self.db.refresh(workspace)
        return workspace

    async def delete(self, workspace_id: UUID) -> bool:
        """Delete workspace (cascade will handle related records)."""
        workspace = await self.get_by_id(workspace_id)
        if workspace:
            await self.db.delete(workspace)
            await self.db.commit()
            return True
        return False

    async def get_workspace_stats(self, workspace_id: UUID) -> dict:
        """Get workspace statistics."""
        from app.db.models.agent import Agent
        from app.db.models.document import Document
        from app.db.models.conversation import Conversation
        from app.db.models.message import Message

        # Count agents
        agents_result = await self.db.execute(
            select(func.count(Agent.id)).where(Agent.workspace_id == workspace_id)
        )
        agent_count = agents_result.scalar() or 0

        # Count documents
        docs_result = await self.db.execute(
            select(func.count(Document.id)).where(Document.workspace_id == workspace_id)
        )
        document_count = docs_result.scalar() or 0

        # Count conversations
        convs_result = await self.db.execute(
            select(func.count(Conversation.id)).where(Conversation.workspace_id == workspace_id)
        )
        conversation_count = convs_result.scalar() or 0

        # Count messages
        msgs_result = await self.db.execute(
            select(func.count(Message.id)).where(Message.workspace_id == workspace_id)
        )
        message_count = msgs_result.scalar() or 0

        return {
            "total_agents": agent_count,
            "total_documents": document_count,
            "total_conversations": conversation_count,
            "total_messages": message_count
        }

    async def user_has_access(self, workspace_id: UUID, user_id: UUID) -> bool:
        """Check if user has access to workspace."""
        workspace = await self.get_by_id(workspace_id)
        if not workspace:
            return False
        
        # Owner has access
        if workspace.owner_id == user_id:
            return True
        
        # Check membership
        result = await self.db.execute(
            select(WorkspaceMember).where(
                and_(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == user_id
                )
            )
        )
        member = result.scalar_one_or_none()
        return member is not None

    async def get_user_role(self, workspace_id: UUID, user_id: UUID) -> Optional[str]:
        """Get user's role in workspace."""
        workspace = await self.get_by_id(workspace_id)
        if not workspace:
            return None
        
        if workspace.owner_id == user_id:
            return "OWNER"
        
        result = await self.db.execute(
            select(WorkspaceMember).where(
                and_(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == user_id
                )
            )
        )
        member = result.scalar_one_or_none()
        return member.role if member else None


class WorkspaceMemberRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def add_member(self, member: WorkspaceMember) -> WorkspaceMember:
        """Add member to workspace."""
        self.db.add(member)
        await self.db.commit()
        await self.db.refresh(member)
        return member

    async def get_members(self, workspace_id: UUID) -> List[WorkspaceMember]:
        """Get all members of a workspace."""
        result = await self.db.execute(
            select(WorkspaceMember)
            .where(WorkspaceMember.workspace_id == workspace_id)
            .order_by(WorkspaceMember.joined_at.desc())
        )
        return list(result.scalars().all())

    async def get_member(self, workspace_id: UUID, user_id: UUID) -> Optional[WorkspaceMember]:
        """Get specific member."""
        result = await self.db.execute(
            select(WorkspaceMember).where(
                and_(
                    WorkspaceMember.workspace_id == workspace_id,
                    WorkspaceMember.user_id == user_id
                )
            )
        )
        return result.scalar_one_or_none()

    async def remove_member(self, member_id: UUID) -> bool:
        """Remove member from workspace."""
        result = await self.db.execute(
            select(WorkspaceMember).where(WorkspaceMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        
        if member:
            await self.db.delete(member)
            await self.db.commit()
            return True
        return False

    async def update_role(self, member_id: UUID, role: str) -> Optional[WorkspaceMember]:
        """Update member role."""
        result = await self.db.execute(
            select(WorkspaceMember).where(WorkspaceMember.id == member_id)
        )
        member = result.scalar_one_or_none()
        
        if member:
            member.role = role
            await self.db.commit()
            await self.db.refresh(member)
        
        return member
