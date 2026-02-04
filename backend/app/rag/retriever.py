from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.knowledge_repo import KnowledgeRepository
from app.rag.embeddings import EmbeddingService

class Retriever:
    def __init__(self, session: AsyncSession):
        self.embedding_service = EmbeddingService()
        self.knowledge_repo = KnowledgeRepository(session)

    async def retrieve(self, query: str, workspace_id: UUID, limit: int = 5, document_ids: Optional[List[str]] = None) -> List[str]:
        """
        Embeds the query and searches the vector database.
        Returns a list of context strings.
        """
        # 1. Embed Query
        query_embedding = self.embedding_service.embed_query(query)
        
        # 2. Search DB (with filter)
        chunks = await self.knowledge_repo.search_similar_chunks(
            workspace_id=workspace_id, 
            embedding_vector=query_embedding, 
            limit=limit,
            document_ids=document_ids
        )
        
        # 3. Format chunks
        return [chunk.content for chunk in chunks]
