"""
V12: Role-Based Access Control (RBAC) for workspace operations.

Provides dependency-injection compatible permission checks
for FastAPI routes that require specific workspace roles.
"""

from enum import Enum
from uuid import UUID
from typing import List

from fastapi import HTTPException, status, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db, get_current_user
from app.db.models.user import User
from app.db.models.workspace_member import WorkspaceMember


class WorkspaceRole(str, Enum):
    """Workspace membership roles, ordered by privilege level."""
    VIEWER = "viewer"
    MEMBER = "member"
    ADMIN = "admin"
    OWNER = "owner"


# Privilege hierarchy: higher index = more permissions
_ROLE_HIERARCHY = {
    WorkspaceRole.VIEWER: 0,
    WorkspaceRole.MEMBER: 1,
    WorkspaceRole.ADMIN: 2,
    WorkspaceRole.OWNER: 3,
}


async def _get_user_role_in_workspace(
    db: AsyncSession,
    user_id: UUID,
    workspace_id: UUID,
) -> WorkspaceRole | None:
    """
    Look up the user's role in a workspace.
    Returns None if the user is not a member.
    """
    stmt = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id,
    )
    result = await db.execute(stmt)
    member = result.scalar_one_or_none()
    if not member:
        return None
    try:
        return WorkspaceRole(member.role)
    except ValueError:
        return None


def require_workspace_role(
    *minimum_roles: WorkspaceRole,
    workspace_id_param: str = "workspace_id",
):
    """
    FastAPI dependency factory that enforces a minimum workspace role.

    Usage:
        @router.delete(
            "/{workspace_id}/settings",
            dependencies=[Depends(require_workspace_role(WorkspaceRole.ADMIN))],
        )
        async def delete_settings(workspace_id: UUID, ...):
            ...

    Args:
        minimum_roles: One or more roles that satisfy the requirement.
                       The check passes if the user has ANY of these roles
                       or a role with higher privilege.
        workspace_id_param: Name of the path parameter containing the workspace UUID.
    """

    # Determine the minimum privilege level needed
    min_level = min(_ROLE_HIERARCHY.get(r, 99) for r in minimum_roles)
    allowed_human_readable = ", ".join(
        r.value for r, lvl in _ROLE_HIERARCHY.items() if lvl >= min_level
    )

    async def _check(
        current_user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
        **kwargs,
    ):
        # Extract workspace_id from the request path
        # FastAPI injects path params into the dependency via kwargs
        # but we need to grab it from the request scope directly.
        from starlette.requests import Request
        # This won't actually work as a dep kwarg — we rely on the route
        # having a workspace_id path parameter that FastAPI resolves.
        pass

    # A cleaner approach: return a dependency class
    class _RoleChecker:
        """Callable dependency that checks workspace role."""

        async def __call__(
            self,
            workspace_id: UUID,
            current_user: User = Depends(get_current_user),
            db: AsyncSession = Depends(get_db),
        ):
            user_role = await _get_user_role_in_workspace(
                db, current_user.id, workspace_id
            )
            if user_role is None:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="You are not a member of this workspace.",
                )
            user_level = _ROLE_HIERARCHY.get(user_role, -1)
            if user_level < min_level:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=(
                        f"Insufficient permissions. "
                        f"Required role: {allowed_human_readable}. "
                        f"Your role: {user_role.value}."
                    ),
                )
            return user_role

    return Depends(_RoleChecker())
