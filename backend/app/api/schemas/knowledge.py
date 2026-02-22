from pydantic import BaseModel, HttpUrl
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

# --- Text Ingestion ---
class TextIngestionRequest(BaseModel):
    workspace_id: UUID
    collection_id: UUID
    title: str
    content: str
    content_type: str = "text"  # "text" | "faq" | "markdown"
    tags: Optional[List[str]] = None

# --- Website Crawl ---
class CrawlRequest(BaseModel):
    workspace_id: UUID
    collection_id: UUID
    url: str
    max_depth: int = 2
    max_pages: int = 50

class CrawlResponse(BaseModel):
    status: str
    message: str

# --- Collections ---
class CollectionCreate(BaseModel):
    workspace_id: UUID
    name: str
    description: Optional[str] = None

class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

class CollectionResponse(BaseModel):
    id: UUID
    workspace_id: UUID
    name: str
    description: Optional[str] = None
    meta: Optional[Dict] = None
    created_at: datetime
    updated_at: datetime
    document_count: Optional[int] = 0
    
    class Config:
        from_attributes = True

# --- Answer Preview / Test Query ---
class TestQueryRequest(BaseModel):
    workspace_id: UUID
    query: str
    collection_id: Optional[UUID] = None
    limit: int = 5

class ChunkResult(BaseModel):
    content: str
    document_title: str
    document_id: UUID
    score: float  # 0-1 similarity score (1 = most similar)

class TestQueryResponse(BaseModel):
    query: str
    results: List[ChunkResult]
    suggested_improvements: Optional[str] = None
