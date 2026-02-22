from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete as sa_delete
from uuid import UUID
from typing import List, Optional, Tuple

from app.db.models.document import Document
from app.db.models.document_chunk import DocumentChunk
from app.db.models.document_version import DocumentVersion
from app.db.models.embedding import Embedding
from app.db.models.knowledge import KnowledgeCollection

class KnowledgeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # ─── Document CRUD ───

    async def create_document(self, document: Document) -> Document:
        self.session.add(document)
        await self.session.commit()
        await self.session.refresh(document)
        return document

    async def create_document_chunk(self, chunk: DocumentChunk) -> DocumentChunk:
        self.session.add(chunk)
        await self.session.commit()
        await self.session.refresh(chunk)
        return chunk
    
    async def create_embedding(self, embedding: Embedding) -> Embedding:
        self.session.add(embedding)
        await self.session.commit()
        await self.session.refresh(embedding)
        return embedding

    async def save_document_tree(self, document: Document, chunks_data: List[dict]):
        """
        Saves the document, chunks, and embeddings hierarchically.
        chunks_data is a list of dicts with keys: 'content', 'embedding', 'chunk_index', 'token_count'
        """
        self.session.add(document)
        await self.session.flush()
        
        for chunk_data in chunks_data:
            chunk = DocumentChunk(
                document_id=document.id,
                workspace_id=document.workspace_id,
                content=chunk_data['content'],
                chunk_index=chunk_data['chunk_index'],
                token_count=chunk_data['token_count'],
                meta=document.meta
            )
            self.session.add(chunk)
            await self.session.flush()
            
            embedding_record = Embedding(
                chunk_id=chunk.id,
                workspace_id=document.workspace_id,
                embedding=chunk_data['embedding'],
                model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
                dimension=384
            )
            self.session.add(embedding_record)
            
        await self.session.commit()
        await self.session.refresh(document)
        return document

    # ─── Document Queries ───

    async def get_documents_by_workspace(self, workspace_id: UUID) -> List[Document]:
        stmt = select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_documents_by_collection(self, collection_id: UUID) -> List[Document]:
        stmt = select(Document).where(Document.collection_id == collection_id).order_by(Document.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
        
    async def delete_document(self, document_id: UUID):
        """Delete a document and all its chunks + embeddings."""
        stmt_doc = select(Document).where(Document.id == document_id)
        result = await self.session.execute(stmt_doc)
        document = result.scalar_one_or_none()
        
        if document:
             # 1. Get all chunk IDs for this document
             chunk_stmt = select(DocumentChunk.id).where(DocumentChunk.document_id == document_id)
             chunk_result = await self.session.execute(chunk_stmt)
             chunk_ids = [row[0] for row in chunk_result.all()]

             # 2. Delete embeddings for those chunks
             if chunk_ids:
                 del_embeddings = sa_delete(Embedding).where(Embedding.chunk_id.in_(chunk_ids))
                 await self.session.execute(del_embeddings)

             # 3. Delete chunks
             del_chunks = sa_delete(DocumentChunk).where(DocumentChunk.document_id == document_id)
             await self.session.execute(del_chunks)

             # 4. Delete document versions
             del_versions = sa_delete(DocumentVersion).where(DocumentVersion.document_id == document_id)
             await self.session.execute(del_versions)

             # 5. Delete the document
             await self.session.delete(document)
             await self.session.commit()
             return document
        return None

    async def move_document_to_collection(self, document_id: UUID, collection_id: UUID):
        """Move a document to a different collection."""
        stmt = select(Document).where(Document.id == document_id)
        result = await self.session.execute(stmt)
        document = result.scalar_one_or_none()
        if not document:
            return None
        document.collection_id = collection_id
        await self.session.commit()
        await self.session.refresh(document)
        return document

    # ─── Collection CRUD ───

    async def get_collection_by_id(self, collection_id: UUID) -> Optional[KnowledgeCollection]:
        stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_collection(self, collection: KnowledgeCollection) -> KnowledgeCollection:
        self.session.add(collection)
        await self.session.commit()
        await self.session.refresh(collection)
        return collection

    async def get_collections_by_workspace(self, workspace_id: UUID) -> List[dict]:
        """Get all collections with document counts."""
        stmt = (
            select(
                KnowledgeCollection,
                func.count(Document.id).label("document_count")
            )
            .outerjoin(Document, Document.collection_id == KnowledgeCollection.id)
            .where(KnowledgeCollection.workspace_id == workspace_id)
            .group_by(KnowledgeCollection.id)
            .order_by(KnowledgeCollection.created_at.desc())
        )
        result = await self.session.execute(stmt)
        rows = result.all()
        
        collections = []
        for collection, doc_count in rows:
            collections.append({
                "id": collection.id,
                "workspace_id": collection.workspace_id,
                "name": collection.name,
                "description": collection.description,
                "meta": collection.meta,
                "created_at": collection.created_at,
                "updated_at": collection.updated_at,
                "document_count": doc_count,
            })
        return collections

    async def update_collection(self, collection_id: UUID, data: dict) -> Optional[KnowledgeCollection]:
        stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
        result = await self.session.execute(stmt)
        collection = result.scalar_one_or_none()
        
        if not collection:
            return None
        
        if "name" in data and data["name"]:
            collection.name = data["name"]
        if "description" in data:
            collection.description = data["description"]
        
        await self.session.commit()
        await self.session.refresh(collection)
        return collection

    async def delete_collection(self, collection_id: UUID) -> bool:
        """Delete a collection and all its documents."""
        stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
        result = await self.session.execute(stmt)
        collection = result.scalar_one_or_none()
        
        if not collection:
            return False
        
        # Delete all documents in this collection (cascade will handle chunks/embeddings)
        docs_stmt = select(Document).where(Document.collection_id == collection_id)
        docs_result = await self.session.execute(docs_stmt)
        docs = docs_result.scalars().all()
        for doc in docs:
            await self.session.delete(doc)
        
        await self.session.delete(collection)
        await self.session.commit()
        return True

    # ─── Vector Search ───

    async def search_similar_chunks(
        self, 
        workspace_id: UUID, 
        embedding_vector: List[float], 
        limit: int = 5,
        document_ids: Optional[List[str]] = None,
        collection_id: Optional[UUID] = None,
    ):
        """
        Search for similar chunks using cosine distance.
        Returns DocumentChunk objects ordered by similarity.
        """
        stmt = select(DocumentChunk).join(Embedding, DocumentChunk.id == Embedding.chunk_id)\
            .where(
                Embedding.workspace_id == workspace_id
            )

        if document_ids:
             try:
                uuids = [UUID(did) if isinstance(did, str) else did for did in document_ids]
                stmt = stmt.where(DocumentChunk.document_id.in_(uuids))
             except ValueError:
                pass

        if collection_id:
            stmt = stmt.join(Document, DocumentChunk.document_id == Document.id)\
                .where(Document.collection_id == collection_id)

        stmt = stmt.order_by(Embedding.embedding.cosine_distance(embedding_vector))\
            .limit(limit)

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def search_similar_chunks_with_scores(
        self,
        workspace_id: UUID,
        embedding_vector: List[float],
        limit: int = 5,
        collection_id: Optional[UUID] = None,
    ) -> List[Tuple]:
        """
        Search for similar chunks and return with similarity scores and document titles.
        Returns list of (chunk_content, document_title, document_id, similarity_score).
        """
        distance_expr = Embedding.embedding.cosine_distance(embedding_vector)
        
        stmt = (
            select(
                DocumentChunk.content,
                Document.title,
                Document.id.label("document_id"),
                (1 - distance_expr).label("similarity")
            )
            .join(Embedding, DocumentChunk.id == Embedding.chunk_id)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(Embedding.workspace_id == workspace_id)
        )

        if collection_id:
            stmt = stmt.where(Document.collection_id == collection_id)

        stmt = stmt.order_by(distance_expr).limit(limit)

        result = await self.session.execute(stmt)
        return result.all()
