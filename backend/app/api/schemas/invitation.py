from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from typing import Optional

class InvitationCreate(BaseModel):
    email: EmailStr
    role: str = "MEMBER"

class InvitationResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    inviter_id: UUID
    email: str
    role: str
    status: str
    expires_at: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvitationDetails(BaseModel):
    invitation: InvitationResponse
    workspace_name: str
    inviter_name: str
