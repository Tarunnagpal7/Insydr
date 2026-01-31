from sqlalchemy import DateTime, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class Conversation(UUIDBase, Base):
    __tablename__ = "conversations"

    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    session_id: Mapped[str]
    user_ip: Mapped[str | None]
    user_agent: Mapped[str | None]
    language: Mapped[str | None]

    meta: Mapped[dict | None] = mapped_column(JSON)
    status: Mapped[str]

    started_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    ended_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
