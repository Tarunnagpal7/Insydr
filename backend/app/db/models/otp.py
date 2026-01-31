from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from app.db.base import Base, UUIDBase


class OTP(UUIDBase, Base):
    __tablename__ = "otps"

    email: Mapped[str] = mapped_column(String, index=True)
    otp_code: Mapped[str] = mapped_column(String(6))
    purpose: Mapped[str]  # 'email_verification', 'password_reset'
    
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime]
    
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
