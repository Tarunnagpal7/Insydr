from sqlalchemy import DateTime, JSON, Integer, Text, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class WebhookLog(UUIDBase, Base):
    __tablename__ = "webhook_logs"

    webhook_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    event_type: Mapped[str]
    payload: Mapped[dict] = mapped_column(JSON)

    status_code: Mapped[int]
    response_body: Mapped[str | None] = mapped_column(Text)
    retry_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
