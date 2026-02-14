
import os
import uuid
from typing import Optional
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.repositories.knowledge_repo import KnowledgeRepository
from app.rag.ingest import IngestionPipeline
from app.db.models.document import Document

class KnowledgeService:
    def __init__(self, session: AsyncSession):
        self.repo = KnowledgeRepository(session)
        self.pipeline = IngestionPipeline()

    async def ingest_file(self, workspace_id: uuid.UUID, collection_id: uuid.UUID, file_path: str, process_embeddings: bool = False, original_filename: str = None):
        """
        Ingests a file: 
        1. Always uploads to Cloudinary + DB.
        2. If process_embeddings=True, process vectors.
        3. Deletes local file.
        """
        try:
             # 1. Upload to Cloudinary First
            from app.services.cloudinary_service import upload_file
            
            # Create a shell document first to get an ID? Or just use a random one?
            # We need an ID for the public_id ideally. 
            # Let's generate a UUID manually for the public_id path if we haven't saved doc yet.
            doc_id = uuid.uuid4()
            
            try:
                upload_result = await upload_file(file_path, public_id=f"workspaces/{workspace_id}/docs/{doc_id}")
                print(f"[DEBUG] Cloudinary Upload Result: {upload_result}")
            except Exception as e:
                print(f"Cloudinary upload failed: {e}")
                raise e
            
            # 2. Extract Title (lazy way: filename)
            # If processing, we might get a better title, but having a record is priority.
            if original_filename:
                title = Path(original_filename).stem
                real_filename = original_filename
            else:
                title = Path(file_path).stem
                real_filename = Path(file_path).name
            
            secure_url = upload_result.get("secure_url")
            # We used to strip signature here, but that causes 404s if the asset is actually private/authenticated.
            # It is safer to store the full signed URL provided by Cloudinary.
            # if secure_url and "/s--" in secure_url:
            #    import re
            #    secure_url = re.sub(r"/s--[^/]+--/", "/", secure_url)

            document = Document(
                id=doc_id,
                workspace_id=workspace_id,
                collection_id=collection_id,
                title=title,
                source_type="file",
                source_url=secure_url,
                file_path=None,
                status="uploaded", # Initial status
                version_number=1,
                meta={
                    "original_filename": real_filename,
                    "cloudinary_public_id": upload_result.get("public_id"),
                },
                language="en"
            )
            
            # Save Document Record
            await self.repo.create_document(document)
            
            # 3. Process Embeddings if requested
            if process_embeddings:
                try:
                    # Pipeline stuff
                    result = await self.pipeline.process_document(file_path)
                    
                    # Update status and save tree
                    document.status = "processed"
                    # If title extraction improved:
                    # document.title = result['title'] 
                    
                    # Save Chunks/Embeddings
                    # Note: save_document_tree expects document to be passed, it might re-add it to session
                    # ensure we attach chunks to this existing doc
                    await self.repo.save_document_tree(document, result['chunks'])
                except Exception as process_error:
                    print(f"Embedding generation failed: {process_error}")
                    # We don't fail the whole request, but leave status as 'uploaded' (or 'error'?)
                    document.status = "error_embedding"
                    await self.repo.session.commit()
                    # Re-raise if we want to inform user processing failed?
                    # User asked: "if direct upload using making agents... make embedding also"
                    # So we should probably raise so they know it failed.
                    raise process_error

            # 4. Cleanup
            if os.path.exists(file_path):
                os.remove(file_path)
                
            return document

        except Exception as e:
            # Clean up local file
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e

    async def process_existing_document(self, document_id: uuid.UUID):
        """
        Process a document that is already in DB/Cloudinary but needs embeddings.
        """
        print(f"[DEBUG] Processing existing document: {document_id}")
        # Fetch document
        stmt = select(Document).where(Document.id == document_id)
        result = await self.repo.session.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document or not document.source_url:
             print(f"[ERROR] Document {document_id} not found or has no source URL")
             raise ValueError("Document not found or has no source URL")
             
        if document.status == "processed":
            print(f"[DEBUG] Document {document_id} already processed")
            return document

        # Download URL
        download_url = document.source_url
        print(f"[DEBUG] Downloading from {download_url}")
        
        # ensure public
        import re
        if "/s--" in download_url:
            download_url = re.sub(r"/s--[^/]+--/", "/", download_url)

        # Download file to temp
        import httpx
        import tempfile
        
        suffix = ".pdf" # Assume PDF
        tmp_path = None
        try:
            # Create temp file
            # We close it immediately so we can write to it in chunks or via httpx
            fd, tmp_path = tempfile.mkstemp(suffix=suffix)
            os.close(fd)
            
            async with httpx.AsyncClient() as client:
                async with client.stream('GET', download_url, follow_redirects=True) as response:
                    if response.status_code != 200:
                         raise ValueError(f"Failed to download document: {response.status_code} from {download_url}")
                    
                    with open(tmp_path, 'wb') as f:
                        async for chunk in response.aiter_bytes():
                            f.write(chunk)
            
            print(f"[DEBUG] Downloaded to {tmp_path}. Processing...")
            
            # Process in pipeline
            result = await self.pipeline.process_document(tmp_path)
            
            # Save chunks
            await self.repo.save_document_tree(document, result['chunks'])
            
            document.status = "processed"
            # document.title = result['title'] # Optional update
            await self.repo.session.commit()
            print(f"[DEBUG] Document {document_id} processed successfully")
            
        except Exception as e:
            print(f"[ERROR] Failed to process document {document_id}: {e}")
            import traceback
            traceback.print_exc()
            document.status = "error_processing"
            # Try to commit the error status so we don't retry endlessly or leave it hanging
            try:
                await self.repo.session.commit()
            except:
                pass 
            raise ValueError(f"Processing failed: {str(e)}")
            
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
                
        return document

    async def get_documents(self, workspace_id: uuid.UUID):
        return await self.repo.get_documents_by_workspace(workspace_id)

    async def delete_document(self, document_id: uuid.UUID):
        from app.services.cloudinary_service import delete_file
        
        # Re-fetch for meta logic
        document = await self.repo.delete_document(document_id)
        
        if document and document.meta and "cloudinary_public_id" in document.meta:
            try:
                delete_file(document.meta["cloudinary_public_id"])
            except Exception as e:
                print(f"Failed to delete from Cloudinary: {e}")
                
        return document
