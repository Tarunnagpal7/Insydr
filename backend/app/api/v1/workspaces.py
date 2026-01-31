from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from uuid import UUID

from app.api.deps import get_workspace_service, get_current_user
from app.services.workspace_service import WorkspaceService
from app.api.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceWithStats,
    WorkspaceListResponse,
    WorkspaceMemberAdd,
    WorkspaceMemberResponse,
    WorkspaceMemberListResponse
)
from app.db.models.user import User


router = APIRouter(prefix="/workspaces", tags=["Workspaces"])


@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    request: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Create a new workspace.
    The authenticated user becomes the owner.
    """
    try:
        workspace = await workspace_service.create_workspace(
            user_id=current_user.id,
            name=request.name,
            timezone=request.timezone,
            settings=request.settings
        )
        return WorkspaceResponse.model_validate(workspace)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("", response_model=WorkspaceListResponse)
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Get all workspaces where the user is owner or member.
    """
    try:
        workspaces_data = await workspace_service.get_user_workspaces(current_user.id)
        
        workspaces = []
        for data in workspaces_data:
            workspace_dict = data["workspace"].__dict__.copy()
            workspace_dict.pop('_sa_instance_state', None)
            
            workspace_with_stats = WorkspaceWithStats(
                **workspace_dict,
                stats=data["stats"],
                role=data["role"]
            )
            workspaces.append(workspace_with_stats)
        
        return WorkspaceListResponse(
            workspaces=workspaces,
            total=len(workspaces)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch workspaces: {str(e)}"
        )


@router.get("/{workspace_id}", response_model=WorkspaceWithStats)
async def get_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Get workspace details by ID.
    User must have access to the workspace.
    """
    try:
        data = await workspace_service.get_workspace(workspace_id, current_user.id)
        
        workspace_dict = data["workspace"].__dict__.copy()
        workspace_dict.pop('_sa_instance_state', None)
        
        return WorkspaceWithStats(
            **workspace_dict,
            stats=data["stats"],
            role=data["role"]
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.patch("/{workspace_id}", response_model=WorkspaceResponse)
async def update_workspace(
    workspace_id: UUID,
    request: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Update workspace settings.
    Only owners and admins can update.
    """
    try:
        workspace = await workspace_service.update_workspace(
            workspace_id=workspace_id,
            user_id=current_user.id,
            name=request.name,
            logo_url=request.logo_url,
            timezone=request.timezone,
            settings=request.settings
        )
        return WorkspaceResponse.model_validate(workspace)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Delete workspace.
    Only the owner can delete.
    """
    try:
        await workspace_service.delete_workspace(workspace_id, current_user.id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


# Member Management Endpoints

@router.post("/{workspace_id}/members", response_model=WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    workspace_id: UUID,
    request: WorkspaceMemberAdd,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Add a member to the workspace.
    Only owners and admins can add members.
    """
    try:
        member = await workspace_service.add_member(
            workspace_id=workspace_id,
            owner_id=current_user.id,
            email=request.email,
            role=request.role
        )
        return WorkspaceMemberResponse.model_validate(member)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/{workspace_id}/members", response_model=WorkspaceMemberListResponse)
async def list_members(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Get all members of the workspace.
    """
    try:
        members_data = await workspace_service.get_members(workspace_id, current_user.id)
        
        members = []
        for data in members_data:
            members.append(WorkspaceMemberResponse(**data))
        
        return WorkspaceMemberListResponse(
            members=members,
            total=len(members)
        )
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.delete("/{workspace_id}/members/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    workspace_id: UUID,
    member_id: UUID,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Remove a member from the workspace.
    Only owners and admins can remove members.
    """
    try:
        await workspace_service.remove_member(workspace_id, member_id, current_user.id)
    except PermissionError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
