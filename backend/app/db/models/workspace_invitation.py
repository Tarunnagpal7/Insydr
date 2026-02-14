from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class WorkspaceInvitation(UUIDBase, Base):
    __tablename__ = "workspace_invitations"

    workspace_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    inviter_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    
    email: Mapped[str] = mapped_column(String, index=True)
    token: Mapped[str] = mapped_column(String, unique=True, index=True)
    role: Mapped[str] = mapped_column(String, default="MEMBER")
    
    status: Mapped[str] = mapped_column(String, default="PENDING") # PENDING, ACCEPTED, EXPIRED
    expires_at: Mapped[datetime]
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    accepted_at: Mapped[datetime | None]
