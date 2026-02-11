from pydantic import BaseModel
from typing import Optional, Dict, List
from uuid import UUID
from datetime import datetime

class DocumentBase(BaseModel):
    title: str
    source_type: str
    source_url: Optional[str] = None
    status: str
    language: Optional[str] = None
    meta: Optional[Dict] = None

class DocumentResponse(DocumentBase):
    id: UUID
    workspace_id: UUID
    collection_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
