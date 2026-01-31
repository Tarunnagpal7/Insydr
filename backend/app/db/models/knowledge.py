from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class KnowledgeCollection(UUIDBase, Base):
    __tablename__ = "knowledge_collections"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    name: Mapped[str]
    description: Mapped[str | None]
    meta: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
