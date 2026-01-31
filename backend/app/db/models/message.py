from sqlalchemy import DateTime, JSON, Float, Integer, Text, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class Message(UUIDBase, Base):
    __tablename__ = "messages"

    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    role: Mapped[str]
    content: Mapped[str] = mapped_column(Text)

    meta: Mapped[dict | None] = mapped_column(JSON)
    confidence_score: Mapped[float | None]
    token_count: Mapped[int | None]
    response_time_ms: Mapped[int | None]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
