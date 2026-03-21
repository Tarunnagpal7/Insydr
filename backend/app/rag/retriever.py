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

    async def retrieve_with_sources(self, query: str, workspace_id: UUID, limit: int = 5, document_ids: Optional[List[str]] = None):
        """
        Embeds the query and searches the vector database.
        Returns context strings, source metadata, and average similarity score.
        """
        query_embedding = self.embedding_service.embed_query(query)
        
        # Use the with_scores method for metadata
        results = await self.knowledge_repo.search_similar_chunks_with_scores(
            workspace_id=workspace_id,
            embedding_vector=query_embedding,
            limit=limit,
        )
        
        context = []
        sources = []
        seen_docs = set()
        similarity_scores = []
        
        for row in results:
            content, doc_title, doc_id, similarity = row
            context.append(content)
            sim_val = float(similarity) if similarity else 0
            similarity_scores.append(sim_val)
            # Deduplicate sources by document_id
            doc_id_str = str(doc_id)
            if doc_id_str not in seen_docs:
                seen_docs.add(doc_id_str)
                sources.append({
                    "title": doc_title or "Untitled Document",
                    "document_id": doc_id_str,
                    "score": round(sim_val, 3),
                })
        
        # Compute average similarity across all retrieved chunks
        avg_similarity = sum(similarity_scores) / len(similarity_scores) if similarity_scores else 0.0
        
        return context, sources, avg_similarity
