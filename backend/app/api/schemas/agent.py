from pydantic import BaseModel
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    agent_type: str = "custom"
    configuration: Optional[Dict] = {}
    behavior_settings: Optional[Dict] = {}

class AgentCreate(AgentBase):
    document_ids: Optional[list[UUID]] = []

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    configuration: Optional[Dict] = None
    behavior_settings: Optional[Dict] = None
    status: Optional[str] = None

class AgentResponse(AgentBase):
    id: UUID
    workspace_id: UUID
    status: str
    version: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    agent_id: UUID

class ChatResponse(BaseModel):
    response: str
