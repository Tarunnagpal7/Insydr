from sqlalchemy import String, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class ApiKey(UUIDBase, Base):
    __tablename__ = "api_keys"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    key_hash: Mapped[str]
    key_prefix: Mapped[str]
    name: Mapped[str]

    allowed_domains: Mapped[list | None] = mapped_column(JSON)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    requests_count: Mapped[int] = mapped_column(default=0)

    last_used_at: Mapped[datetime | None]
    expires_at: Mapped[datetime | None]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
