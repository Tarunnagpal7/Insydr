from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from app.api.deps import get_current_user, get_api_key_service
from app.api.schemas.api_key import ApiKeyCreate, ApiKeyUpdate, ApiKeyResponse, ApiKeyGenerated
from app.db.models.user import User
from app.services.api_key_service import ApiKeyService

router = APIRouter()

@router.post("/workspaces/{workspace_id}/api-keys", response_model=ApiKeyGenerated)
async def create_api_key(
    workspace_id: UUID,
    payload: ApiKeyCreate,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Create a new API key for the workspace."""
    try:
        api_key, full_key = await service.create_api_key(
            workspace_id=workspace_id,
            user_id=current_user.id,
            name=payload.name,
            allowed_domains=payload.allowed_domains
        )
        
        # Convert to response model (exclude full_key initially)
        base_response = ApiKeyResponse.model_validate(api_key)
        
        # Create final response with full_key
        response = ApiKeyGenerated(
            **base_response.model_dump(),
            full_key=full_key
        )
        return response
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.get("/workspaces/{workspace_id}/api-keys", response_model=List[ApiKeyResponse])
async def list_api_keys(
    workspace_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """List API keys for the workspace."""
    try:
        return await service.get_workspace_keys(
            workspace_id=workspace_id,
            user_id=current_user.id
        )
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.patch("/workspaces/{workspace_id}/api-keys/{key_id}", response_model=ApiKeyResponse)
async def update_api_key(
    workspace_id: UUID,
    key_id: UUID,
    payload: ApiKeyUpdate,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Update an API key."""
    try:
        return await service.update_api_key(
            workspace_id=workspace_id,
            key_id=key_id,
            user_id=current_user.id,
            name=payload.name,
            allowed_domains=payload.allowed_domains,
            is_active=payload.is_active
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))

@router.delete("/workspaces/{workspace_id}/api-keys/{key_id}")
async def revoke_api_key(
    workspace_id: UUID,
    key_id: UUID,
    current_user: User = Depends(get_current_user),
    service: ApiKeyService = Depends(get_api_key_service)
):
    """Revoke (delete) an API key."""
    try:
        await service.revoke_api_key(
            workspace_id=workspace_id,
            key_id=key_id,
            user_id=current_user.id
        )
        return {"status": "success", "message": "API key revoked"}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
