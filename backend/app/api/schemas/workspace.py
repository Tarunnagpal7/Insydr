from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    timezone: str = Field(default="UTC")
    settings: Optional[dict] = Field(default_factory=dict)

    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Workspace name cannot be empty')
        return v.strip()


class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    logo_url: Optional[str] = None
    timezone: Optional[str] = None
    settings: Optional[dict] = None

    @validator('name')
    def validate_name(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Workspace name cannot be empty')
        return v.strip() if v else None


class WorkspaceResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    logo_url: Optional[str]
    timezone: str
    subscription_tier: str
    owner_id: UUID
    settings: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class WorkspaceWithStats(WorkspaceResponse):
    stats: dict = Field(default_factory=dict)
    role: str = "OWNER"


class WorkspaceListResponse(BaseModel):
    workspaces: List[WorkspaceWithStats]
    total: int


class WorkspaceMemberAdd(BaseModel):
    email: str = Field(..., pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
    role: str = Field(default="MEMBER")

    @validator('role')
    def validate_role(cls, v):
        allowed_roles = ['ADMIN', 'MEMBER', 'VIEWER']
        if v not in allowed_roles:
            raise ValueError(f'Role must be one of {allowed_roles}')
        return v


class WorkspaceMemberResponse(BaseModel):
    id: UUID
    user_id: UUID
    workspace_id: UUID
    role: str
    joined_at: datetime
    user_email: Optional[str] = None
    user_name: Optional[str] = None

    class Config:
        from_attributes = True


class WorkspaceMemberListResponse(BaseModel):
    members: List[WorkspaceMemberResponse]
    total: int
