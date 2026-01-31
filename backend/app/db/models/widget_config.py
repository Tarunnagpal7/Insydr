from sqlalchemy import DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class WidgetConfig(UUIDBase, Base):
    __tablename__ = "widget_configs"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    appearance: Mapped[dict | None] = mapped_column(JSON)
    behavior: Mapped[dict | None] = mapped_column(JSON)
    security: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
