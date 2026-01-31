from sqlalchemy import String, DateTime, JSON, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class Document(UUIDBase, Base):
    __tablename__ = "documents"

    collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    title: Mapped[str]
    source_type: Mapped[str]
    source_url: Mapped[str | None]
    file_path: Mapped[str | None]

    status: Mapped[str]
    version_number: Mapped[int]

    meta: Mapped[dict | None] = mapped_column(JSON)
    language: Mapped[str | None]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
