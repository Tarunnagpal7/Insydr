from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base, UUIDBase


class Workspace(UUIDBase, Base):
    __tablename__ = "workspaces"

    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    name: Mapped[str]
    slug: Mapped[str] = mapped_column(String, unique=True, index=True)
    logo_url: Mapped[str | None]
    timezone: Mapped[str] = mapped_column(default="UTC")
    language: Mapped[str] = mapped_column(default="en")

    subscription_tier: Mapped[str] = mapped_column(default="FREE")
    settings: Mapped[dict | None] = mapped_column(JSON)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

