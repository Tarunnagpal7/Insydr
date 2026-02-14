from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_workspace_service, get_current_user
from app.services.workspace_service import WorkspaceService
from app.api.schemas.invitation import InvitationDetails
from app.api.schemas.workspace import WorkspaceMemberResponse
from app.db.models.user import User

router = APIRouter(prefix="/invitations", tags=["Invitations"])

@router.get("/{token}", response_model=InvitationDetails)
async def get_invitation(
    token: str,
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Get invitation details. Public endpoint.
    """
    try:
        data = await workspace_service.get_invitation(token)
        return InvitationDetails(
            invitation=data["invitation"],
            workspace_name=data["workspace"].name,
            inviter_name=data["inviter"].full_name
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/{token}/accept", response_model=WorkspaceMemberResponse, status_code=status.HTTP_201_CREATED)
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user),
    workspace_service: WorkspaceService = Depends(get_workspace_service)
):
    """
    Accept an invitation.
    Requires authentication.
    """
    try:
        member = await workspace_service.accept_invitation(token, current_user.id)
        return WorkspaceMemberResponse.model_validate(member)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
