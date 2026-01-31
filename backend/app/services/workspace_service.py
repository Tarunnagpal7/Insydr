from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.db.models.workspace import Workspace
from app.db.models.workspace_member import WorkspaceMember
from app.db.models.user import User
from app.db.repositories.workspace_repository import WorkspaceRepository, WorkspaceMemberRepository
from app.db.repositories.auth_repository import UserRepository


class WorkspaceService:
    def __init__(
        self,
        workspace_repo: WorkspaceRepository,
        member_repo: WorkspaceMemberRepository,
        user_repo: UserRepository
    ):
        self.workspace_repo = workspace_repo
        self.member_repo = member_repo
        self.user_repo = user_repo

    async def create_workspace(
        self,
        user_id: UUID,
        name: str,
        timezone: str = "UTC",
        settings: Optional[dict] = None
    ) -> Workspace:
        """Create a new workspace for the user."""
        if not name or not name.strip():
            raise ValueError("Workspace name is required")

        workspace = Workspace(
            owner_id=user_id,
            name=name.strip(),
            timezone=timezone,
            settings=settings or {},
            subscription_tier="FREE"
        )
        
        return await self.workspace_repo.create(workspace)

    async def get_user_workspaces(self, user_id: UUID) -> List[dict]:
        """Get all workspaces for a user with stats and role."""
        workspaces = await self.workspace_repo.get_user_workspaces(user_id)
        
        result = []
        for workspace in workspaces:
            stats = await self.workspace_repo.get_workspace_stats(workspace.id)
            role = await self.workspace_repo.get_user_role(workspace.id, user_id)
            
            result.append({
                "workspace": workspace,
                "stats": stats,
                "role": role
            })
        
        return result

    async def get_workspace(self, workspace_id: UUID, user_id: UUID) -> dict:
        """Get workspace details if user has access."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        has_access = await self.workspace_repo.user_has_access(workspace_id, user_id)
        if not has_access:
            raise PermissionError("You don't have access to this workspace")
        
        stats = await self.workspace_repo.get_workspace_stats(workspace_id)
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        
        return {
            "workspace": workspace,
            "stats": stats,
            "role": role
        }

    async def update_workspace(
        self,
        workspace_id: UUID,
        user_id: UUID,
        name: Optional[str] = None,
        logo_url: Optional[str] = None,
        timezone: Optional[str] = None,
        settings: Optional[dict] = None
    ) -> Workspace:
        """Update workspace if user is owner or admin."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can update workspace")
        
        if name is not None:
            workspace.name = name.strip()
        if logo_url is not None:
            workspace.logo_url = logo_url
        if timezone is not None:
            workspace.timezone = timezone
        if settings is not None:
            workspace.settings = settings
        
        workspace.updated_at = datetime.utcnow()
        
        return await self.workspace_repo.update(workspace)

    async def delete_workspace(self, workspace_id: UUID, user_id: UUID) -> bool:
        """Delete workspace if user is owner."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        if workspace.owner_id != user_id:
            raise PermissionError("Only the owner can delete the workspace")
        
        return await self.workspace_repo.delete(workspace_id)

    async def add_member(
        self,
        workspace_id: UUID,
        owner_id: UUID,
        email: str,
        role: str = "MEMBER"
    ) -> WorkspaceMember:
        """Add a member to workspace."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        owner_role = await self.workspace_repo.get_user_role(workspace_id, owner_id)
        if owner_role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can add members")
        
        # Find user by email
        user = await self.user_repo.get_by_email(email)
        if not user:
            raise ValueError(f"User with email {email} not found")
        
        # Check if already a member
        existing = await self.member_repo.get_member(workspace_id, user.id)
        if existing:
            raise ValueError("User is already a member of this workspace")
        
        # Check if user is the owner
        if workspace.owner_id == user.id:
            raise ValueError("User is already the owner of this workspace")
        
        member = WorkspaceMember(
            workspace_id=workspace_id,
            user_id=user.id,
            role=role
        )
        
        return await self.member_repo.add_member(member)

    async def get_members(self, workspace_id: UUID, user_id: UUID) -> List[dict]:
        """Get all workspace members with user details."""
        has_access = await self.workspace_repo.user_has_access(workspace_id, user_id)
        if not has_access:
            raise PermissionError("You don't have access to this workspace")
        
        members = await self.member_repo.get_members(workspace_id)
        
        # Get workspace to include owner
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        owner = await self.user_repo.get_by_id(workspace.owner_id)
        
        result = []
        
        # Add owner
        if owner:
            result.append({
                "id": None,
                "user_id": owner.id,
                "workspace_id": workspace_id,
                "role": "OWNER",
                "joined_at": workspace.created_at,
                "user_email": owner.email,
                "user_name": owner.full_name
            })
        
        # Add members
        for member in members:
            user = await self.user_repo.get_by_id(member.user_id)
            result.append({
                "id": member.id,
                "user_id": member.user_id,
                "workspace_id": member.workspace_id,
                "role": member.role,
                "joined_at": member.joined_at,
                "user_email": user.email if user else None,
                "user_name": user.full_name if user else None
            })
        
        return result

    async def remove_member(
        self,
        workspace_id: UUID,
        member_id: UUID,
        user_id: UUID
    ) -> bool:
        """Remove a member from workspace."""
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can remove members")
        
        return await self.member_repo.remove_member(member_id)

    async def update_member_role(
        self,
        workspace_id: UUID,
        member_id: UUID,
        new_role: str,
        user_id: UUID
    ) -> WorkspaceMember:
        """Update member role."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        
        if not workspace:
            raise ValueError("Workspace not found")
        
        if workspace.owner_id != user_id:
            raise PermissionError("Only the owner can change member roles")
        
        return await self.member_repo.update_role(member_id, new_role)
