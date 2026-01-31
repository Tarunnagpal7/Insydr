from sqlalchemy import String, Boolean, DateTime
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base, UUIDBase


class User(UUIDBase, Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str]
    full_name: Mapped[str]

    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    email_verified_at: Mapped[datetime | None]

    last_login_at: Mapped[datetime | None]

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
