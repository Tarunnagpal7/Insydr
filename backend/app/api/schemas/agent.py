from pydantic import BaseModel
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime

class AgentBase(BaseModel):
    name: str
    description: Optional[str] = None
    agent_type: str = "custom"
    configuration: Optional[Dict] = {}
    behavior_settings: Optional[Dict] = {}
    response_config: Optional[Dict] = {}
    conversation_rules: Optional[Dict] = {}
    allowed_domains: Optional[List[str]] = []  # Domains allowed to embed this widget

class AgentCreate(AgentBase):
    document_ids: Optional[list[UUID]] = []

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    configuration: Optional[Dict] = None
    behavior_settings: Optional[Dict] = None
    response_config: Optional[Dict] = None
    conversation_rules: Optional[Dict] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    allowed_domains: Optional[List[str]] = None

class AgentResponse(AgentBase):
    id: UUID
    workspace_id: UUID
    status: str
    is_active: bool = True
    version: str
    avatar_url: Optional[str] = None
    allowed_domains: Optional[List[str]] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ChatRequest(BaseModel):
    message: str
    agent_id: UUID

class ChatResponse(BaseModel):
    response: str
