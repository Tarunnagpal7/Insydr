from sqlalchemy import DateTime, Float, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class MessageSource(UUIDBase, Base):
    __tablename__ = "message_sources"

    message_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    chunk_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    relevance_score: Mapped[float]
    rank: Mapped[int]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
