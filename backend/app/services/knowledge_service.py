
import os
import uuid
import hashlib
from typing import Optional, List
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.db.repositories.knowledge_repo import KnowledgeRepository
from app.rag.ingest import IngestionPipeline
from app.db.models.document import Document

# Metadata extraction helpers
def detect_language(text: str) -> str:
    """Detect the language of a text string."""
    try:
        from langdetect import detect
        return detect(text[:5000])  # Only check the first 5000 chars for speed
    except Exception:
        return "en"

def extract_keywords(text: str, top_n: int = 5) -> List[str]:
    """Extract top keywords from text using YAKE."""
    try:
        import yake
        kw_extractor = yake.KeywordExtractor(lan="en", n=2, top=top_n, features=None)
        keywords = kw_extractor.extract_keywords(text[:10000])
        return [kw[0] for kw in keywords]
    except Exception:
        return []

def get_source_type_from_extension(file_path: str) -> str:
    """Determine source_type from file extension."""
    ext = Path(file_path).suffix.lower()
    type_map = {
        '.pdf': 'pdf',
        '.docx': 'docx',
        '.txt': 'text',
        '.md': 'markdown',
        '.csv': 'csv',
    }
    return type_map.get(ext, 'file')


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
            
            doc_id = uuid.uuid4()
            
            try:
                upload_result = await upload_file(file_path, public_id=f"workspaces/{workspace_id}/docs/{doc_id}")
                print(f"[DEBUG] Cloudinary Upload Result: {upload_result}")
            except Exception as e:
                print(f"Cloudinary upload failed: {e}")
                raise e
            
            # 2. Extract Title and determine source type
            if original_filename:
                title = Path(original_filename).stem
                real_filename = original_filename
            else:
                title = Path(file_path).stem
                real_filename = Path(file_path).name
            
            source_type = get_source_type_from_extension(real_filename)
            
            secure_url = upload_result.get("secure_url")

            # 3. Extract text for metadata (do this before saving for language/tags)
            extracted_text = ""
            try:
                extracted_text = self.pipeline._extract_text(file_path)
            except Exception:
                pass  # If extraction fails here, we still want to save the doc

            # Metadata enrichment
            lang = detect_language(extracted_text) if extracted_text else "en"
            tags = extract_keywords(extracted_text) if extracted_text else []
            file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

            document = Document(
                id=doc_id,
                workspace_id=workspace_id,
                collection_id=collection_id,
                title=title,
                source_type=source_type,
                source_url=secure_url,
                file_path=None,
                status="uploaded",
                version_number=1,
                meta={
                    "original_filename": real_filename,
                    "cloudinary_public_id": upload_result.get("public_id"),
                    "tags": tags,
                    "file_size": file_size,
                },
                language=lang
            )
            
            # Save Document Record
            await self.repo.create_document(document)
            
            # 4. Process Embeddings if requested
            if process_embeddings:
                try:
                    result = await self.pipeline.process_document(file_path)
                    document.status = "processed"
                    await self.repo.save_document_tree(document, result['chunks'])
                except Exception as process_error:
                    print(f"Embedding generation failed: {process_error}")
                    document.status = "error_embedding"
                    await self.repo.session.commit()
                    raise process_error

            # 5. Cleanup
            if os.path.exists(file_path):
                os.remove(file_path)
                
            return document

        except Exception as e:
            # Clean up local file
            if os.path.exists(file_path):
                os.remove(file_path)
            raise e

    async def ingest_text(self, workspace_id: uuid.UUID, collection_id: uuid.UUID, title: str, content: str, content_type: str = "text", tags: Optional[List[str]] = None):
        """
        Ingest manually entered text content.
        For FAQ content_type: splits by Q/A pattern, each pair becomes its own chunk.
        """
        doc_id = uuid.uuid4()
        
        # Detect language
        lang = detect_language(content)
        
        # Auto-tags if not provided
        auto_tags = extract_keywords(content) if not tags else tags
        
        document = Document(
            id=doc_id,
            workspace_id=workspace_id,
            collection_id=collection_id,
            title=title,
            source_type="manual_text",
            source_url=None,
            file_path=None,
            status="processing",
            version_number=1,
            meta={
                "content_type": content_type,
                "tags": auto_tags,
                "content_preview": content[:500],
            },
            language=lang
        )
        
        await self.repo.create_document(document)
        
        try:
            result = await self.pipeline.process_text(content, title)
            document.status = "processed"
            await self.repo.save_document_tree(document, result['chunks'])
        except Exception as e:
            print(f"Text ingestion failed: {e}")
            document.status = "error_processing"
            await self.repo.session.commit()
            raise e
        
        return document

    async def crawl_website(self, workspace_id: uuid.UUID, collection_id: uuid.UUID, url: str, max_depth: int = 2, max_pages: int = 50):
        """
        Crawl a website and ingest each page as a separate document.
        Runs as an async task.
        """
        from app.rag.crawler import WebCrawler
        
        crawler = WebCrawler()
        documents_created = []
        pages_yielded = 0
        
        try:
            async for page_url, page_text in crawler.crawl(url, max_depth=max_depth, max_pages=max_pages):
                pages_yielded += 1
                print(f"[CRAWL DEBUG] Yielded page: {page_url} (len: {len(page_text) if page_text else 0})")
                if not page_text or len(page_text.strip()) < 50:
                    print(f"[CRAWL DEBUG] Skipping page {page_url} (too short)")
                    continue  # Skip pages with too little content
                
                doc_id = uuid.uuid4()
                title = page_url.split('/')[-1] or page_url.split('/')[-2] or "Web Page"
                title = title.replace('-', ' ').replace('_', ' ').title()
                if not title or title == '/':
                    title = f"Page from {url}"
                
                lang = detect_language(page_text)
                tags = extract_keywords(page_text)
                
                print(f"[CRAWL DEBUG] Creating document for {title}...")
                
                document = Document(
                    id=doc_id,
                    workspace_id=workspace_id,
                    collection_id=collection_id,
                    title=title,
                    source_type="web",
                    source_url=page_url,
                    file_path=None,
                    status="processing",
                    version_number=1,
                    meta={
                        "tags": tags,
                        "crawl_source": url,
                        "content_hash": hashlib.md5(page_text.encode()).hexdigest(),
                    },
                    language=lang
                )
                
                await self.repo.create_document(document)
                
                try:
                    result = await self.pipeline.process_text(page_text, title)
                    document.status = "processed"
                    await self.repo.save_document_tree(document, result['chunks'])
                    documents_created.append(document)
                except Exception as e:
                    print(f"Failed to process page {page_url}: {e}")
                    document.status = "error_processing"
                    await self.repo.session.commit()
                    
        except Exception as e:
            print(f"Crawl failed: {e}")
            raise e
        
        return documents_created

    async def process_existing_document(self, document_id: uuid.UUID):
        """
        Process a document that is already in DB/Cloudinary but needs embeddings.
        """
        print(f"[DEBUG] Processing existing document: {document_id}")
        stmt = select(Document).where(Document.id == document_id)
        result = await self.repo.session.execute(stmt)
        document = result.scalar_one_or_none()
        
        if not document or not document.source_url:
             print(f"[ERROR] Document {document_id} not found or has no source URL")
             raise ValueError("Document not found or has no source URL")
             
        if document.status == "processed":
            print(f"[DEBUG] Document {document_id} already processed")
            return document

        download_url = document.source_url
        print(f"[DEBUG] Downloading from {download_url}")
        
        import re
        if "/s--" in download_url:
            download_url = re.sub(r"/s--[^/]+--/", "/", download_url)

        import httpx
        import tempfile
        
        # Determine file suffix from original filename
        suffix = ".pdf"
        if document.meta and "original_filename" in document.meta:
            orig = document.meta["original_filename"]
            ext = Path(orig).suffix.lower()
            if ext:
                suffix = ext
        
        tmp_path = None
        try:
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
            
            result = await self.pipeline.process_document(tmp_path)
            await self.repo.save_document_tree(document, result['chunks'])
            
            document.status = "processed"
            await self.repo.session.commit()
            print(f"[DEBUG] Document {document_id} processed successfully")
            
        except Exception as e:
            print(f"[ERROR] Failed to process document {document_id}: {e}")
            import traceback
            traceback.print_exc()
            document.status = "error_processing"
            try:
                await self.repo.session.commit()
            except:
                pass 
            raise ValueError(f"Processing failed: {str(e)}")
            
        finally:
            if tmp_path and os.path.exists(tmp_path):
                os.remove(tmp_path)
                
        return document

    async def get_documents(self, workspace_id: uuid.UUID, collection_id: uuid.UUID = None):
        if collection_id:
            return await self.repo.get_documents_by_collection(collection_id)
        return await self.repo.get_documents_by_workspace(workspace_id)

    async def delete_document(self, document_id: uuid.UUID):
        from app.services.cloudinary_service import delete_file
        
        document = await self.repo.delete_document(document_id)
        
        if document and document.meta and "cloudinary_public_id" in document.meta:
            try:
                delete_file(document.meta["cloudinary_public_id"])
            except Exception as e:
                print(f"Failed to delete from Cloudinary: {e}")
                
        return document
