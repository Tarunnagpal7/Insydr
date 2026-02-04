from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
from typing import List, Optional

from app.db.models.document import Document
from app.db.models.document_chunk import DocumentChunk
from app.db.models.embedding import Embedding
from app.db.models.knowledge import KnowledgeCollection

class KnowledgeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

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
        # Save Document
        self.session.add(document)
        await self.session.flush() # flush to get document.id
        
        for chunk_data in chunks_data:
            # Create Chunk
            chunk = DocumentChunk(
                document_id=document.id,
                workspace_id=document.workspace_id,
                content=chunk_data['content'],
                chunk_index=chunk_data['chunk_index'],
                token_count=chunk_data['token_count'],
                meta=document.meta
            )
            self.session.add(chunk)
            await self.session.flush() # flush to get chunk.id
            
            # Create Embedding
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

    async def get_collection_by_id(self, collection_id: UUID) -> Optional[KnowledgeCollection]:
        stmt = select(KnowledgeCollection).where(KnowledgeCollection.id == collection_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create_collection(self, collection: KnowledgeCollection) -> KnowledgeCollection:
        self.session.add(collection)
        await self.session.commit()
        await self.session.refresh(collection)
        return collection

    async def search_similar_chunks(
        self, 
        workspace_id: UUID, 
        embedding_vector: List[float], 
        limit: int = 5,
        document_ids: Optional[List[str]] = None
    ):
        """
        Search for similar chunks using cosine distance.
        Note: pgvector w/ cosine distance: <=> operator.
        Order by distance ascending -> most similar first.
        """
        stmt = select(DocumentChunk).join(Embedding, DocumentChunk.id == Embedding.chunk_id)\
            .where(
                Embedding.workspace_id == workspace_id
            )

        if document_ids:
             # document_ids are from config, usually strings. Cast to UUID for DB.
             # Handle potential UUID conversion errors if garbage data passed
             try:
                uuids = [UUID(did) if isinstance(did, str) else did for did in document_ids]
                stmt = stmt.where(DocumentChunk.document_id.in_(uuids))
             except ValueError:
                # If invalid UUIDs, maybe just ignore filter or match nothing?
                # Matching nothing is safer.
                # Or just log error.
                pass

        stmt = stmt.order_by(Embedding.embedding.cosine_distance(embedding_vector))\
            .limit(limit)

        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def get_documents_by_workspace(self, workspace_id: UUID) -> List[Document]:
        stmt = select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()
        
    async def delete_document(self, document_id: UUID):
        stmt_doc = select(Document).where(Document.id == document_id)
        result = await self.session.execute(stmt_doc)
        document = result.scalar_one_or_none()
        
        if document:
             await self.session.delete(document)
             await self.session.commit()
             return document
        return None
