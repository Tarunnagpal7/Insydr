from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid

from app.db.base import Base, UUIDBase


class Embedding(UUIDBase, Base):
    __tablename__ = "embeddings"

    chunk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    embedding: Mapped[list[float]] = mapped_column(Vector(1536))
    model_name: Mapped[str]
    dimension: Mapped[int]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
