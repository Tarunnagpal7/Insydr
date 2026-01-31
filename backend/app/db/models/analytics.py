from sqlalchemy import String, DateTime, Float, Integer, JSON, Date
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base


class UsageMetric(Base):
    __tablename__ = "usage_metrics"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    workspace_id: Mapped[str] = mapped_column(String)
    agent_id: Mapped[str] = mapped_column(String)

    metric_date: Mapped[datetime]
    conversation_count: Mapped[int]
    message_count: Mapped[int]
    token_count: Mapped[int]

    avg_confidence_score: Mapped[float | None]
    avg_response_time_ms: Mapped[float | None]
    language_distribution: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
