from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class ApiKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    allowed_domains: List[str] = []

class ApiKeyUpdate(BaseModel):
    name: Optional[str] = None
    allowed_domains: Optional[List[str]] = None
    is_active: Optional[bool] = None

class ApiKeyResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    key_prefix: str
    allowed_domains: Optional[List[str]]
    is_active: bool
    requests_count: int
    last_used_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class ApiKeyGenerated(ApiKeyResponse):
    full_key: str  # Only returned once upon creation
