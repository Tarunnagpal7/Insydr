from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class Agent(UUIDBase, Base):
    __tablename__ = "agents"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    widget_config_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True))

    name: Mapped[str]
    description: Mapped[str | None]
    agent_type: Mapped[str]
    status: Mapped[str]
    version: Mapped[str]

    configuration: Mapped[dict | None] = mapped_column(JSON)
    behavior_settings: Mapped[dict | None] = mapped_column(JSON)
    response_config: Mapped[dict | None] = mapped_column(JSON)
    conversation_rules: Mapped[dict | None] = mapped_column(JSON)

    greeting_message: Mapped[str | None]
    fallback_message: Mapped[str | None]

    published_at: Mapped[datetime | None]
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
