from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app.db.models.workspace import Workspace
from app.db.models.workspace_member import WorkspaceMember
from app.db.models.user import User
from app.db.repositories.workspace_repository import WorkspaceRepository, WorkspaceMemberRepository
from app.db.repositories.auth_repository import UserRepository
from app.db.repositories.workspace_invitation_repository import WorkspaceInvitationRepository
from app.db.models.workspace_invitation import WorkspaceInvitation
import secrets
from datetime import timedelta

from app.services.email_service import EmailService

class WorkspaceService:
    def __init__(
        self,
        workspace_repo: WorkspaceRepository,
        member_repo: WorkspaceMemberRepository,
        user_repo: UserRepository,
        invitation_repo: WorkspaceInvitationRepository,
        email_service: EmailService
    ):
        self.workspace_repo = workspace_repo
        self.member_repo = member_repo
        self.user_repo = user_repo
        self.invitation_repo = invitation_repo
        self.email_service = email_service

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
        
        created_workspace = await self.workspace_repo.create(workspace)
        
        # Send email notification
        owner = await self.user_repo.get_by_id(user_id)
        if owner:
            # Assuming the first origin is the main frontend
            dashboard_url = "http://localhost:3000/dashboard" 
            await self.email_service.send_workspace_created_email(
                email=owner.email,
                name=owner.full_name,
                workspace_name=created_workspace.name,
                created_at=created_workspace.created_at.strftime("%Y-%m-%d %H:%M"),
                dashboard_url=dashboard_url
            )
            
        return created_workspace

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

        return await self.member_repo.update_role(member_id, new_role)

    async def invite_user(
        self,
        workspace_id: UUID,
        inviter_id: UUID,
        email: str,
        role: str = "MEMBER"
    ) -> WorkspaceInvitation:
        """Invite a user to the workspace."""
        workspace = await self.workspace_repo.get_by_id(workspace_id)
        if not workspace:
            raise ValueError("Workspace not found")

        # Check permissions
        inviter_role = await self.workspace_repo.get_user_role(workspace_id, inviter_id)
        if inviter_role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can invite members")

        # Check if user is already a member
        user = await self.user_repo.get_by_email(email)
        if user:
            member = await self.member_repo.get_member(workspace_id, user.id)
            if member:
                raise ValueError("User is already a member")
            if workspace.owner_id == user.id:
                raise ValueError("User is the owner")

        # Check if invitation already pending
        existing_invite = await self.invitation_repo.get_by_email_and_workspace(email, workspace_id)
        if existing_invite:
            raise ValueError("Invitation already sent to this email")

        # Check Plan Limits
        # Count current members (including owner)
        members = await self.member_repo.get_members(workspace_id)
        current_count = len(members) + 1 # +1 for owner (if not in members table, checking get_members logic)
        
        # Verify get_members logic: It fetches WorkspaceMember rows. Owner might not be in WorkspaceMember depending on implementation.
        # Looking at create_workspace, owner is just set on Workspace.owner_id, not added to WorkspaceMember.
        # So yes, +1 is correct.
        
        # Count pending invitations
        pending_invites = await self.invitation_repo.get_pending_by_workspace(workspace_id)
        pending_count = len(pending_invites)
        
        total_users = current_count + pending_count + 1 # +1 for the new one being added
        
        limit = 2 # Default/Free (Owner + 1 member)
        if workspace.subscription_tier == "PRO":
            limit = 5 # Owner + 4 members
        elif workspace.subscription_tier == "BUSINESS":
            limit = 1000 # Unlimited effectively
            
        if total_users > limit:
            if workspace.subscription_tier == "FREE":
                raise ValueError("Free tier limit reached (1 member). Upgrade to Pro to invite up to 5 members.")
            elif workspace.subscription_tier == "PRO":
                raise ValueError("Pro tier limit reached (5 members). Upgrade to Business for unlimited members.")
            else:
                 raise ValueError(f"Workspace limit reached ({limit} members).")

        # Create Invitation
        token = secrets.token_urlsafe(32)
        invitation = WorkspaceInvitation(
            workspace_id=workspace_id,
            inviter_id=inviter_id,
            email=email,
            token=token,
            role=role,
            status="PENDING",
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        await self.invitation_repo.create(invitation)
        
        # Send Email
        inviter = await self.user_repo.get_by_id(inviter_id)
        # TODO: Use environment variable for frontend URL
        invite_url = f"http://localhost:3000/invitation/{token}"
        
        await self.email_service.send_invitation_email(
            email=email,
            inviter_name=inviter.full_name,
            workspace_name=workspace.name,
            invite_url=invite_url
        )
        
        return invitation

    async def get_pending_invitations(self, workspace_id: UUID, user_id: UUID) -> List[WorkspaceInvitation]:
        """Get pending invitations for a workspace."""
        role = await self.workspace_repo.get_user_role(workspace_id, user_id)
        if role not in ["OWNER", "ADMIN"]:
            raise PermissionError("Only owners and admins can view pending invitations")
        
        return await self.invitation_repo.get_pending_by_workspace(workspace_id)

    async def get_invitation(self, token: str) -> dict:
        """Get invitation details with workspace info."""
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise ValueError("Invalid invitation token")
            
        if invitation.status != "PENDING":
            raise ValueError("Invitation is no longer valid")
            
        if invitation.expires_at < datetime.utcnow():
            invitation.status = "EXPIRED"
            await self.invitation_repo.update(invitation)
            raise ValueError("Invitation has expired")
            
        workspace = await self.workspace_repo.get_by_id(invitation.workspace_id)
        inviter = await self.user_repo.get_by_id(invitation.inviter_id)
        
        return {
            "invitation": invitation,
            "workspace": workspace,
            "inviter": inviter
        }

    async def accept_invitation(self, token: str, user_id: UUID) -> WorkspaceMember:
        """Accept an invitation."""
        invitation_data = await self.get_invitation(token)
        invitation = invitation_data["invitation"]
        
        user = await self.user_repo.get_by_id(user_id)
        
        # Optional: Enforce email match?
        # if user.email != invitation.email:
        #     raise ValueError("This invitation was sent to a different email address")
        
        # Check if already member
        existing = await self.member_repo.get_member(invitation.workspace_id, user_id)
        if existing:
            invitation.status = "ACCEPTED"
            invitation.accepted_at = datetime.utcnow()
            await self.invitation_repo.update(invitation)
            return existing

        # Double check limits (race condition)
        # ... logic similar to invite ...
        
        # Create Member
        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=user_id,
            role=invitation.role
        )
        
        new_member = await self.member_repo.add_member(member)
        
        # Update Invitation
        invitation.status = "ACCEPTED"
        invitation.accepted_at = datetime.utcnow()
        await self.invitation_repo.update(invitation)
        
        return new_member
