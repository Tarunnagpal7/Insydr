from sqlalchemy import DateTime, Float, Integer, JSON, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from datetime import date
from app.db.base import Base, UUIDBase


class UsageMetric(UUIDBase, Base):
    __tablename__ = "usage_metrics"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    metric_date: Mapped[date] = mapped_column(Date)
    conversation_count: Mapped[int]
    message_count: Mapped[int]
    token_count: Mapped[int]

    avg_confidence_score: Mapped[float | None]
    avg_response_time_ms: Mapped[float | None]
    language_distribution: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
