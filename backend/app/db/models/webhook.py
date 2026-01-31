from sqlalchemy import DateTime, Boolean, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class Webhook(UUIDBase, Base):
    __tablename__ = "webhooks"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    name: Mapped[str]
    url: Mapped[str]
    event_types: Mapped[list] = mapped_column(JSON)
    secret: Mapped[str]

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    headers: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
