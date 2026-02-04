import os
from pathlib import Path
from typing import List, Dict, Any
from pypdf import PdfReader
from app.rag.chunker import chunk_text
from app.rag.embeddings import EmbeddingService

class IngestionPipeline:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    def process_document(self, file_path: str) -> Dict[str, Any]:
        print(f"[DEBUG] Starting ingestion for {file_path}")
        """
        Extracts text, chunks it, and generates embeddings.
        Returns a dict with 'title', 'chunks' (content, embedding, index, tokens).
        """
        # 1. Extract Text
        text = self._extract_text(file_path)
        title = Path(file_path).stem

        # 2. Chunk Text
        text_chunks = chunk_text(text)

        # 3. Embed Chunks
        chunks_data = []
        
        # Batch embedding
        # Process in batches of 32 to avoid timeouts or payload issues
        batch_size = 32
        embeddings = []
        
        for i in range(0, len(text_chunks), batch_size):
            batch = text_chunks[i : i + batch_size]
            try:
                batch_embeddings = self.embedding_service.embed_documents(batch)
                embeddings.extend(batch_embeddings)
            except Exception as e:
                print(f"Error embedding batch {i}: {e}")
                # Fallback: try one by one or just fill zeros? 
                # Better to fail loudly or re-try.
                # For MVP, fill with zeros to save partial progress is risky.
                # Let's assume re-try logic or fail.
                raise e

        for i, chunk_content in enumerate(text_chunks):
            # approximate token count
            token_count = len(chunk_content.split())
            
            # Ensure embedding exists
            embedding_vector = embeddings[i] if i < len(embeddings) else [0.0]*384
            
            chunks_data.append({
                "content": chunk_content,
                "embedding": embedding_vector,
                "chunk_index": i,
                "token_count": token_count
            })

        return {
            "title": title,
            "chunks": chunks_data
        }

    def _extract_text(self, file_path: str) -> str:
        text = ""
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        except Exception as e:
            print(f"Error reading PDF: {e}")
            raise e
        return text
