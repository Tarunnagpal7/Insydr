from typing import List
from uuid import UUID
import shutil
import tempfile
import os
import asyncio

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from app.api import deps
from app.db.models.user import User
from app.services.knowledge_service import KnowledgeService
from app.api.schemas.knowledge import DocumentResponse

router = APIRouter()

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
    Upload a PDF file to be ingested into the knowledge base.
    The file is saved temporarily, processed, and then deleted.
    """
    # Verify user has access to workspace (TODO: Add proper permission check)
    print(f"[DEBUG] Uploading file: {file.filename}")
    
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Save to temp file
    # We use a temp directory to avoid conflicts
    suffix = ".pdf"
    
    # Create temp file descriptor
    fd, tmp_path = tempfile.mkstemp(suffix=suffix)
    os.close(fd) # Close it so we can open it in the thread
    
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

    # Check file size (Cloudinary Free Tier limit is 10MB)
    file_size = os.path.getsize(tmp_path)
    print(f"[DEBUG] File size: {file_size} bytes")
    if file_size > 10 * 1024 * 1024:  # 10MB
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(
            status_code=413, 
            detail=f"File too large ({file_size / (1024*1024):.2f}MB). Maximum allowed size is 10MB."
        )

    try:
        # Ingest
        print(f"[DEBUG] Starting ingestion for workspace {workspace_id}")
        document = await service.ingest_file(workspace_id, collection_id, tmp_path, process_embeddings=process, original_filename=file.filename)
        print(f"[DEBUG] Ingestion successful. Document ID: {document.id}")
        return document
    except Exception as e:
        print(f"[ERROR] Ingestion failed: {e}")
        import traceback
        traceback.print_exc()
        # Clean up if service failed to do so (service attempts cleanup but good to be safe)
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@router.get("/", response_model=List[DocumentResponse])
async def list_documents(
    workspace_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    List all documents in a workspace.
    """
    return await service.get_documents(workspace_id)

@router.delete("/{document_id}")
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    service: KnowledgeService = Depends(deps.get_knowledge_service),
):
    """
    Delete a document.
    """
    try:
        result = await service.delete_document(document_id)
        if not result:
             raise HTTPException(status_code=404, detail="Document not found")
        return {"status": "success", "id": document_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
