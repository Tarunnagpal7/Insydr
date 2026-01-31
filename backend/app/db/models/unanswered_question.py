from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class UnansweredQuestion(UUIDBase, Base):
    __tablename__ = "unanswered_questions"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    question: Mapped[str]
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[str]

    first_seen_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    last_seen_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    resolved_at: Mapped[datetime | None]
