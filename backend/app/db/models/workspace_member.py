from sqlalchemy import String, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class WorkspaceMember(UUIDBase, Base):
    __tablename__ = "workspace_members"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    role: Mapped[str]
    permissions: Mapped[dict | None] = mapped_column(JSON)

    joined_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
