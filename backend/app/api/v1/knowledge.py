from typing import List, Optional
from uuid import UUID
import shutil
import tempfile
import os
import asyncio

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, BackgroundTasks, status
from app.api import deps
from app.db.models.user import User
from app.db.models.knowledge import KnowledgeCollection
from app.services.knowledge_service import KnowledgeService
from app.api.schemas.knowledge import (
    DocumentResponse, 
    TextIngestionRequest, 
    CrawlRequest, CrawlResponse,
    CollectionCreate, CollectionUpdate, CollectionResponse,
    TestQueryRequest, TestQueryResponse, ChunkResult,
)
from app.rag.ingest import SUPPORTED_EXTENSIONS
from app.services.plan_limits import (
    check_document_limit, check_storage_limit,
    check_web_page_limit, PlanLimitExceeded,
)
import datetime

router = APIRouter()

# ─── Allowed file extensions and MIME types ───
ALLOWED_MIMES = {
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/csv',
    'text/markdown',
    'application/octet-stream',  # Fallback for .md, .csv etc.
}


# ═══════════════════════════════════════════════
#  FILE UPLOAD
# ═══════════════════════════════════════════════

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    workspace_id: UUID = Form(...),
    collection_id: UUID = Form(...),
    file: UploadFile = File(...),
    process: bool = Form(False),
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    Upload a file to be ingested into the knowledge base.
    Supports: PDF, DOCX, TXT, CSV, MD
    """
    print(f"[DEBUG] Uploading file: {file.filename}")
    
    # Validate by extension (more reliable than MIME for .md, .csv)
    if file.filename:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported file type: {ext}. Supported: {', '.join(SUPPORTED_EXTENSIONS)}"
            )
    else:
        # Fallback: check MIME type
        if file.content_type not in ALLOWED_MIMES:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {file.content_type}")

    # Determine suffix from filename
    suffix = os.path.splitext(file.filename)[1].lower() if file.filename else ".pdf"
    
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd)
    
    print(f"[DEBUG] Saving locally to {tmp_path}")
    try:
        def save_file_sync(in_file, out_path):
             in_file.seek(0)
             with open(out_path, 'wb') as out_f:
                 shutil.copyfileobj(in_file, out_f)
        
        await asyncio.to_thread(save_file_sync, file.file, tmp_path)
        print(f"[DEBUG] Local save complete")
    except Exception as e:
         print(f"[ERROR] Local save failed: {e}")
         if os.path.exists(tmp_path):
             os.remove(tmp_path)
         raise HTTPException(status_code=500, detail=f"Failed to save file locally: {e}")

    # Check file size (10MB limit)
    file_size = os.path.getsize(tmp_path)
    print(f"[DEBUG] File size: {file_size} bytes")
    if file_size > 10 * 1024 * 1024:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(
            status_code=413, 
            detail=f"File too large ({file_size / (1024*1024):.2f}MB). Maximum allowed size is 10MB."
        )

    try:
        print(f"[DEBUG] Starting ingestion for workspace {workspace_id}")
        
        # ── Plan limit: check document and storage limits ──
        try:
            await check_document_limit(service.repo.session, workspace_id)
            await check_storage_limit(service.repo.session, workspace_id, file_size)
        except PlanLimitExceeded as e:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
            raise HTTPException(status_code=403, detail=e.message)
        
        document = await service.ingest_file(workspace_id, collection_id, tmp_path, process_embeddings=process, original_filename=file.filename)
        print(f"[DEBUG] Ingestion successful. Document ID: {document.id}")
        return document
    except Exception as e:
        print(f"[ERROR] Ingestion failed: {e}")
        import traceback
        traceback.print_exc()
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")


# ═══════════════════════════════════════════════
#  MANUAL TEXT ENTRY
# ═══════════════════════════════════════════════

@router.post("/text", response_model=DocumentResponse)
async def ingest_text(
    request: TextIngestionRequest,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    Ingest manually entered text, markdown, or FAQ content.
    """
    if not request.content or len(request.content.strip()) < 10:
        raise HTTPException(status_code=400, detail="Content must be at least 10 characters long.")
    
    try:
        # ── Plan limit: check document limit ──
        try:
            await check_document_limit(service.repo.session, request.workspace_id)
        except PlanLimitExceeded as e:
            raise HTTPException(status_code=403, detail=e.message)
        
        document = await service.ingest_text(
            workspace_id=request.workspace_id,
            collection_id=request.collection_id,
            title=request.title,
            content=request.content,
            content_type=request.content_type,
            tags=request.tags,
        )
        return document
    except Exception as e:
        print(f"[ERROR] Text ingestion failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to process text: {str(e)}")


# ═══════════════════════════════════════════════
#  WEBSITE CRAWL
# ═══════════════════════════════════════════════

async def _run_crawl(workspace_id: UUID, collection_id: UUID, url: str, max_depth: int, max_pages: int):
    """Background task for website crawling."""
    from app.db.session import AsyncSessionLocal
    from app.services.knowledge_service import KnowledgeService
    
    async with AsyncSessionLocal() as session:
        try:
            service = KnowledgeService(session)
            await service.crawl_website(workspace_id, collection_id, url, max_depth, max_pages)
            print(f"[CRAWL] Completed: {url}")
        except Exception as e:
            print(f"[CRAWL] Failed: {url} - {e}")

@router.post("/crawl", response_model=CrawlResponse)
async def crawl_website(
    request: CrawlRequest,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    Start crawling a website. Runs in the background.
    Returns immediately with status.
    """
    if not request.url or not request.url.startswith(('http://', 'https://')):
        raise HTTPException(status_code=400, detail="Please provide a valid URL starting with http:// or https://")
    
    # Pre-check if the URL is accessible and not blocking us
    import httpx
    try:
        async with httpx.AsyncClient(
            timeout=5.0,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
        ) as client:
            response = await client.get(request.url)
            if response.status_code in (401, 403):
                raise HTTPException(status_code=403, detail=f"We don't have permission to crawl {request.url}. The website is actively blocking automated access (403 Forbidden).")
            # If it's a 404, we can also fail early
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail=f"The URL {request.url} was not found (404).")
    except httpx.RequestError:
        raise HTTPException(status_code=400, detail=f"Failed to connect to {request.url}. Please ensure the URL is correct and publicly accessible.")
    
    # Clamp limits
    max_depth = min(max(1, request.max_depth), 5)
    max_pages = min(max(1, request.max_pages), 100)
    
    # ── Plan limit: check web page crawl limit ──
    try:
        remaining = await check_web_page_limit(service.repo.session, request.workspace_id, max_pages)
        if remaining != -1:
            max_pages = min(max_pages, remaining)  # Cap to remaining allowance
    except PlanLimitExceeded as e:
        raise HTTPException(status_code=403, detail=e.message)
    
    # Auto-create collection to group crawled pages
    from urllib.parse import urlparse
    import uuid
    from app.db.models.knowledge import KnowledgeCollection
    
    collection_id = request.collection_id
    default_uuid = uuid.UUID("00000000-0000-0000-0000-000000000000")
    
    if not collection_id or collection_id == default_uuid:
        domain = urlparse(request.url).netloc
        now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M")
        new_col = KnowledgeCollection(
            id=uuid.uuid4(),
            workspace_id=request.workspace_id,
            name=f"{domain} Crawl",
            description=f"Auto-generated collection for crawl of {request.url} on {now_str}",
            meta={}
        )
        await service.repo.create_collection(new_col)
        collection_id = new_col.id
    
    background_tasks.add_task(_run_crawl, request.workspace_id, collection_id, request.url, max_depth, max_pages)
    
    return CrawlResponse(
        status="crawling",
        message=f"Crawl started for {request.url}. Pages will be grouped in a collection."
    )


# ═══════════════════════════════════════════════
#  DOCUMENT LIST & DELETE
# ═══════════════════════════════════════════════

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    workspace_id: UUID,
    collection_id: Optional[UUID] = Query(None),
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """List all documents in a workspace, optionally filtered by collection."""
    return await service.get_documents(workspace_id, collection_id=collection_id)

@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Delete a document."""
    try:
        result = await service.delete_document(document_id)
        if not result:
             raise HTTPException(status_code=404, detail="Document not found")
        return {"status": "success", "id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{document_id}/process", response_model=DocumentResponse)
async def process_document(
    document_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Process/re-process embeddings for an existing document."""
    try:
        document = await service.process_existing_document(document_id)
        return document
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{document_id}/collection/{collection_id}", response_model=DocumentResponse)
async def move_document_to_collection(
    document_id: UUID,
    collection_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Move a document to a different collection."""
    result = await service.repo.move_document_to_collection(document_id, collection_id)
    if not result:
        raise HTTPException(status_code=404, detail="Document not found")
    return result


# ═══════════════════════════════════════════════
#  COLLECTIONS
# ═══════════════════════════════════════════════

@router.post("/collections", response_model=CollectionResponse)
async def create_collection(
    request: CollectionCreate,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Create a new knowledge collection."""
    collection = KnowledgeCollection(
        workspace_id=request.workspace_id,
        name=request.name,
        description=request.description,
    )
    created = await service.repo.create_collection(collection)
    return CollectionResponse(
        id=created.id,
        workspace_id=created.workspace_id,
        name=created.name,
        description=created.description,
        meta=created.meta,
        created_at=created.created_at,
        updated_at=created.updated_at,
        document_count=0,
    )

@router.get("/collections", response_model=List[CollectionResponse])
async def list_collections(
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """List all collections in a workspace with document counts."""
    collections = await service.repo.get_collections_by_workspace(workspace_id)
    return [CollectionResponse(**c) for c in collections]

@router.put("/collections/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: UUID,
    request: CollectionUpdate,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Update a collection's name or description."""
    updated = await service.repo.update_collection(collection_id, request.model_dump(exclude_none=True))
    if not updated:
        raise HTTPException(status_code=404, detail="Collection not found")
    # Get doc count
    docs = await service.repo.get_documents_by_collection(collection_id)
    return CollectionResponse(
        id=updated.id,
        workspace_id=updated.workspace_id,
        name=updated.name,
        description=updated.description,
        meta=updated.meta,
        created_at=updated.created_at,
        updated_at=updated.updated_at,
        document_count=len(docs),
    )

@router.delete("/collections/{collection_id}")
async def delete_collection(
    collection_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """Delete a collection and all its documents."""
    success = await service.repo.delete_collection(collection_id)
    if not success:
        raise HTTPException(status_code=404, detail="Collection not found")
    return {"status": "success", "id": collection_id}


# ═══════════════════════════════════════════════
#  ANSWER PREVIEW / TEST QUERY
# ═══════════════════════════════════════════════

@router.post("/test-query", response_model=TestQueryResponse)
async def test_query(
    request: TestQueryRequest,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    Test a query against the knowledge base.
    Returns matching chunks with relevance scores for answer preview.
    """
    from app.rag.embeddings import EmbeddingService
    
    embedding_service = EmbeddingService()
    query_embedding = embedding_service.embed_query(request.query)
    
    rows = await service.repo.search_similar_chunks_with_scores(
        workspace_id=request.workspace_id,
        embedding_vector=query_embedding,
        limit=request.limit,
        collection_id=request.collection_id,
    )
    
    results = []
    context_texts = []
    for content, doc_title, doc_id, similarity in rows:
        score = max(0.0, min(1.0, float(similarity)))
        results.append(ChunkResult(
            content=content,
            document_title=doc_title,
            document_id=doc_id,
            score=round(score, 4),
        ))
        context_texts.append(f"Source Document: {doc_title}\nContent:\n{content}")
    
    suggested_improvements = None
    if results:
        from app.services.llm_service import LLMService
        llm = LLMService()
        
        context_str = "\n\n---\n\n".join(context_texts)
        prompt = f"""
        You are a knowledge base optimization assistant.
        The user asked the following query: "{request.query}"
        
        Here are the retrieved chunks from the knowledge base:
        {context_str}
        
        Your task is to analyze these retrieved chunks against the query and provide a short, actionable suggestion (1-3 sentences) on how the user could improve their knowledge base. 
        For example:
        - If the chunks are totally irrelevant, recommend adding documents specifically about the topic.
        - If the chunks are somewhat relevant but missing key details, point out the missing details.
        - If they are highly relevant, just say "The retrieved context looks highly relevant and sufficient to answer this query."
        
        Provide ONLY the suggestion text, nothing else.
        """
        try:
            suggested_improvements = await llm.generate(prompt, temperature=0.2)
            suggested_improvements = suggested_improvements.strip()
        except Exception as e:
            print(f"Error generating improvements: {e}")
            suggested_improvements = "Could not generate suggestions at this time."
    else:
        suggested_improvements = "No context was retrieved. You should add documents covering this topic to your knowledge base."

    return TestQueryResponse(
        query=request.query, 
        results=results,
        suggested_improvements=suggested_improvements
    )
