"""
RAG Pipeline Tests
==================
Tests for the RAG pipeline components:
  - Text extraction (PDF, DOCX, TXT, CSV, MD)
  - Chunking
  - Embedding service
  - Retriever
  - Graph orchestration

Run:
    cd /Users/tarunnagpal/Documents/insydr/backend
    python -m pytest app/tests/test_rag.py -v
"""

import os
import tempfile
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest

from app.rag.ingest import IngestionPipeline, SUPPORTED_EXTENSIONS


# ─── Text Extraction Tests ───

class TestTextExtraction:
    """Tests for document text extraction across all supported formats."""

    def setup_method(self):
        self.pipeline = IngestionPipeline()

    def test_supported_extensions(self):
        """All expected extensions should be in the supported set."""
        for ext in [".pdf", ".docx", ".txt", ".csv", ".md"]:
            assert ext in SUPPORTED_EXTENSIONS

    def test_extract_txt(self):
        """TXT extraction should return the file content."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("Hello, this is a test document.\nSecond line.")
            f.flush()
            text = self.pipeline._extract_text(f.name)
        os.unlink(f.name)
        assert "Hello, this is a test document." in text
        assert "Second line." in text

    def test_extract_md(self):
        """Markdown extraction should preserve structure."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".md", delete=False) as f:
            f.write("# Heading\n\nParagraph text.\n\n## Subheading\n\nMore text.")
            f.flush()
            text = self.pipeline._extract_text(f.name)
        os.unlink(f.name)
        assert "# Heading" in text
        assert "Paragraph text." in text

    def test_extract_csv(self):
        """CSV extraction should convert rows to structured text."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False) as f:
            f.write("Question,Answer\nWhat is AI?,Artificial Intelligence\nWhat is ML?,Machine Learning")
            f.flush()
            text = self.pipeline._extract_text(f.name)
        os.unlink(f.name)
        assert "Question: What is AI?" in text
        assert "Answer: Artificial Intelligence" in text

    def test_unsupported_extension_raises(self):
        """Unsupported file type should raise ValueError."""
        with tempfile.NamedTemporaryFile(suffix=".xyz", delete=False) as f:
            f.write(b"data")
            f.flush()
        with pytest.raises(ValueError, match="Unsupported file type"):
            self.pipeline._extract_text(f.name)
        os.unlink(f.name)

    def test_extract_empty_txt(self):
        """Empty text file should return empty string."""
        with tempfile.NamedTemporaryFile(mode="w", suffix=".txt", delete=False) as f:
            f.write("")
            f.flush()
            text = self.pipeline._extract_text(f.name)
        os.unlink(f.name)
        assert text == ""


# ─── Chunking Tests ───

class TestChunking:
    """Tests for text chunking."""

    def test_chunking_produces_chunks(self):
        from app.rag.chunker import chunk_text
        text = "This is a test. " * 500  # Long enough to produce multiple chunks
        chunks = chunk_text(text)
        assert len(chunks) > 0
        assert all(isinstance(c, str) for c in chunks)

    def test_chunking_empty_text(self):
        from app.rag.chunker import chunk_text
        chunks = chunk_text("")
        # Should handle gracefully — either empty list or single empty chunk
        assert isinstance(chunks, list)


# ─── Embedding Service Tests ───

class TestEmbeddingService:
    """Tests for the embedding service (with mocked HF API)."""

    @patch("app.rag.embeddings.EmbeddingService.__init__", return_value=None)
    def test_empty_text_returns_zeros(self, mock_init):
        from app.rag.embeddings import EmbeddingService
        svc = EmbeddingService()
        svc.client = MagicMock()
        svc.model = "test-model"
        
        result = svc._get_embedding("")
        assert result == [0.0] * 384

    @patch("app.rag.embeddings.EmbeddingService.__init__", return_value=None)
    def test_embed_query_calls_get_embedding(self, mock_init):
        from app.rag.embeddings import EmbeddingService
        svc = EmbeddingService()
        svc.client = MagicMock()
        svc.model = "test-model"
        svc._get_embedding = MagicMock(return_value=[0.1] * 384)
        
        result = svc.embed_query("hello world")
        assert len(result) == 384
        svc._get_embedding.assert_called_once_with("hello world")


# ─── Ingestion Pipeline Tests ───

class TestIngestionPipeline:
    """Tests for the full ingestion pipeline."""

    @patch("app.rag.embeddings.EmbeddingService.__init__", return_value=None)
    def test_embed_chunks_structure(self, mock_init):
        pipeline = IngestionPipeline()
        pipeline.embedding_service = MagicMock()
        pipeline.embedding_service.embed_documents = MagicMock(
            return_value=[[0.1] * 384, [0.2] * 384]
        )
        
        chunks_data = pipeline._embed_chunks(["chunk one", "chunk two"])
        assert len(chunks_data) == 2
        assert chunks_data[0]["content"] == "chunk one"
        assert chunks_data[0]["chunk_index"] == 0
        assert len(chunks_data[0]["embedding"]) == 384
        assert "token_count" in chunks_data[0]

    @patch("app.rag.embeddings.EmbeddingService.__init__", return_value=None)
    def test_process_text_sync(self, mock_init):
        pipeline = IngestionPipeline()
        pipeline.embedding_service = MagicMock()
        pipeline.embedding_service.embed_documents = MagicMock(
            return_value=[[0.1] * 384]
        )
        
        result = pipeline._process_text_sync("Hello world test input.", "My Doc")
        assert result["title"] == "My Doc"
        assert len(result["chunks"]) > 0


# ─── RAGGraph Tests ───

class TestRAGGraph:
    """Tests for the RAG graph orchestrator (with mocks)."""

    @pytest.mark.asyncio
    async def test_process_message_returns_string(self):
        """process_message should return a string response."""
        from app.rag.graph import RAGGraph
        
        mock_session = AsyncMock()
        
        with patch.object(RAGGraph, '__init__', return_value=None):
            graph = RAGGraph.__new__(RAGGraph)
            graph.session = mock_session
            graph.retriever = MagicMock()
            graph.llm_service = MagicMock()
            
            # Mock the workflow
            mock_result = {
                "messages": [MagicMock(content="Here is the answer")],
                "context": ["some context"],
                "avg_similarity": 0.8,
            }
            graph.workflow = AsyncMock()
            graph.workflow.ainvoke = AsyncMock(return_value=mock_result)
            
            result = await graph.process_message(
                question="What is AI?",
                workspace_id=uuid4(),
            )
            assert result == "Here is the answer"
