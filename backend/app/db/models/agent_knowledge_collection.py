from sqlalchemy import DateTime, Integer
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
from app.db.base import Base, UUIDBase


class AgentKnowledgeCollection(UUIDBase, Base):
    __tablename__ = "agent_knowledge_collections"

    agent_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    collection_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))

    priority: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
